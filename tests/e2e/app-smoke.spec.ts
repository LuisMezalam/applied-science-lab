import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const TAB_SMOKE_CASES = [
  { tab: 'simulator', text: '1D Intensity Field Lab' },
  { tab: 'surface2d', text: '2D Surface Field Lab' },
  { tab: 'volume3d', text: 'Volumetric Distribution' },
  { tab: 'graph', text: 'Node-Edge Intensities As Moment Fields' },
  { tab: 'labs', text: 'Engineering Intensity Modules' },
  { tab: 'comparison', text: 'Cross-Domain Unification' },
  { tab: 'balance', text: 'Balance-Law Backbone' },
  { tab: 'library', text: 'Intensity Fields Across Engineering Physics' },
] as const;

async function expectNoRuntimeFailure(page: Page, pageErrors: Error[]) {
  await expect(page.getByText('The lab hit a runtime error.')).toHaveCount(0);
  expect(pageErrors.map(error => error.message)).toEqual([]);
}

async function expectNoDocumentOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const documentWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth
    );
    return documentWidth - window.innerWidth;
  });

  expect(overflow).toBeLessThanOrEqual(24);
}

async function gotoTab(page: Page, tab: string) {
  await page.goto(`/?tab=${tab}`, { waitUntil: 'domcontentloaded' });
}

async function waitFor3DCanvas(page: Page) {
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    return Boolean(canvas && canvas.width > 100 && canvas.height > 100);
  });
}

test.describe('primary tab smoke coverage', () => {
  for (const { tab, text } of TAB_SMOKE_CASES) {
    test(`${tab} tab loads on the current viewport`, async ({ page }) => {
      const pageErrors: Error[] = [];
      page.on('pageerror', error => pageErrors.push(error));

      await gotoTab(page, tab);
      await expect(page.getByText(text).first()).toBeVisible();
      if (tab === 'volume3d') {
        await waitFor3DCanvas(page);
      }
      await expectNoRuntimeFailure(page, pageErrors);
      await expectNoDocumentOverflow(page);
    });
  }
});

test.describe('3D canvas smoke coverage', () => {
  test('3D WebGL canvas is nonblank on the current viewport', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', error => pageErrors.push(error));

    await gotoTab(page, 'volume3d');
    await expect(page.getByText('Volumetric Distribution')).toBeVisible();
    await waitFor3DCanvas(page);

    const analysis = await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      if (!canvas || canvas.width === 0 || canvas.height === 0) return false;

      const gl =
        canvas.getContext('webgl2', { preserveDrawingBuffer: true }) ??
        canvas.getContext('webgl', { preserveDrawingBuffer: true }) ??
        canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });

      if (!gl) return false;

      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      if (width === 0 || height === 0) return false;

      const pixels = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      let bright = 0;
      let varied = 0;
      let total = 0;
      const sampleEvery = Math.max(1, Math.floor(Math.sqrt((width * height) / 4096)));

      for (let y = 0; y < height; y += sampleEvery) {
        for (let x = 0; x < width; x += sampleEvery) {
          const index = (y * width + x) * 4;
          const r = pixels[index];
          const g = pixels[index + 1];
          const b = pixels[index + 2];
          const brightness = (r + g + b) / 3;
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);

          if (brightness > 24) bright += 1;
          if (chroma > 16) varied += 1;
          total += 1;
        }
      }

      const brightPct = total > 0 ? bright / total : 0;
      const variedPct = total > 0 ? varied / total : 0;

      return brightPct > 0.01 && variedPct > 0.01
        ? { width, height, total, bright, varied, brightPct, variedPct }
        : false;
    }, undefined, { timeout: 15_000 });

    const result = await analysis.jsonValue() as {
      width: number;
      height: number;
      total: number;
      bright: number;
      varied: number;
      brightPct: number;
      variedPct: number;
    };

    expect(result.width).toBeGreaterThan(100);
    expect(result.height).toBeGreaterThan(100);
    expect(result.brightPct).toBeGreaterThan(0.01);
    expect(result.variedPct).toBeGreaterThan(0.01);
    await expectNoRuntimeFailure(page, pageErrors);
  });
});

test.describe('state sharing', () => {
  test('3D URL state restores and can be copied as a share link', async ({ context, page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Clipboard checks run on desktop Chromium.');

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/?tab=volume3d&density3d=8&slice3d=50&color3d=viridis', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Volumetric Distribution')).toBeVisible();
    await expect(page.getByText('Point Density: 8')).toBeVisible();
    await expect(page.getByText('Visible Z Slice: 50%')).toBeVisible();
    await expect(page.getByText('viridis').first()).toBeVisible();

    await page.getByRole('button', { name: /copy share link/i }).click();
    await expect(page.getByText('Share link copied', { exact: true })).toBeVisible();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('tab=volume3d');
    expect(clipboardText).toContain('density3d=8');
    expect(clipboardText).toContain('slice3d=50');
    expect(clipboardText).toContain('color3d=viridis');
  });
});
