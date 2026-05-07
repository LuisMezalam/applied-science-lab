# Applied Science Lab

Applied Science Lab is an interactive engineering physics simulator built around one idea:
many engineering quantities can be understood as a nonnegative intensity field over a
domain. Once the domain and intensity are clear, the same moment ladder explains total
amount, centroid, spread, localization, and sign policy across mechanics, heat transfer,
fluids, circuits, dynamics, propulsion, materials, and waves.

This repository contains the public beta application, local verification setup, and
production-readiness notes.

## What Is Inside

- 1D intensity field simulator for line, time, and parameter domains.
- 2D surface field simulator for pressure, heat flux, traction, and footprint-style fields.
- 3D volume field simulator with point density, slicing, color maps, centroids, and inverse moments.
- Graph moment lab for circuit, FEA error, and compliance intensities.
- Roadmap Labs for section properties, beam energy, frequency spectra, heat fins, propulsion maps, and stress hotspots.
- Unified Library with formula blocks, sign-policy notes, aliases, and interactive/candidate badges.
- Shareable URL state for simulator controls and active labs.
- Playwright smoke tests, mobile checks, 3D canvas nonblank checks, and desktop visual baselines.

## Tech Stack

- Vite
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui and Radix UI
- React Three Fiber / Three.js
- Recharts
- Vitest
- Playwright

## Getting Started

Requirements:

- Node.js 20 or newer
- npm

Install and run locally:

```sh
npm ci
npm run dev
```

The development server defaults to Vite's local URL. Playwright uses its own strict test
port so it can run without colliding with an existing dev session.

## Verification

Run the full local verification suite:

```sh
npm run verify
```

Or run the pieces separately:

```sh
npm run audit:prod
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Current known local signals:

- Lint has app-safe Fast Refresh warnings in shared shadcn/ui helper files.
- Development-only audit issues may require breaking upgrades to Vite/esbuild/jsdom.
- Formula QA has a checklist, but each entry still needs human technical review before being marked reviewed.

## GitHub Pages

This repo includes a GitHub Pages workflow at `.github/workflows/pages.yml`.

For a normal project page, the workflow builds with `/<repo-name>/` as the Vite base path.
For a root Pages repository named like `username.github.io`, it builds with `/`.

To publish:

1. Push the repository to GitHub.
2. In repository settings, enable GitHub Pages with "GitHub Actions" as the source.
3. Push to `main` or run the "Deploy GitHub Pages" workflow manually.

For another static host, run:

```sh
npm run build
```

Then deploy the `dist` directory.

## Content And Source Policy

The app is designed for copyright-safe learning:

- Do not copy textbook prose into the Library.
- Paraphrase explanations in original language.
- Use equations, derived relationships, and high-level source notes.
- Keep signed quantities explicit: magnitude, square, physical nonnegative energy/power, or positive/negative split.

See `docs/content-and-source-policy.md`, `docs/formula-qa-checklist.md`, and
`docs/production-readiness-roadmap.md` for the current release trail.

## Status

The app is close to public beta: core tabs load, production builds pass, smoke tests cover
desktop/mobile, and the main simulators have visual and math regression coverage.

Before calling it production-grade, finish formula QA review, remote CI validation,
accessibility review, and deployment/privacy decisions.
