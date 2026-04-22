# Help

This document defines the `/help` behavior for the AI Agentic Delivery Framework.

## Purpose

`/help` is the main discovery tool for users.

Use it to:
- understand what commands are available
- understand which commands are setup commands
- understand which commands belong to each agent
- understand what command to run next
- see fallback wording if native slash commands are unavailable

## Minimum output

`/help` should show:
- setup commands
- agent commands grouped by role
- one-line purpose for each command
- workspace mode when known
- readiness result when known
- current phase when known
- recommended next command when known
- why that next command is recommended
- fallback wording for executors that do not support native slash commands

## Setup commands

- `/help`: show the command catalog and recommended next action
- `/ai-init`: set up or repair workspace readiness
- `/ai-status`: show current workspace and delivery status
- `/ai-sync`: preview and apply framework-managed updates with approval

## Agent commands

### Product Agent
- `/agent-product-init`
- `/agent-product-plan`
- `/agent-product-explore`
- `/agent-product-prd`

### Design Agent
- `/agent-design-init`
- `/agent-design-baseline`
- `/agent-design-plan`
- `/agent-design-explore`
- `/agent-design-spec`

### Tech Plan Agent
- `/agent-techplan-init`
- `/agent-techplan-plan`
- `/agent-techplan-explore`
- `/agent-techplan-spec`

### Planner Agent
- `/agent-planner-init`
- `/agent-planner-plan`
- `/agent-planner-slice`
- `/agent-planner-tickets`

### Engineer Agent
- `/agent-engineer-init`
- `/agent-engineer-context`
- `/agent-engineer-implement`

### Incident Engineer Agent
- `/agent-incident-init`
- `/agent-incident-context`
- `/agent-incident-implement`

### DevOps Agent
- `/agent-devops-init`
- `/agent-devops-plan`
- `/agent-devops-deploy`

## Plain-language fallback

If native slash commands are not available, the user should still be able to continue with plain language such as:
- `Show framework help`
- `Set up this workspace using AI SDLC`
- `Use Product Agent and run plan`
- `Use Tech Plan Agent and create the technical design`

## Rule

The framework must not depend on slash syntax alone.

The real contract is:
- target agent
- intended action
- required artifact links
- expected output

`/help` is the discovery layer for that contract.

For the current POC:
- `/help` should use workspace mode and readiness context when available
- `/ai-status` is the current machine-readable readiness source
