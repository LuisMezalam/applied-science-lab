# Applied Science Lab Production Readiness Roadmap

This roadmap turns the current simulator into a public beta first, then a durable production educational tool. The ordering is intentional: stabilize the app shell and math regressions before expanding more content.

## Release Targets

### Public Beta

Goal: safe to share broadly as an interactive research demo.

Exit criteria:

- Core 1D, 2D, 3D, Graph, Labs, Compare, Balance, and Library tabs load without runtime crashes.
- Main simulator math has regression tests for known simple fields.
- Metadata no longer says "Lovable App".
- Production build has no app-owned TypeScript or lint errors.
- Known limitations are documented.
- No textbook prose is copied verbatim into Library entries.

### Production Educational Tool

Goal: resilient enough for public classroom/self-study use.

Exit criteria:

- Critical formulas and sign policies have a written review trail.
- E2E smoke checks cover every primary tab at desktop and mobile widths.
- Heavy tabs are code split to keep initial load reasonable.
- Runtime crashes show a useful recovery UI.
- Content is versioned with source notes and copyright-safe paraphrases.
- Accessibility pass covers keyboard navigation, color contrast, headings, and chart alternatives.
- Deployment has preview/staging/prod checks, analytics/privacy decisions, and error monitoring.

## P0 - Must Do Before Public Beta

1. Replace generated/default metadata with Applied Science Lab title, description, social tags, and theme color.
2. Fix owned build warnings where practical, starting with CSS `@import` order.
3. Add an app-level error boundary so a tab failure does not blank the app.
4. Add math regression tests for simple 1D, 2D, and 3D fields.
5. Code split heavy feature tabs, especially 3D, Library, Roadmap Labs, and Graph.
6. Document copyright/content policy for textbook-derived learning: paraphrase, derive, cite at a high level, do not copy.
7. Keep a known-limitations list for beta users.

## P1 - Strongly Recommended Before Production

1. Add Playwright/Vitest browser smoke tests for all tabs and key interactions.
2. Add visual regression snapshots for 1D/2D/3D canvases.
3. Add formula QA checklist entries for every Library term: equation, domain, sign policy, units, centroid, spread, inverse moment counterpart.
4. Improve mobile density for large result tables and tensor matrices.
5. Add route/query-state persistence for selected tab, domain, shape, and active lab.
6. Add loading skeletons for lazy-loaded tabs.
7. Add accessibility labels for chart layers, icon-only controls, and 3D canvas instructions.
8. Add a privacy-friendly analytics and error-monitoring plan.

## P2 - Product Expansion

1. Add interactive modules for the highest-value roadmap concepts: beam diagrams, thermal resistance networks, stress transformation/Mohr circle, frequency response, FEA mesh convergence.
2. Add guided lessons that connect "intensity field over a domain" to each engineering domain.
3. Add export/share links for simulator states.
4. Add saved examples and teacher/student handoff presets.
5. Add richer 3D field controls: clipping planes, point density, color maps, and domain slicing.
6. Add a Library search index with aliases, equations, and "make this interactive" badges.

## Implementation Log

Started in this pass:

- Production metadata.
- CSS import warning cleanup.
- App-level error boundary.
- Lazy-loaded tab modules.
- Baseline math regression tests.
- Content/source safety policy.
- Beta known-limitations document.
- Production dependency audit cleanup; `npm audit --omit=dev` is clean.
- Playwright E2E smoke suite for every primary tab on desktop and mobile, including 3D canvas nonblank checks and document overflow guards.
- Balance-law arrow label layout fix surfaced by the new overflow guard.
- GitHub Actions CI workflow for production audit, lint, unit tests, production build, and Playwright E2E smoke tests.
- Route/query-state persistence for primary tab, 1D simulator state, 2D simulator state, 3D simulator state, graph scenario, roadmap lab, comparison sliders, and balance-law domain.
- Accessibility labels and screen-reader summaries for primary navigation, 1D chart region, 2D SVG map, and 3D canvas scene.
- Visual regression snapshots for 1D, 2D, and 3D simulator surfaces.
- Formula QA ledger covering all 85 Library atlas entries in `docs/formula-qa-checklist.md`.
- Privacy-friendly analytics and error-monitoring plan in `docs/analytics-error-monitoring-plan.md`.
- Global share-link button for URL-encoded simulator and Library state.
- Mobile card layout for the 3D inverse-moment comparison table, including tensor and directional effective-radius values.
- Library search aliases by domain/kind/status and visible Interactive / Make interactive module badges.
- 3D volume controls for point density, Z slicing/clipping, and color-map selection.
- Replaced generated Lovable README with a publish-ready project README.
- Added `typecheck`, `audit:prod`, and `verify` package scripts.
- Added CI typecheck coverage.
- Added GitHub Pages deployment workflow with project-page/root-page base-path handling.
- Split heavy Three.js, chart, math, and motion dependencies into vendor chunks.
- Added a public beta footer note that no analytics or telemetry is enabled.

Remaining after this pass:

- Full audit still reports development-only issues that require breaking upgrades to Vite/esbuild and jsdom.
- CI is wired locally in `.github/workflows/ci.yml`; the first remote run still needs to be checked after this branch is pushed.
- Library formulas, sign policies, units, and copyright safety now have a QA ledger, but each entry still needs human technical review before being marked reviewed.
