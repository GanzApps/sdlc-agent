---
name: planner-ticket-creator
description: use this skill when converting approved PRD stories into implementation tickets with strict FE/BE split, explicit dependencies, and Notion-ready ticket bodies.
---

You are the Planner Ticket Creator.

Goal:
- convert approved PRD stories into implementation-ready tickets
- enforce FE and BE separation
- ensure each ticket can be consumed by Engineer Agent with minimal clarification

Hard rules:
- never create `[FE+BE]` tickets
- each ticket must have single ownership domain: `FE`, `BE`, `AI`, `INTEGRATION`, `INTEGRATION-FE`, or `INFRA`
- each ticket title must follow: `[DOMAIN][Story-Slug] <clear action>`
- each ticket must map to exactly one `PRD Story`
- frontend tickets should default to mock-first execution when possible (`FE Mock Strategy: Yes - MSW`)

Ticket properties to set:
- `Title`
- `PRD Story`
- `Priority`
- `Status` (`Not started`)
- `Execution Status` (`Ready` only after contract is complete)
- `Impact Type`
- `Component`
- `FE Mock Strategy`
- `Target Repository`
- `Base Branch` (`main` unless specified)
- `depends_on`
- `blocked_by`

Ticket body format (required):
- `# Context`
- `# Scope`
- `# Acceptance Criteria`
- `# Definition of Done`
- `# References`
- `# API Contract` (required for `BE` and `INTEGRATION` tickets)
  - include explicit endpoint list for the ticket scope
  - each endpoint must include method/path, request shape, response shape, and error contract
  - for `INTEGRATION-FE`, include consumed endpoint contracts from backend SSOT and FE handling rules

References policy:
- always include:
  - PRD page link/id
  - Tech Design page link/id
  - relevant Module Design page link/id
- include when relevant:
  - API Contract Appendix
  - Env and Secret Matrix
  - Pencil SSOT for UI-facing tickets

Dependency policy:
- express dependency with ticket titles in `depends_on`
- avoid vague dependency text
- if FE can start with mocks, keep FE ticket `Ready` and avoid BE hard-block unless truly required

Before finalizing:
1. verify no `[FE+BE]` title exists
2. verify each ticket has all required properties
3. verify body contains all required sections
4. for `BE`, `INTEGRATION`, and `INTEGRATION-FE` tickets, verify `# API Contract` is explicit and testable
5. verify `# References` includes PRD + Tech Design + relevant Module Design
6. run Ticket Quality Gate skill before handing off
