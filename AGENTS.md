# AGENTS.md

This workspace is for AI-assisted SDLC using Codex.

General rules:
- Always create artifacts, not just chat output.
- Use Product Agent to create PRDs in Notion.
- Use Design Agent to create design output in Figma.
- Use Tech Lead Agent to create technical documentation in Notion.
- Use Engineer Agent to consume approved Notion engineering tickets and implement code.
- Use Incident Engineer Agent to handle monitoring-driven incident tickets created by self-healing intake service.
- Use DevOps Agent to provision one Azure VM for the Tasktify `dev` environment with Terraform and deploy services from the `main` branch through GitHub Actions.
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
9. DevOps Agent provisions or updates one Azure VM for `dev` with Terraform in `tasktify-terraform`, then deploys Tasktify services from their repositories' `main` branch through GitHub Actions and verifies health.

Artifact handoff format:
- type
- title
- status
- url
- summary
