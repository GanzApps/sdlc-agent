# Planner Agent Handoff Example

```text
type:         ticket-set
title:        Mobile Expense Capture MVP Ticket Plan
status:       ready
produced-by:  planner-agent
next-role:    engineer-agent
url:          <tickets_url>/projects/mobile-expense-capture
depends-on:   <docs_url>/prd/mobile-expense-capture, <docs_url>/techplan/mobile-expense-capture
instruction:  Use Engineer Agent. Pick the highest-priority Ready ticket from the linked ticket set, confirm the current workspace matches the ticket Target Repository, gather full context from the linked PRD and technical design, and implement only after repository alignment is confirmed.
blockers:     none
```
