import { expect, test } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';

const screenshotOptions = {
  animations: 'disabled' as const,
  maxDiffPixelRatio: 0.03,
  threshold: 0.25,
};

async function waitFor3DCanvas(page: Page) {
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    return Boolean(canvas && canvas.width > 100 && canvas.height > 100);
  });
}

function skipNonDesktop(testInfo: TestInfo) {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Visual baselines are captured on desktop Chromium.');
}

test.describe('visual regression snapshots', () => {
  test('1D intensity field canvas remains visually stable', async ({ page }, testInfo) => {
    skipNonDesktop(testInfo);
    await page.goto('/?tab=simulator&animated1d=0', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('1D Intensity Field Lab')).toBeVisible();
    await expect(page.getByRole('region', { name: /1D intensity field chart/i }))
      .toHaveScreenshot('1d-intensity-field.png', screenshotOptions);
  });

  test('2D surface field map remains visually stable', async ({ page }, testInfo) => {
    skipNonDesktop(testInfo);
    await page.goto('/?tab=surface2d&shape2d=rectangle&loading2d=uniform', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('2D Surface Field Lab')).toBeVisible();
    await expect(page.getByRole('img', { name: /2D .* map/i }))
      .toHaveScreenshot('2d-surface-field-map.png', screenshotOptions);
  });

  test('3D volume field canvas remains visually stable', async ({ page }, testInfo) => {
    skipNonDesktop(testInfo);
    await page.goto('/?tab=volume3d&shape3d=box&loading3d=uniform&ellipsoid3d=0', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Volumetric Distribution')).toBeVisible();
    await waitFor3DCanvas(page);
    await expect(page.locator('canvas')).toHaveScreenshot('3d-volume-field-canvas.png', {
      ...screenshotOptions,
      maxDiffPixelRatio: 0.08,
    });
  });
});
