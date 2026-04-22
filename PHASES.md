# Phases

This document defines the phase contract for the AI Agentic Delivery Framework.

## Approval rule

- agents may set `draft`, `ready`, `review`, `done`, or `blocked`
- only humans approve transition to the next phase

## Recommended approval transitions

- `draft -> review`: agent
- `review -> approved`: human only
- `approved -> ready-for-next-role`: human or framework process after approval is recorded
- `blocked -> draft` or `blocked -> review`: agent after blockers are cleared

## Phase contract

Each phase should define:
- purpose
- entry criteria
- required inputs
- required output artifact
- exit criteria
- approval required
- next role

## Recommended phase table

| Phase | Purpose | Entry criteria | Required output artifact | Exit criteria | Approval required | Next role |
|---|---|---|---|---|---|---|
| `initiation` | Verify workspace readiness and establish the work item. | Workspace exists, framework installed, intake artifact exists or is being created. | Delivery record URL | Connectors checked, workspace identity known, baseline status known or flagged. | Yes | `product-agent` |
| `product-definition` | Turn the intake artifact into a structured PRD. | Delivery record exists, intake artifact exists, docs connector ready. | PRD URL | PRD is complete enough for downstream work, assumptions and risks captured, handoff prepared. | Yes | `design-agent`, `techplan-agent` |
| `design-baseline` | Verify or create the design-system baseline. | Approved PRD exists, design connector ready. | Design baseline URL or explicit baseline status | Baseline exists, is created, or an approved gap decision is recorded. | Yes | `design-agent` |
| `feature-design` | Create the feature design from PRD and baseline. | Approved PRD exists, baseline status is known, design workspace ready. | Design spec URL | Design direction is clear, references are linked, and assumptions are captured. | Yes | `techplan-agent` |
| `technical-design` | Define the implementation approach, modules, contracts, and rollout boundaries. | Approved PRD exists, design context exists, docs connector ready. | Technical design URL | Impacted services, modules, dependencies, risks, and contracts are explicit. | Yes | `planner-agent` |
| `planning` | Turn approved artifacts into execution-ready tickets. | Technical design exists, tickets connector ready. | Ticket board or ticket set URL | Tickets are sliced, linked, quality-checked, and marked ready or blocked. | Yes | `engineer-agent` |
| `execution` | Implement a ready ticket in the target repository. | Ready ticket exists, target repository known, code connector ready. | Merge or pull request URL plus evidence links | Implementation complete, evidence attached, review handoff prepared. | Yes | `verification` or `devops-agent` when deployment work is needed |
| `verification` | Confirm the implementation is ready for acceptance, release, or deploy. | Implementation evidence exists, reviewable output exists. | Verification summary or evidence URL | Evidence is sufficient and blockers are closed or documented. | Yes | `devops-agent` or closeout |
| `release-deploy` | Apply infrastructure or deployment changes and record the outcome. | Approved deploy or infra request exists, environment is known, dependencies are ready. | Deployment record URL | Deployment verified, environment outcome recorded, endpoints or release notes captured. | Yes | Operations ownership or complete |

## Blocked rule

If a phase is blocked:
- the delivery record stays in the current phase
- the blocker must be recorded explicitly
- the next role does not activate
- the handoff must state what is missing
