# CLAUDE.md

### Convex Schema & Types

- **Always update `convex/schema.ts` when adding new fields** to any table. The Convex codegen (`convex/_generated/`) derives all TypeScript types from the schema. If you reference a field in frontend code that doesn't exist in the schema, the build will fail with TS2339 errors.
- After modifying the schema, run `npx convex dev` (or let the dev server pick it up) so that `convex/_generated/api.d.ts` regenerates with the new types.
- Never manually edit files in `convex/_generated/` — they are auto-generated.

## Teaching Mode

When implementing something non-obvious — a pattern, architectural decision, or tricky concept — briefly explain the _why_ inline. If you're unsure whether it warrants explanation, end your reply with a short question: _"Want me to explain why I did X?"_

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
