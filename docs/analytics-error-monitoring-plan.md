# Privacy-Friendly Analytics and Error Monitoring Plan

Applied Science Lab should collect the minimum telemetry needed to improve reliability and learning flow. No analytics event should include textbook text, user-entered freeform notes, precise location, email, or other directly identifying data.

## Default Beta Policy

- Start with no third-party analytics until the public beta deployment target is chosen.
- Log production errors through a privacy-focused provider only after enabling source maps for maintainers and redacting URLs.
- Treat query strings as potentially instructional state. Store route names and tab names, not full simulator URLs.
- Publish a short privacy note in the app footer before enabling telemetry.

## Allowlisted Events

| Event | Purpose | Allowed fields |
| --- | --- | --- |
| `tab_opened` | Understand which labs are most useful. | tab id, viewport bucket, app version |
| `share_link_copied` | Measure whether URL state sharing is useful. | tab id, app version |
| `library_search_used` | Improve aliases and missing terms. | result count bucket, active domain filter, app version |
| `simulator_parameter_changed` | Find confusing controls. | tab id, control id, coarse value bucket |
| `runtime_error` | Fix production crashes. | route id, component boundary, browser family, app version, redacted stack |

## Redaction Rules

- Do not persist raw URLs. Replace query values with `[state]` or store only known tab/control keys.
- Bucket numbers before sending them: small, medium, large, or percent ranges.
- Strip stack traces of local filesystem paths before sending.
- Do not capture screenshots, session replay, keystrokes, or form contents.
- Honor `Do Not Track` and a future in-app telemetry opt-out.

## Candidate Stack

- Analytics: Plausible, PostHog with autocapture disabled, or a self-hosted minimal endpoint.
- Error monitoring: Sentry or GlitchTip with URL/query redaction, source-map upload, and sample-rate controls.
- Version tagging: use the package version and deployment commit SHA when CI/CD is available.

## Production Gate

Telemetry can be enabled only after these checks are true:

- Privacy note is visible from the app.
- Event schema is reviewed against this document.
- Error reports redact query strings in staging.
- CI has lint, unit, build, and Playwright checks passing.
- A maintainer has verified that no event stores textbook-derived prose or user-entered freeform content.
