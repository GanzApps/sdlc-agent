# Handoff Packet Template

Use this exact field order for every agent or skill handoff.

```text
type:         [artifact type]
title:        [artifact name]
status:       [draft | ready | review | done | blocked]
produced-by:  [agent role]
next-role:    [next agent role]
url:          [direct artifact URL or local artifact path]
depends-on:   [upstream artifact URLs or concise descriptions]
instruction:  [complete ready-to-paste prompt for the next thread]
blockers:     [none | explicit blocker list]
```

Validation rules:
- `url` must point to a real artifact location, not a vague description.
- `depends-on` must reference the actual upstream artifact set.
- `instruction` must be self-contained and ready to paste into the next thread.
- `blockers` must be `none` or an explicit blocking condition.
