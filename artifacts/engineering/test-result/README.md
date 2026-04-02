# Engineering Test Results

Store durable per-ticket review evidence here so reviewers can inspect each ticket independently of the implementation repository.

Convention:

- `artifacts/engineering/test-result/<platform>/<ticket-slug>/`

Expected contents per ticket folder:

- `e2e-evidence.md` or another short reviewer summary
- `results.xml` and `results.json` when available
- `playwright-report/` or equivalent report output
- screenshots, videos, traces, or other reviewer-friendly artifacts

`<platform>` should normally match the target repository name.

`<ticket-slug>` should be stable and human-readable, for example:

- `fe-sign-in-build-landing-sign-in-flow-and-protected-shell-ui-with-mocked-auth-contract`
- `fe-review-tasks-build-inbox-list-with-filters-and-source-context`
