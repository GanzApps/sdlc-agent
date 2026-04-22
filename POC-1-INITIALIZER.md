# POC 1 Initializer

This document defines the first proof-of-concept initializer for the AI Agentic Delivery Framework.

## Goal

Prove that a user can initialize a workspace from a command and get the minimum files needed to start using the framework.

## Success criteria

The POC succeeds if a user can:
- run `ai-sdlc init` locally
- run `ai-sdlc status` locally
- provide workspace identity and executor choice
- generate a target workspace with the framework-managed files under `.ai-sdlc/`
- generate workspace-local files such as `.agent-config.yml`, `knowledge/`, and `artifacts/delivery-records/`
- generate an executor adapter folder for Claude Code or Codex
- open the generated workspace and continue with `/help` and `/ai-init`

## POC scope

This POC includes:
- initializer CLI
- readiness status CLI
- workspace scaffolding
- Claude Code adapter folder
- Codex adapter folder
- generated config and manifest
- templates and command manifests
- minimum knowledge contract files

This POC does not include:
- sync engine
- hook automation
- source-code repo cloning
- full multi-executor runtime support beyond Claude Code and Codex

## POC wizard questions

Minimum initializer inputs:
- workspace/company name
- project name
- primary executor
- whether the user wants to configure connectors now or later
- if now:
  - required connectors
  - tool per connector

Optional inputs for the POC may be defaulted:
- fallback executor
- delivery record store
- design baseline known

## POC generated workspace

```text
<target>/
  .ai-sdlc/
    AGENTS.md
    HELP.md
    PHASES.md
    DELIVERY-RECORD.md
    WORKSPACE-SETUP-AND-MANIFEST.md
    agents/
    skills/
    templates/
    manifests/
    .agent-config.example.yml

  .agent-config.yml
  ai-sdlc.manifest.yml

  knowledge/
    workspace/
    product/
    architecture/
    design/
    engineering/
    operations/

  artifacts/
    delivery-records/

  .claude/      # when Claude Code is selected
  .codex/       # when Codex is selected
```

## POC adapter rule

The executor adapter folders are thin wrappers.

They should:
- point the executor to `.ai-sdlc/AGENTS.md`
- point the executor to `.ai-sdlc/HELP.md`
- point the executor to `knowledge/`
- point the executor to `artifacts/`

They should not duplicate the framework.

## POC onboarding rule

The command should stay simple.

Recommended first experience:
1. run `ai-sdlc init`
2. answer workspace, project, and executor
3. choose whether to configure tools now or later
4. generate the workspace
5. open the workspace and continue with `/help`
6. use `/ai-init` later to connect tools if they were skipped during install

## Readiness rule

The POC should always support:
- `ai-sdlc init`
- `ai-sdlc status`

Status outcomes:
- `READY`
- `READY WITH RISKS`
- `BLOCKED`
