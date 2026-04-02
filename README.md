# SDLC Agent Runtime

Codex-oriented SDLC workspace with:
- role skills (`product`, `design`, `techlead`, `planner`, `engineer`, `incident-engineer`)
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
5. Engineer Agent consumes `Ready` tickets and moves:
   - `Ready -> In Progress -> Review -> Done`
   - failed recoverable execution: retry/requeue
   - exhausted retry: `Failed`

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

Required fields:
- Title
- Description
- Component
- Priority
- Target Repository (repo URL + base branch)
- Inputs and Context (PRD/Design/TechDoc links, constraints, references)
- Acceptance Criteria (clear pass/fail points)
- Expected Output (exact behavior or deliverable)
- Test Plan (unit/e2e scope and evidence format)
- Dependencies or Notes

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
