# SDLC Agent Runtime

Codex-oriented SDLC workspace with:
- role skills (`product`, `design`, `techlead`, `planner`, `planner-ticket-creator`, `ticket-quality-gate`, `engineer`, `incident-engineer`, `devops`)
- runtime scaffold for orchestration and worker execution
- baseline reliability, observability, and test coverage
- CI and deployment workflow templates

## Included

- `AGENTS.md` for global workspace rules
- `skills/*/SKILL.md` for role-specific agent behavior
- `src/orchestrator/workflow-engine.js` (state machine)
- `src/adapters/notion/notion-queue.js` (Notion queue abstraction with claim and self-healing recovery)
- `src/workers/engineer-worker.js` (ticket consumer with retry/backoff)
- `src/libs/observability/*` (structured logging + metrics registry)
- `src/libs/reliability/*` (retry + lease utility)
- `tests/unit/*` and `tests/e2e/*`
- `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`

## Prerequisites

1. Node.js 20+
2. Codex CLI installed
3. Notion MCP connected in Codex:
   - `codex mcp add notion -- npx -y mcp-remote https://mcp.notion.com/mcp`
   - `codex mcp login notion`
4. Target Notion workspace/page prepared (example: Tasktify)

## Quickstart

```bash
npm test
cp .env.example .env
npm run start
```

Service endpoints:
- `GET /health`
- `GET /ready`
- `GET /metrics` (Prometheus-style plaintext)

## AI Workflow (Target)

1. Product Agent writes PRD in Notion.
2. Design Agent writes design output from approved PRD.
3. Tech Lead Agent writes implementation-ready tech doc (HLD, impacted services, module details, sequence diagrams).
4. Planner Agent creates engineering tickets in Notion/Jira from approved PRD + tech doc.
5. Planner Ticket Creator enforces FE/BE split and normalized ticket structure.
6. Ticket Quality Gate validates ticket contract completeness before execution.
7. Engineer Agent consumes `Ready` tickets and moves:
   - `Ready -> In Progress -> Review -> Done`
   - failed recoverable execution: retry/requeue
   - exhausted retry: `Failed`
8. DevOps Agent accepts requests such as `provide tasktify staging`, prepares Terraform changes in `tasktify-terraform`, opens a PR with plan evidence, waits for approval, then triggers apply and deploys app/services from `main` via GitHub Actions.

## DevOps Automation Model

DevOps requests are intent-based. Example:

```text
provide tasktify staging
```

Expected DevOps Agent behavior:
- parse `project_name=tasktify` and `environment=staging`
- select or create the matching Terraform stack in `tasktify-terraform`
- prepare a feature branch and PR
- produce `terraform plan` evidence for review
- wait for explicit approval before apply
- trigger the GitHub Actions apply workflow for the requested environment
- verify Azure resources, deployment health, and final endpoints

Current safety model:
- merge does not provision infrastructure automatically
- Terraform apply remains approval-gated
- GitHub Actions is the execution layer for apply and deployment

## Default Tech Stack Policy

For Tasktify implementation planning and execution, use this default stack unless explicitly approved otherwise:
- Backend services: NestJS
- Frontend app: Next.js
- Database: PostgreSQL
- Cache/queue/locking (optional): Redis
- JS package manager: Yarn

Planner and Tech Lead artifacts must include this baseline in ticket/docs context.

## Ticket Contract (Required)

Every engineering ticket must be implementation-ready before status `Ready`.

Required properties:
- Title (format: `[DOMAIN][Story-Slug] ...`)
- PRD Story
- Component
- Priority
- Target Repository (repo URL + base branch)
- Impact Type
- FE Mock Strategy (for FE tickets)
- Dependencies or Notes

Required ticket body sections:
- `# Context`
- `# Scope`
- `# Acceptance Criteria` (clear pass/fail points)
- `# Definition of Done`
- `# References` (must include PRD + Tech Design + relevant Module Design)

Split policy:
- FE and BE must be separate tickets.
- Mixed ownership title like `[FE+BE]` is invalid and must be blocked.

If one or more required fields are missing, Engineer Agent should set ticket status to `Blocked` and request clarification from Planner Agent.

## Reliability Model

- Retry/backoff on execution path (`runWithRetry`)
- Lease-based ticket claim to avoid duplicate workers
- Self-healing for expired lease (`recoverExpiredTickets`)
- Structured logs for every transition and ticket action
- Metrics counters/histograms exported at `/metrics`

## Operational Runbook

Start locally:
```bash
npm run start
```

Run demo flow once:
```bash
npm run start:demo
```

Run tests:
```bash
npm test
```

## Deployment

### Docker

```bash
docker compose up -d --build
```

`docker-compose.yml` includes:
- `restart: unless-stopped`
- HTTP healthcheck against `/health`

### GitHub Actions

- `CI` workflow runs tests and Docker build on PR/push.
- `Deploy` workflow runs on main/workflow_dispatch.
  - If `DEPLOY_*` secrets are set, it deploys via SSH and restarts `docker compose`.
  - If secrets are missing, deploy step is skipped safely.

Required deploy secrets:
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_APP_PATH`

## What is still scaffolded

- Notion queue adapter is in-memory for now.
- GitHub PR creation and repository-specific execution are placeholder outputs.
- Next implementation step is replacing in-memory queue with real Notion API calls and persistent state storage.
