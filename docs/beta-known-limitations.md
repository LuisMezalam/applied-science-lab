# Public Beta Known Limitations

This app is ready to share as a beta/research demo only after the remaining P0 checks are satisfied.

## Current Known Limitations

- Library content still needs a full formula, units, and sign-policy QA pass.
- Textbook-informed expansion must remain paraphrased and copyright-safe.
- Browser smoke tests are not yet automated in CI.
- Some dense tensor and comparison panels are usable on mobile but still need a dedicated accessibility pass.
- The 3D simulator is visually verified locally, but it needs automated canvas smoke checks before production.
- Full `npm audit` still reports development-only issues in `jsdom` and Vite/esbuild that require breaking upgrades; `npm audit --omit=dev` is clean.
- Bundle splitting has started, but route-level performance budgets and Lighthouse checks are not yet defined.

## Suggested Beta Notice

Applied Science Lab is in public beta. Simulators are intended for intuition and exploration, not final engineering design decisions. Always verify formulas, assumptions, sign conventions, and units before professional use.
