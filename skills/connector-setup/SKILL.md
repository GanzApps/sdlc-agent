---
name: connector-setup
description: use this skill when a required connector is not configured and you need setup instructions for the supported connector tools.
---

## Connector bootstrap

Before starting:
1. Read `.agent-config.yml`
2. Check required connectors for this skill are `connected`
3. Resolve all tool URLs from config - never use hardcoded URLs
4. If a required connector is not connected, output the setup instruction and stop

Required connectors for this skill: none

## Setup instructions

### docs: outline

Required for: product-agent, techlead-agent

Setup steps:
1. Create or select the workspace and repository-level documentation space in the service.
2. Configure the service URL and API key in `.agent-config.yml` under `connectors.docs`.
3. Update `.agent-config.yml: connectors.docs.status = "connected"`.
4. Verify: create and open a test page, then confirm read/write access with the configured connector.

### docs: notion

Required for: product-agent, techlead-agent

Setup steps:
1. Create or select the documentation workspace and relevant pages or databases.
2. Configure the service URL and API key in `.agent-config.yml` under `connectors.docs`.
3. Update `.agent-config.yml: connectors.docs.status = "connected"`.
4. Verify: create and fetch a test page, then confirm the connector can read and write content.

### docs: confluence

Required for: product-agent, techlead-agent

Setup steps:
1. Connect the documentation space and confirm the target site is reachable.
2. Configure the service URL and credentials in `.agent-config.yml` under `connectors.docs`.
3. Update `.agent-config.yml: connectors.docs.status = "connected"`.
4. Verify: create or edit a test page, then confirm the connector can fetch the updated content.

### docs: gitlab-wiki

Required for: product-agent, techlead-agent

Setup steps:
1. Connect the documentation repository wiki and confirm write access.
2. Configure the service URL and access token in `.agent-config.yml` under `connectors.docs`.
3. Update `.agent-config.yml: connectors.docs.status = "connected"`.
4. Verify: create or update a wiki page, then confirm the connector can read the saved page.

### tickets: plane

Required for: planner-agent, engineer-agent, incident-engineer-agent, devops-agent

Setup steps:
1. Create or select the workspace and project for ticket tracking.
2. Configure the service URL, MCP command, API key, and workspace slug in `.agent-config.yml` under `connectors.tickets`.
3. Update `.agent-config.yml: connectors.tickets.status = "connected"`.
4. Verify: create a test ticket and read it back through the connector.

### tickets: jira

Required for: planner-agent, engineer-agent, incident-engineer-agent, devops-agent

Setup steps:
1. Create or select the project and confirm issue create/edit permissions.
2. Configure the service URL and API token in `.agent-config.yml` under `connectors.tickets`.
3. Update `.agent-config.yml: connectors.tickets.status = "connected"`.
4. Verify: create a test issue and confirm it can be fetched and updated.

### tickets: linear

Required for: planner-agent, engineer-agent, incident-engineer-agent, devops-agent

Setup steps:
1. Create or select the team and project for issue tracking.
2. Configure the service URL and API token in `.agent-config.yml` under `connectors.tickets`.
3. Update `.agent-config.yml: connectors.tickets.status = "connected"`.
4. Verify: create a test issue and confirm it can be fetched and updated.

### tickets: gitlab-issues

Required for: planner-agent, engineer-agent, incident-engineer-agent, devops-agent

Setup steps:
1. Select the repository and confirm issue access.
2. Configure the service URL and token in `.agent-config.yml` under `connectors.tickets`.
3. Update `.agent-config.yml: connectors.tickets.status = "connected"`.
4. Verify: create a test issue and confirm it can be fetched and updated.

### tickets: github-issues

Required for: planner-agent, engineer-agent, incident-engineer-agent, devops-agent

Setup steps:
1. Select the repository and confirm issue access.
2. Configure the service URL and token in `.agent-config.yml` under `connectors.tickets`.
3. Update `.agent-config.yml: connectors.tickets.status = "connected"`.
4. Verify: create a test issue and confirm it can be fetched and updated.

### code: gitlab

Required for: engineer-agent, incident-engineer-agent, devops-agent

Setup steps:
1. Select the repository or group that will hold the implementation code.
2. Configure the service URL and access token in `.agent-config.yml` under `connectors.code`.
3. Update `.agent-config.yml: connectors.code.status = "connected"`.
4. Verify: clone or fetch a test repository, then confirm branch and merge request access.

### code: github

Required for: engineer-agent, incident-engineer-agent, devops-agent

Setup steps:
1. Select the repository that will hold the implementation code.
2. Configure the service URL and token in `.agent-config.yml` under `connectors.code`.
3. Update `.agent-config.yml: connectors.code.status = "connected"`.
4. Verify: clone or fetch a test repository, then confirm branch and pull request access.

### code: bitbucket

Required for: engineer-agent, incident-engineer-agent, devops-agent

Setup steps:
1. Select the repository that will hold the implementation code.
2. Configure the service URL and token in `.agent-config.yml` under `connectors.code`.
3. Update `.agent-config.yml: connectors.code.status = "connected"`.
4. Verify: clone or fetch a test repository, then confirm branch and pull request access.

### design: penpot

Required for: design-agent, engineer-agent

Setup steps:
1. Select the design workspace and target file or library.
2. Configure the service URL in `.agent-config.yml` under `connectors.design`.
3. Update `.agent-config.yml: connectors.design.status = "connected"`.
4. Verify: open a test design file and confirm read access to frames and variables.

### design: figma

Required for: design-agent, engineer-agent

Setup steps:
1. Select the design workspace and target file or library.
2. Configure the service URL in `.agent-config.yml` under `connectors.design`.
3. Update `.agent-config.yml: connectors.design.status = "connected"`.
4. Verify: open a test design file and confirm read access to frames and variables.

### design: pencil

Required for: design-agent, engineer-agent

Setup steps:
1. Select the design workspace and target file or library.
2. Configure the service URL in `.agent-config.yml` under `connectors.design`.
3. Update `.agent-config.yml: connectors.design.status = "connected"`.
4. Verify: open a test design file and confirm read access to frames and variables.

## Suggested output

- Concise execution summary
- Changed files or artifacts with links via configured connector URLs
- Test or validation results
- Handoff packet:

  type:         [artifact type]
  title:        [artifact name]
  status:       [draft | ready | review | done]
  produced-by:  [this agent role]
  next-role:    [next role]
  url:          [artifact URL from configured tool]
  depends-on:   [upstream URLs]
  instruction:  [complete ready-to-paste prompt for next thread]
  blockers:     [none | description]
