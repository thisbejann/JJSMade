# Handoff — Surface 3: Group Review Sheet (calculator overlay)

**Self-contained brief for one session.** This is **surface 3 of 3** in the *Group Order from a Bundle* feature, and the one that most needs design care. Surface 1 (`+ New` split control) is done and committed. This session shapes + crafts the **Group Review Sheet**: the overlay that turns a negotiated Bundle into real orders + a group, in one step.

Run, in order:

1. **`/impeccable shape`** — design the sheet. This is a real multi-element surface; the full shape treatment is warranted. **Strongly consider a `/prototype` round** to pick the form factor before crafting (see below).
2. **`/impeccable craft`** — implement, including the backend mutation and the `BundleItem` change.

Pause between (shape → review → craft).

## Read first (don't duplicate, reference)

- `docs/handoff-bundle-to-group-order.md` — the **master spec**. Field mapping for each seeded item, the backend note, the "known/accepted" optimistic-profit caveat, and the full file list all live there and **all apply**. This doc narrows to the sheet and its data plumbing; do not re-derive the mapping, read it from the master.
- `CONTEXT.md` — terms: **Group Review Sheet**, **Group Order Creation Flow**, **Offer Total**, **Customer Picker**, **Group Status**.
- `docs/adr/0002-bundle-promotes-to-group-order.md` — decision + rejected alternatives.
- `DESIGN.md` / `PRODUCT.md` — "The Control Room": Void Night substrate, Live Coal accent `#e07850`, four-layer elevation (overlays earn elevation from Elevated Void `#1b1c25`), dark/dense/refined, weight-first hierarchy. No glassmorphism as decoration, no modals by reflex (this is a deliberate full-height overlay, which is allowed).

## What to shape

A **full-height overlay on the calculator page** (NOT a separate route — locked, so Bundle state survives; "Cancel" returns to the untouched Bundle). Contents:

- **Customer picker** at top — reuse `src/components/items/CustomerPicker.tsx`.
- **One row per Bundle line**: editable **name · seller · size**, read-only **quote** (becomes the item's `sellingPrice`). Size is conditional: shoes = EU number, clothes = S/M/L/XL, watches/accessories = none.
- **Seller field** = the existing autocomplete `Combobox` (`src/components/ui/Combobox.tsx`) fed by `api.items.getUniqueSellers`.
- **Editable negotiated total**, pre-filled from the calculator's Offer Total.
- **Cancel / Create group** actions.
- A quiet inline **"excl. forwarder shipping"** caveat (consistent with the calculator's existing warning at `QuoteCalculator.tsx:390-393`).

### Open design questions — RESOLVED via `/prototype` (variant C wins)

Three holistic variants were rendered on the real `/calculator` route behind `?variant=` (sub-shape A) and flipped between with a floating bottom bar:

- **A** — full-height overlay · stacked field-groups · footer summary
- **B** — right slide-in drawer · dense table rows · inline per-field
- **C** — full-height overlay · progressive accordion · progress meter ✅ **CHOSEN**

The three open questions are answered by C:

1. **Form factor → full-height overlay** anchored to the calculator's `max-w-lg` centered column (sticky header + scrollable body + sticky footer; slide-up entry; `bg-elevated` panel over a `bg-black/60` scrim). Mobile = full screen; desktop = centered column. The drawer (B) collapsed to a full-screen panel at phone width anyway, so its framing was wasted; the centered modal capped height and boxed 8+ rows.
2. **Row layout → progressive accordion**, NOT an all-fields-visible table or stacked group. Each Bundle line is a collapsed row showing [status icon · name-or-category · seller·size summary · quote · chevron]; tapping expands it to reveal name / seller / size inline. The dense table (B) cramped the seller `Combobox` + size under ~512px. Lean into the accordion's calm at 8 rows.
3. **Validation surfacing → progress meter + per-row status**. Header carries a "{ready} / {total} items ready" meter; each row shows a green check when complete or a neutral dot when not; the footer Create button reads "{n} left to finish" until everything is valid, then "Create group order". `Create` stays disabled until every row has name + seller + (size where required) AND a customer is chosen.

**Craft notes from the prototype (rebuild fresh; do NOT promote prototype code — it was read-only, no real components/mutations):**
- Use the real `CustomerPicker` in the header and the real `Combobox` (`api.items.getUniqueSellers`) for each row's seller, not the placeholder `<input list>` the prototype used.
- First row starts expanded; tapping a header toggles. Suggested default: when a row becomes complete, leave it to the user to collapse (don't force auto-collapse) — confirm during craft.
- Negotiated total input sits in the sticky footer, pre-filled from the Offer Total, with the quiet "excl. forwarder shipping" caveat beside it.
- Prototype lived at `src/pages/ProtoGroupSheet.tsx` + a guarded block in `QuoteCalculator.tsx`; both deleted after this verdict was recorded.

## Hard constraints craft must honor

- **`items.create` throws without a valid size for shoes/clothes** (`validateItemRules`, `convex/items.ts:45-56`; called from `items.ts:79`). The sheet must collect size; `Create` disabled until every row is complete + customer chosen. This is the single biggest correctness trap.
- **Negotiated total persistence**: only persist `negotiatedTotal` when discounted (offer < bundle quote); else null/full price. `setNegotiatedTotal` already snapshots `quotesSumAtEntry`, so the group's "stale" warning works from creation.
- **Field mapping** for each seeded item: read it verbatim from the master handoff ("Hard constraints" section). Don't improvise defaults.

## Data plumbing (prerequisite — do this in craft)

1. **`BundleItem` needs `localShippingCNY`.** Today a line stores only `{id, category, mode, priceCNY, quote, cost}` (`QuoteCalculator.tsx:23-30`). `localShippingCNY` is currently a shared input baked into `cost` at add-time but not stored per line; to seed real items you must add it to `BundleItem` in `addToBundle`. **Per CLAUDE.md, if this surfaces a new Convex field, update `convex/schema.ts` first** (note: `BundleItem` is client-side calculator state, not a table — only the *seeded item* hits Convex, and those fields already exist; verify before adding schema fields).
2. **Backend mutation.** The flow needs items *created*, not just attached. **Recommended:** add `orderGroups.createWithItems({ customerId, notes?, items: [...], negotiatedTotal? })` — one transaction seeds items + group + total, avoiding partial-failure states. Alternative is composing `create` → `items.create`×N → `setNegotiatedTotal`, but a single mutation is safer. (`convex/orderGroups.ts` currently has `create`, `addItems`, `setNegotiatedTotal`.) After editing the schema/mutations, let `npx convex dev` regenerate `convex/_generated/`; never hand-edit generated files.

## Dependency on surface 2

Surface 2 (the "Save as Group Order" CTA, `docs/handoff-surface2-save-as-group-cta.md`) is the **entry point** that opens this sheet. If surface 2 is already built, it's toggling a flag (e.g. `showSheet`) with a `// TODO surface 3` seam — wire this sheet onto that flag. If surface 2 isn't built, expose the sheet's open-state so that session can wire to it. On `Create` success, close the sheet and route to the new group (`/groups/:id`); on `Cancel`, restore the untouched Bundle.

## Files in play

- `src/pages/QuoteCalculator.tsx` — bundle state, `BundleItem`, `addToBundle`, bundle view; host the overlay here.
- `src/components/items/CustomerPicker.tsx`, `src/components/ui/Combobox.tsx` — reuse in the sheet.
- `convex/orderGroups.ts`, `convex/items.ts` — mutation + validation.
- `convex/schema.ts` — only if a genuinely new field is needed (verify first).
- `src/pages/GroupOrderDetail.tsx` — destination after Create; `NegotiatedTotalBlock` shows the carried total (already built, just confirm it reads the new group correctly).

## Suggested skills

- `/prototype` (UI branch) — for the form-factor question, on `/calculator` behind `?variant=`. Most valuable here.
- `/impeccable shape` then `/impeccable craft` — the core flow.

## Done =

Sheet opens over the calculator with Bundle state intact; rows editable + validated; size conditional by category; `Create` seeds items + group + (conditional) negotiated total via one mutation and routes to the group; `Cancel` restores the Bundle; caveat shown; responsive 1–8+ rows; `tsc --noEmit` + `eslint` + `npm run build` clean. Update the master handoff (surface 3 line) to mark it crafted.
