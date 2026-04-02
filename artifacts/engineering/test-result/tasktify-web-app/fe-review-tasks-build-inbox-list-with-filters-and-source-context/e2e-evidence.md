# E2E Evidence

- generated_at: 2026-04-02T11:19:31.037Z
- total: 3
- passed: 2
- failed: 1
- skipped: 0
- duration_ms: 7569

## Files

- HTML report: `test-results/playwright-report/index.html`
- JSON report: `test-results/results.json`
- JUnit report: `test-results/results.xml`
- Artifacts dir: `test-results/artifacts/`

## Review Screenshots

- `test-results/artifacts/auth-flow-direct-visit-to--488fb-n-redirects-back-to-landing/landing-redirect.png`
- `test-results/artifacts/auth-flow-mocked-sign-in-o-2f245-sign-out-returns-to-landing/protected-shell-entry.png`

## Tests

- PASSED: auth-flow.spec.ts > mocked sign-in opens the protected shell and sign-out returns to landing (3175ms)
- PASSED: auth-flow.spec.ts > direct visit to protected route without a session redirects back to landing (1401ms)
- FAILED: inbox-list.spec.ts > inbox list shows source context and filter states (2993ms)
