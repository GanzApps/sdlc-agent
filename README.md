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

Current Tasktify dev routing example:
- frontend: `https://tasktify-dev.duckdns.org/`
- backend: `https://api-tasktify-dev.duckdns.org/`
- frontend and backend health checks may both use `/api/health`, so DevOps Agent must avoid path collisions by using dedicated domains or reverse-proxy path rewriting.

Current safety model:
- merge does not provision infrastructure automatically
- Terraform apply remains approval-gated
- GitHub Actions is the execution layer for apply and deployment

## ACA Migration Guidance

For the ACA migration track, the current best-practice target is:
- use Azure Container Apps ingress instead of a dedicated reverse-proxy container when ACA features already satisfy routing and TLS needs
- expose only public edge services with external ingress
- keep backend-only or worker-only services on internal ingress
- use Azure Database for PostgreSQL Flexible Server with private connectivity instead of a containerized PostgreSQL runtime
- use managed identity for ACR pulls and Azure service access
- use Key Vault backed ACA secrets for production-like secret handling
- keep observability on a dedicated node instead of colocating a full observability stack with the application plane
- for a small self-hosted SigNoz footprint, prefer a dedicated Linux VM in `rg-platform-shared` with `shared` naming semantics that bootstraps the official Docker Compose deployment and exposes `8080`, `4317`, and `4318` instead of placing SigNoz on the ACA application plane
- if DuckDNS remains the public DNS provider and direct ACA custom-domain cutover is not practical, prefer a cheap edge-only Linux VM that runs NGINX in front of ACA workloads instead of keeping the old all-in-one app VM alive
- create per-service ACA migration stacks beside the existing VM path first so cutover stays non-disruptive
- gate first-time ACA applies on secret readiness for hard runtime dependencies such as `DATABASE_URL`
- for application repositories, add a separate ACA deployment workflow that updates the ACA image and verifies the ACA ingress FQDN before any public domain cutover
- for ACA first-run service creation, publish the stable bootstrap image tag to ACR before Terraform creates the Container App; do not make the initial image push depend on app existence
- for ACA reruns, publish both the SHA tag and a stable `main` tag, but update the Container App to the stable tag so older workflow reruns cannot leave stale failed revisions as the latest target
- if a repository temporarily keeps both ACA and legacy VM deploy workflows, keep ACA as the only auto-run path on `main` and make the VM workflow manual-only
- when the legacy VM is retired but DuckDNS is still the chosen public DNS, a thin edge proxy VM in the ACA resource group is an acceptable transitional architecture: it should not host app runtimes, only domain, TLS, and routing
- once the legacy VM and RG are actually deleted, remove the VM fallback workflows from the application repositories and remove the legacy environment apply path from Terraform CI so deploy automation matches reality
- when moving an API from a VM-local database to Azure Database for PostgreSQL Flexible Server, update the application deployment secret source first so Key Vault receives the managed PostgreSQL connection string instead of the old `127.0.0.1` runtime value
- for ACA APIs with OAuth or other sensitive runtime credentials, close the loop end-to-end: deployment workflow syncs secrets to Key Vault, Terraform wires ACA secret refs for those env vars, and only non-secret runtime config stays in vars
- treat that workflow-secret-sync model as transitional. The more proper steady state is Key Vault as the source of truth, with GitHub retaining only OIDC/Azure identity metadata and non-secret deploy configuration
- treat a successful ACA deploy run plus a healthy ACA revision and public ACA health endpoint as the minimum evidence before discussing cutover
- for Terraform GitHub Actions, keep CI guards scoped only to real external dependencies of the target stack; do not skip unrelated plans because of copy-pasted checks from another migration path
- prefer apply workflows that run `validate`, create a plan file, and apply that exact plan instead of relying on an implicit second planning pass
- for internal ACA worker services, verify rollout from GitHub Actions through ACA control-plane readiness (`runningStatus` plus `latestReadyRevisionName`) instead of attempting public HTTP checks
- if a service writes incident or implementation tickets to Notion, align the destination database schema with the service contract before declaring the service migration complete

Execution expectations for DevOps Agent:
- when a design or migration milestone is completed, update the linked Notion task status immediately
- attach artifact links or short execution notes back to the relevant Notion task
- update the infra architecture document when a platform decision changes the target state
- keep the existing runtime path active until the new ACA path has a successful smoke verification result

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
