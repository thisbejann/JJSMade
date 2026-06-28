# Handoff — Surface 2: "Save as Group Order" CTA (calculator)

**Self-contained brief for one session.** This is **surface 2 of 3** in the *Group Order from a Bundle* feature. Surface 1 (the `+ New` split control) is done and committed. This session shapes + crafts the **CTA on the Quote Calculator** that promotes a non-empty Bundle into a Group Order.

Run, in order:

1. **`/impeccable shape`** — settle placement + weight of the CTA. This is a small surface; a compact shape brief (a few bullets + one question) is appropriate, not the full 10-section treatment.
2. **`/impeccable craft`** — implement.

Pause between the two (shape → review → craft).

## Read first (don't duplicate, reference)

- `docs/handoff-bundle-to-group-order.md` — the master spec: the gap, locked product decisions, field mapping, backend note. **All of it still applies.** This doc only narrows to the CTA.
- `CONTEXT.md` — terms: **Bundle**, **Save as Group Order**, **Group Review Sheet**, **Offer Total**.
- `docs/adr/0002-bundle-promotes-to-group-order.md` — the decision + rejected alternatives.
- `DESIGN.md` / `PRODUCT.md` — "The Control Room" system (Void Night substrate, Live Coal accent `#e07850`, dark/dense/refined, Linear/Raycast). One-warm-signal rule: coral is rare and loud.

## What to shape (only this)

The **"Save as Group Order" CTA** that appears when the Bundle is non-empty. The *behavior* is locked: it opens the **Group Review Sheet** (surface 3, an overlay on the same page). What's open is purely visual/placement:

- **Where it sits** in the bundle view. The bundle view is `space-y-6` containing two cards: the **negotiation panel** (`QuoteCalculator.tsx:338-395`, holds MarginSignal + "Your offer" + figures + caveat) then the **items list** (`:398+`). The natural slot is after the items list, inside that `space-y-6` wrapper (around the close of the items Card, ~line 440+). Decide: trailing button below the list, vs. pinned to the negotiation panel near the Offer Total, vs. a sticky footer action on mobile.
- **Visual weight + relationship to `Add to bundle`.** `Add to bundle` is already a full-width `size="lg"` primary coral button in the add-item view (`:312-321`). When the bundle has items, "Save as Group Order" is the terminal action — it should read as *the* next step without two competing coral blocks fighting on one screen (one-warm-signal rule). Consider how it coexists with the existing "Clear all" affordance (`:404-410`).
- **Copy.** "Save as Group Order" is the locked label from CONTEXT.md. Confirm it reads right as a button; add a quiet sub-hint only if placement makes the destination (an overlay, not navigation) unclear.

## Hard constraints craft must honor

- **Do not** add name/seller/size fields to the calculator. Data entry happens in the sheet (surface 3), never inline. Calculator stays a clean negotiation tool (locked decision).
- The CTA only renders when `bundle.length > 0` (the same branch as `:335+`).
- The CTA's onClick opens the sheet's open-state. If surface 3 isn't built yet (see dependency below), wire the CTA to a placeholder state setter and leave a clear `// TODO surface 3` rather than navigating anywhere.

## Dependency on surface 3 (read this)

The CTA is the *entry point* to the **Group Review Sheet** (surface 3, separate handoff: `docs/handoff-surface3-group-review-sheet.md`). They're coupled:

- **If surface 3 is already built:** wire the CTA straight to its open state. Done.
- **If surface 3 is NOT built yet:** build the CTA against a local `const [showSheet, setShowSheet] = useState(false)` and have it toggle that flag; render nothing (or a tiny stub) for now. Surface 3's session drops the real sheet onto that flag. Note this seam in the commit so the other session finds it.

Recommended sequencing if you have a choice: do **surface 3 first**, then this CTA, so the button wires to a real sheet in one pass. But this surface is small enough to stub safely either way.

## Files in play

- `src/pages/QuoteCalculator.tsx` — bundle view (`:335+`), negotiation panel (`:338-395`), items list (`:398+`). Host the CTA here.
- `src/components/ui/Button.tsx` — existing button variants (default = coral, outline, ghost). Reuse; don't invent.

## Suggested skills

- `/impeccable shape` then `/impeccable craft` (the core flow).
- `/prototype` only if placement feels genuinely ambiguous after shape; this surface is small enough that it likely won't be needed.

## Done = 

CTA renders on non-empty bundle, opens the sheet (or a stubbed flag), respects the one-warm-signal rule, `tsc --noEmit` + `eslint` + `npm run build` clean. Update the master handoff (`docs/handoff-bundle-to-group-order.md`, surface 2 line) to mark it crafted.
