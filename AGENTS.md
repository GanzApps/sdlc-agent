# AGENTS.md

This workspace is for AI-assisted SDLC using Codex.

General rules:
- Always create artifacts, not just chat output.
- Use Product Agent to create PRDs in Notion.
- Use Design Agent to create design output in Figma.
- Use Tech Lead Agent to create technical documentation in Notion.
- Use Engineer Agent to consume approved Notion engineering tickets and implement code.
- Ask for approval before moving to the next stage.
- Pass artifacts (URLs, IDs, summaries), not whole chat history.

Workflow:
1. Product Agent creates or updates the PRD in Notion.
2. Design Agent reads the approved PRD and creates design output in Figma.
3. Tech Lead Agent reads the PRD and design output, then writes HLD + impacted services + module details + sequence diagrams in Notion.
4. Planner Agent breaks work into engineering tickets in Notion or Jira with repo target, inputs/context, AC, and expected output.
5. Engineer Agent consumes `Ready` tickets and moves them through `In Progress` -> `Review` -> `Done` (or `Blocked` if ticket contract is incomplete).

Artifact handoff format:
- type
- title
- status
- url
- summary
