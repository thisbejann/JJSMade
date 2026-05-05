---
name: build-feature
description: Implement issues from /to-issues one at a time using tracer-bullet slices — build a thin end-to-end path first, get feedback, then expand. Checks off acceptance criteria as they're met and asks permission before closing an issue and moving to the next. Use when the user wants to start building, implement a feature, work through an issue, or says "let's build".
---

Iterate through issues created by `/to-issues` and build them one at a time. The issue tracker and triage label vocabulary should have been provided to you — run `/setup-matt-pocock-skills` if not.

For each issue:

1. Fetch the full issue from the issue tracker (body + comments).
2. Go through each acceptance criterion. If anything is unclear, ask the user before writing code.
3. Build a tiny end-to-end tracer bullet first — the thinnest path through all layers (schema, API, UI) that is demoable. Seek feedback before expanding.
4. Cross out each acceptance criterion in the issue as you complete it.
5. If blocked, ask the user how to unblock before continuing.
6. Once all criteria are met, ask permission before closing the issue and moving to the next one.

**Tracer bullets** (from The Pragmatic Programmer): write code that gets you feedback as fast as possible. A tracer bullet is a narrow slice that cuts through every layer of the system so you can validate the architecture early, before investing significant effort.
