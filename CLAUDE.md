# CLAUDE.md

### Convex Schema & Types

- **Always update `convex/schema.ts` when adding new fields** to any table. The Convex codegen (`convex/_generated/`) derives all TypeScript types from the schema. If you reference a field in frontend code that doesn't exist in the schema, the build will fail with TS2339 errors.
- After modifying the schema, run `npx convex dev` (or let the dev server pick it up) so that `convex/_generated/api.d.ts` regenerates with the new types.
- Never manually edit files in `convex/_generated/` — they are auto-generated.

## Teaching Mode

When implementing something non-obvious — a pattern, architectural decision, or tricky concept — briefly explain the _why_ inline. If you're unsure whether it warrants explanation, end your reply with a short question: _"Want me to explain why I did X?"_

## Pull requests

- Each new function, integration, redirection, or bugfix that is meant to ship gets its own branch off `main` and its own PR. Open it without being asked.
- Do not open a PR for throwaway prototypes or requested artifacts (research notes, mockups, HTML previews, screenshots, one-off scripts). Put prototypes on a `prototype/<name>` branch, commit locally, and tell the user the branch name. Leave artifacts uncommitted unless the user asks for them in the repo.
- Changes to agent preferences (memory, reply style) go in memory, not a PR.
- Never mix unrelated commits in one PR. Check the branch before committing.
- Write the body with the `/pr` skill.
- After opening a PR, watch it until every check is green (Vercel, CodeRabbit).
- A PR that changes anything visible shows it in its description: screenshots of the real app, with before/after when it changes existing UI, and a 390px mobile shot when the layout could shift. The user reviews from the PR without checking out the branch.
  - Capture with the `verify-jjsmade` skill.
  - Commit the images to `<slug>/` on the orphan `pr-assets` branch (never to the feature branch).
  - Embed them with `https://raw.githubusercontent.com/thisbejann/JJSMade/pr-assets/<slug>/<file>`.

## Rules and what enforces them

| Rule | Enforced by |
| --- | --- |
| No PRs from `proto/*` or `prototype/*` branches | `.claude/hooks/block-prototype-pr.mjs` (PreToolUse hook on `gh pr create`) |
| Shipping work never lands on `main` | `.claude/hooks/block-main-edits.mjs` (PreToolUse hook: Edit/Write to tracked files and `src/`, `convex/`, `public/`, `.claude/`; `git commit` from the shell) |
| One worktree per ticket, two tickets at most | `/ticket` pre-flight (`.claude/skills/ticket`) |
| PRs are watched until checks are green | This file and `/ticket` |
| Prototypes go on `prototype/<name>` branches | This file only (judgment call) |
| No PRs for artifacts or preference changes | This file only (judgment call) |
| One concern per PR | This file only (judgment call) |
| UI PRs show real-app screenshots | This file only (judgment call) |

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`github.com/thisbejann/JJSMade`). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles using default label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` at root + `docs/adr/`. See `docs/agents/domain.md`.

## Design Direction

Dark, dense, refined. Reference: Linear/Raycast. Accent: warm coral (`#e07850`). Animate meaningful moments only. Important data must be immediately scannable. Full context in `.impeccable.md`.

## Skills

Scan for globally installed skills as well. Not only project wide ones.