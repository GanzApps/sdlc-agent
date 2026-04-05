# AGENTS.md

This workspace is for AI-assisted SDLC using Codex.

General rules:
- Always create artifacts, not just chat output.
- Use Product Agent to create PRDs in Notion.
- Use Design Agent to create design output in Figma.
- Use Tech Lead Agent to create technical documentation in Notion.
- Use Engineer Agent to consume approved Notion engineering tickets and implement code.
- For Engineer work, use `artifacts/engineering/` as the workspace handoff/evidence layer, not as the application source tree.
- Engineer Agent must treat the Notion ticket's `Target Repository` as the source-of-truth for where implementation happens.
- If the current workspace does not match the ticket target repository, Engineer Agent should block on repository/workspace alignment and pass an artifact handoff instead of implementing in the wrong repo.
- Use Incident Engineer Agent to handle monitoring-driven incident tickets created by self-healing intake service.
- Use DevOps Agent to accept requests such as `provide <project_name> <environment>`, prepare Terraform branch/PR/plan in `tasktify-terraform`, then apply and deploy through GitHub Actions only after approval.
- DevOps Agent must update the linked infrastructure ticket status as work moves from design -> implementation -> verification, and should add concise execution comments when a decision or milestone is completed.
- For shared-host app deployments, prefer stable public routing contracts and document final service endpoints explicitly, for example frontend on the root domain and backend on a dedicated API subdomain or reverse-proxy path.
- For Azure Container Apps migration design, prefer ACA ingress over a custom reverse-proxy container, prefer internal ingress for non-public services, prefer managed identity over registry passwords, and prefer Key Vault backed secrets over direct secret values.
- For non-disruptive platform migration, build the ACA path beside the existing VM path first, keep current production-like endpoints untouched until smoke verification passes, and gate first-time ACA applies on hard dependencies such as Key Vault secrets and managed database readiness.
- Ask for approval before moving to the next stage.
- Pass artifacts (URLs, IDs, summaries), not whole chat history.

Workflow:
1. Product Agent creates or updates the PRD in Notion.
2. Design Agent reads the approved PRD and creates design output in Figma.
3. Tech Lead Agent reads the PRD and design output, then writes HLD + impacted services + module details + sequence diagrams in Notion.
4. Planner Agent breaks work into engineering tickets in Notion or Jira with strict FE/BE split and complete ticket body sections.
5. Planner Ticket Creator skill is used to create/refresh tickets from approved PRD + tech docs.
6. Ticket Quality Gate skill validates ticket contract and blocks incomplete tickets before execution.
7. Engineer Agent consumes `Ready` tickets and moves them through `In Progress` -> `Review` -> `Done` (or `Blocked` if ticket contract is incomplete).
8. Incident Engineer Agent consumes monitoring incident tickets from Notion and delivers fix PRs with evidence back to the ticket.
9. DevOps Agent accepts an infrastructure request such as `provide tasktify staging`, prepares the Terraform branch/PR/plan in `tasktify-terraform`, waits for approval, then applies the target environment and verifies deployment health.

Artifact handoff format:
- type
- title
- status
- url
- summary
