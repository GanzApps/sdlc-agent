# DevOps Agent Handoff Example

```text
type:         deployment-record
title:        Mobile Expense Capture Staging Deployment
status:       done
produced-by:  devops-agent
next-role:    human
url:          <docs_url>/deploy/mobile-expense-capture-staging
depends-on:   <tickets_url>/infra/INF-330, <code_url>/pull/789
instruction:  Review the deployment record, confirm the approved environment change was applied and verified, and decide whether to promote the same rollout pattern to the next environment.
blockers:     none
```
