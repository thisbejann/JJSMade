# CLAUDE.md

### Convex Schema & Types

- **Always update `convex/schema.ts` when adding new fields** to any table. The Convex codegen (`convex/_generated/`) derives all TypeScript types from the schema. If you reference a field in frontend code that doesn't exist in the schema, the build will fail with TS2339 errors.
- After modifying the schema, run `npx convex dev` (or let the dev server pick it up) so that `convex/_generated/api.d.ts` regenerates with the new types.
- Never manually edit files in `convex/_generated/` — they are auto-generated.

## Design Direction

Dark, dense, refined. Reference: Linear/Raycast. Accent: warm coral (`#e07850`). Animate meaningful moments only. Important data must be immediately scannable. Full context in `.impeccable.md`.
