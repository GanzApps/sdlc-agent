# SDLC Skill Agent Repository

This repo exists to maintain the SDLC agent skills and their tool-agnostic configuration. It is not an application runtime.

## What’s in here

- `AGENTS.md`: global rules and the multi-agent workflow
- `skills/*/SKILL.md`: role-specific instructions
- `.agent-config.example.yml`: connector and executor schema
- `skills/connector-setup/SKILL.md`: setup guidance when a connector is missing

## Quick setup

1. Create `.agent-config.yml` from `.agent-config.example.yml`.
2. Fill in connector URLs, credentials, and executor settings.
3. Mark each required connector as `connected`.
4. Run the agent workflow using the configured executor.

## How it works

Each skill:
- reads `.agent-config.yml`
- checks required connectors
- resolves tool URLs from config at runtime
- stops with setup instructions if a connector is not connected

The handoff packet format is defined in `AGENTS.md` and included in every skill’s output.

## Workflow summary

1. Product Agent produces the PRD.
2. Design Agent creates design output.
3. Tech Lead Agent writes the technical design.
4. Planner Agent creates implementation tickets.
5. Ticket Quality Gate validates ticket readiness.
6. Engineer Agent executes `Ready` tickets.
7. Incident Engineer Agent handles incident tickets.
8. DevOps Agent handles infrastructure requests.

## Updating skills

1. Edit the relevant `skills/*/SKILL.md`.
2. Keep tool references generic and rely on connectors.
3. Ensure the connector bootstrap block and suggested output format remain intact.

## Connector roles

Supported connector roles are listed in `.agent-config.example.yml` and explained in `skills/connector-setup/SKILL.md`.
