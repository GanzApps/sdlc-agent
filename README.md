# AI Agentic Delivery Framework

This repository defines a tool-agnostic AI SDLC framework that can be installed into any workspace and run through the configured agent executor.

The framework is built around one rule:

**Agents hand off artifacts, not chat.**

That means each phase should read a real upstream artifact, produce a real downstream artifact, and store it in the user's connected tools.

## What this repo is

This repo is the framework source, not an application runtime.

It contains:
- `.ai-sdlc/AGENTS.md`: global operating rules and workflow
- `.ai-sdlc/HELP.md`: command discovery and `/help` contract
- `.ai-sdlc/PHASES.md`: phase contract and approval model
- `.ai-sdlc/DELIVERY-RECORD.md`: initiative-level state model
- `.ai-sdlc/WORKSPACE-SETUP-AND-MANIFEST.md`: workspace setup, manifest, and sync model
- `.ai-sdlc/agents/*/AGENT.md`: agent role definitions
- `.ai-sdlc/skills/*/SKILL.md`: reusable workflow helpers
- `.ai-sdlc/templates/*`: canonical templates such as the handoff packet
- `.ai-sdlc/manifests/commands/*`: machine-friendly command behavior contracts
- `.agent-config.example.yml`: connector and executor schema
- `.ai-sdlc/skills/connector-setup/SKILL.md`: setup guidance for missing connectors

## Operating modes

The framework has 2 explicit modes:

1. `framework-source`
- this repository
- used to define and package the framework
- live connector setup is optional here

2. `installed-workspace`
- a generated target workspace
- used for actual delivery work
- must contain `.ai-sdlc/`, `.agent-config.yml`, `ai-sdlc.manifest.yml`, `knowledge/`, and `artifacts/`

## Framework model

The framework has 4 layers:

1. Agents
Each agent represents a real human role such as Product, Design, Tech Plan, Planner, Engineer, Incident, or DevOps.

2. Skills
Each agent uses structured skills to perform reusable workflows such as setup guidance, readiness checks, and future shared execution patterns.

3. Commands
Users interact through agent-specialized commands such as `/agent-product-plan` or `/agent-techplan-spec`.

4. Artifacts
Every phase reads and writes source-of-truth artifacts in connected tools.

## Straight-through workflow

1. Initiation
Starts from a BRD, initiative brief, change request, or structured business story.

2. Product Definition
Product Agent turns the intake artifact into a PRD.

3. Design Baseline
Design Agent checks whether the design-system baseline exists and creates or completes it if needed.

4. Feature Design
Design Agent produces flows and screens from the approved PRD and baseline.

5. Technical Design
Tech Plan Agent defines implementation boundaries, contracts, modules, and rollout assumptions.

6. Planning
Planner Agent creates execution-ready tickets and validates ticket quality.

7. Execution
Engineer Agent implements `Ready` tickets in the target repository.

8. Verification
The framework records evidence and confirms readiness for acceptance or release.

9. Release / Deploy
DevOps Agent applies approved deployment or infrastructure changes and records verification.

## Artifact locations

Preferred connector roles:
- BRD or initiative brief -> docs
- PRD -> docs
- design baseline -> design
- feature design -> design
- technical design -> docs
- tickets -> tickets
- code changes -> code
- evidence and deployment records -> docs or tickets

## Workspace knowledge

The workspace should keep a small, stable `knowledge/` layer for long-lived shared context.

Recommended structure:

```text
knowledge/
  workspace/
  product/
  architecture/
  design/
  engineering/
  operations/
```

Recommended contents:
- `knowledge/workspace/`: project overview, connector map, repo map, environment map, glossary, and shared conventions
- `knowledge/product/`: domain context, business goals, user segments, recurring constraints, and reusable BRD or PRD references
- `knowledge/architecture/`: system overview, service boundaries, module map, integration inventory, data-flow references, and architecture decisions
- `knowledge/design/`: design-system links, token and component references, baseline status, and UX pattern decisions
- `knowledge/engineering/`: branching rules, test strategy, coding standards, and repo-specific implementation notes
- `knowledge/operations/`: infra landscape, environment definitions, deployment paths, and monitoring or incident references

Minimum knowledge contracts:
- `knowledge/workspace/project-overview.md`
- `knowledge/workspace/connector-map.md`
- `knowledge/workspace/repository-map.md`
- `knowledge/product/domain-context.md`
- `knowledge/architecture/system-overview.md`
- `knowledge/design/baseline-status.md`

Required folders:
- `knowledge/workspace/`
- `knowledge/product/`
- `knowledge/architecture/`
- `knowledge/design/`

Optional but strongly recommended:
- `knowledge/engineering/`
- `knowledge/operations/`

Rule:
- `knowledge/` is for long-lived workspace memory only
- initiative-specific state belongs in delivery records
- execution evidence and handoff artifacts belong under `artifacts/`

## Installed workspace layout

After install and workspace setup, the framework-managed files should live under `.ai-sdlc/`.

Recommended layout:

```text
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
knowledge/
artifacts/
```

Rule:
- `.ai-sdlc/` holds the static framework files installed into the workspace
- `knowledge/`, `artifacts/`, and `.agent-config.yml` remain workspace-local
- connected tools remain the main source of truth for delivery artifacts

## Delivery record

Every initiative should have one delivery record.

Use it to track:
- what is being delivered
- the current phase
- linked artifacts
- readiness state
- blockers
- current and next role
- approval state when relevant

Rule:
- `knowledge/` = workspace memory
- delivery record = initiative state
- `artifacts/` = role output and evidence

Recommended location:
- primary source of truth in the docs connector
- local mirror under `artifacts/delivery-records/`

Keep the delivery record small.
It should link and summarize, not duplicate full documents.

## Command model

This framework currently centers on agent-specialized commands.

Start with:
- `/help`

Agent command format:
- `/agent-<role>-<action>`

Base pattern where possible:
- `init`
- `plan`
- `explore`
- final artifact or execution command

Role-specific exceptions are allowed when they reflect real human work.
Examples:
- Design Agent uses `baseline`
- Planner Agent uses `slice`
- Engineer Agent uses `context`

Setup commands:
- `/help`
- `/ai-init`
- `/ai-status`
- `/ai-sync`

Command contracts live under:
- `manifests/commands/*.yml` in the framework source
- `.ai-sdlc/manifests/commands/*.yml` in installed workspaces

## Agent command set

### Product Agent

| Command | Purpose |
|---|---|
| `/agent-product-init` | Verify product workspace readiness, docs access, and intake artifact location. |
| `/agent-product-plan` | Clarify product scope, detect work mode, and identify missing business context. |
| `/agent-product-explore` | Explore options, patterns, and best practices to support a product decision. |
| `/agent-product-prd` | Create or update the formal PRD artifact in the docs connector. |

### Design Agent

| Command | Purpose |
|---|---|
| `/agent-design-init` | Verify design workspace readiness and confirm the approved PRD is available. |
| `/agent-design-baseline` | Check whether the design-system baseline exists and create or complete it if needed. |
| `/agent-design-plan` | Determine the design work mode, scope, and assumptions before formal design starts. |
| `/agent-design-explore` | Compare UX or UI approaches before committing to a design direction. |
| `/agent-design-spec` | Create or update the actual design artifact in the design connector. |

### Tech Plan Agent

| Command | Purpose |
|---|---|
| `/agent-techplan-init` | Verify technical planning readiness and confirm upstream product and design artifacts exist. |
| `/agent-techplan-plan` | Understand the technical scope, impacted system areas, and work mode. |
| `/agent-techplan-explore` | Compare technical options and tradeoffs before locking the solution. |
| `/agent-techplan-spec` | Create the technical design artifact with modules, contracts, dependencies, and risks. |

### Planner Agent

| Command | Purpose |
|---|---|
| `/agent-planner-init` | Verify planning readiness, ticket workspace access, and required upstream artifacts. |
| `/agent-planner-plan` | Understand execution scope, constraints, dependencies, and planning direction. |
| `/agent-planner-slice` | Break approved work into ticket-sized implementation slices. |
| `/agent-planner-tickets` | Create or refresh execution-ready tickets in the configured ticket tool. |

### Engineer Agent

| Command | Purpose |
|---|---|
| `/agent-engineer-init` | Verify repository access, ticket readiness, and target-repo alignment. |
| `/agent-engineer-context` | Gather the full implementation context from tickets, docs, design, and repository state. |
| `/agent-engineer-implement` | Implement the scoped change and produce code review and test evidence. |

### Incident Engineer Agent

| Command | Purpose |
|---|---|
| `/agent-incident-init` | Verify incident ticket access, repository access, and basic response readiness. |
| `/agent-incident-context` | Build trace context and define a safe, bounded incident scope. |
| `/agent-incident-implement` | Implement the remediation path and produce root-cause and verification evidence. |

### DevOps Agent

| Command | Purpose |
|---|---|
| `/agent-devops-init` | Verify deployment or infrastructure readiness, target environment, and repo access. |
| `/agent-devops-plan` | Plan the rollout path, dependencies, approvals, and environment changes. |
| `/agent-devops-deploy` | Execute the approved infrastructure or deployment path and record verification evidence. |

## How To Use It

### 1. Discover the framework
Run:
- `/help`

Use this to see:
- setup commands
- agent commands by role
- one-line purpose for each command
- workspace mode when known
- readiness result when known
- fallback wording if native slash commands are not available

### 2. Set up the workspace
Run:
- `/ai-init`

Use this to:
- identify the workspace and project
- configure connectors
- verify connector readiness
- scaffold `knowledge/` if needed
- create minimum knowledge contract files if missing
- prepare the workspace for delivery work

### 3. Start product work
Run in order:
- `/agent-product-init`
- `/agent-product-plan`
- `/agent-product-explore`
- `/agent-product-prd`

Human action:
- approve the PRD before moving on

### 4. Create the design
Run in order:
- `/agent-design-init`
- `/agent-design-baseline`
- `/agent-design-plan`
- `/agent-design-explore`
- `/agent-design-spec`

Human action:
- approve the design before moving on

### 5. Create the technical design
Run in order:
- `/agent-techplan-init`
- `/agent-techplan-plan`
- `/agent-techplan-explore`
- `/agent-techplan-spec`

Human action:
- approve the technical design before moving on

### 6. Create execution-ready tickets
Run in order:
- `/agent-planner-init`
- `/agent-planner-plan`
- `/agent-planner-slice`
- `/agent-planner-tickets`

Human action:
- confirm tickets are ready for engineering

### 7. Implement the change
Run in order:
- `/agent-engineer-init`
- `/agent-engineer-context`
- `/agent-engineer-implement`

Human action:
- review and approve the implementation

### 8. Deploy when needed
Run in order:
- `/agent-devops-init`
- `/agent-devops-plan`
- `/agent-devops-deploy`

Human action:
- approve deploy or environment changes when required

### 9. Check status anytime
Run:
- `/ai-status`

Use this to see:
- workspace mode
- setup status
- current phase
- milestone state
- blockers
- risks
- recommended next command

## Continuation Rule

Another AI executor or thread should be able to continue without prior chat history.

Use this read order:
1. `knowledge/`
2. delivery record
3. connected-tool artifacts
4. local `artifacts/`
5. ask only for missing blocking context

## Input and readiness rules

Every command should:
1. read the delivery record
2. fetch linked artifacts from configured connectors
3. inspect workspace or repository context when relevant
4. detect what is still missing
5. ask the user only for missing blocking inputs
6. return `READY`, `READY WITH RISKS`, or `BLOCKED`

The current POC already uses an executable readiness validator for:
- `ai-sdlc status`
- generated workspace verification after `ai-sdlc init`

Readiness meanings:
- `READY`: core setup is present
- `READY WITH RISKS`: the workspace can continue, but repair or completion work is still recommended
- `BLOCKED`: setup must be repaired before the next delivery step

## Install direction

This framework is intended to work in 2 ways:
- as the source repo that defines the framework
- as an installable framework set up inside any target workspace

Current recommended packaging direction:
- start with Git-based distribution
- use one shared workspace-setup engine
- support both AI-driven install and shell install
- add package-manager distribution after the framework contract stabilizes

Current POC CLI:
- `ai-sdlc init`
- `ai-sdlc status`

## Source Code Repositories

Use `source-code/` only when engineering work needs local service repositories.

Recommended rule:
- do not ask the user to define service names during initial setup
- service repositories should be introduced later from technical design and planner-created tasks or tickets
- Tech Plan defines which services are involved
- Planner and ticket output define which service repositories need implementation work

Recommended pattern:

```text
source-code/
  <service-name>/
```

Each service under `source-code/` should remain its own git repository.

## Local setup

1. Copy `.agent-config.example.yml` to `.agent-config.yml`.
2. Fill in connector URLs, MCP endpoints, credentials, and executor settings.
3. Mark required connectors as `connected`.
4. Start with `initiation`, not execution.

## Important repo rule

Agents and skills must stay tool-agnostic.
Connector roles such as `docs`, `tickets`, `design`, and `code` are resolved at runtime from `.agent-config.yml`.

This refinement pass also adds:
- executable readiness assessment
- mode-aware workspace validation
- canonical handoff templates
- command manifests
- minimum knowledge contract scaffolding

## Related framework docs

- Main framework plan: [AI Agentic Delivery Framework Plan](https://www.notion.so/3455215e92e48100aa8cc5a459288e6f)
- Installation architecture: [AI SDLC Installation Architecture Spec](https://www.notion.so/3455215e92e481caac9eebdda7431120)
- Agent command matrix: [AI SDLC Agent Command Matrix](https://www.notion.so/3455215e92e4818ba740fde549f8e422)
