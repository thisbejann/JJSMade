# Handoff — Group Order from a Bundle (calculator → group)

**For the next session.** The feature is fully *designed at the domain level* (decisions locked, docs updated). What remains is the **UI shaping then craft**. Run, in order:

1. **`/impeccable shape`** — produce the design brief for the surfaces listed under "What to shape" below. Don't re-litigate the product decisions; they're settled. Shape the *visual + interaction* design within them.
2. **`/impeccable craft`** — implement the shaped design.

Pause between the two as the skills intend (shape → review → craft).

---

## Why this exists (the gap)

The user runs a China→PH reselling business. When a customer orders several items, they negotiate the whole multi-item order in the **Quote Calculator's Bundle** (price each item, haggle a total), agree on a price — then the app throws that away and forces them to re-key every item one at a time through the full ItemForm, and re-set the negotiated total by hand. The "New Group" button that could start a group is invisible to them; their eyes go to the header.

**The fix:** the Quote Calculator becomes the front door for creating a Group Order. Build + negotiate the Bundle, then **Save as Group Order** seeds real orders + carries the negotiated total, in one step.

## Read these first

- `CONTEXT.md` — terms (all current): **Bundle**, **Save as Group Order**, **Group Review Sheet**, **Group Order Creation Flow**, **Offer Total**, **Group Status**, **Customer Picker**.
- `docs/adr/0002-bundle-promotes-to-group-order.md` — the decision + rejected alternatives.
- Design direction (from `CLAUDE.md` / `.impeccable.md`): **dark, dense, refined; Linear/Raycast; warm coral accent `#e07850`; animate meaningful moments only; important data immediately scannable.**

## Locked decisions (do NOT redesign these)

- Calculator stays a **clean negotiation tool** — no name/seller/size fields inline. Data entry happens at the **save step**, not during negotiation.
- Entry point: a **`+ New` split** in the Orders header → *Add Item* / *New Group Order*. "New Group Order" routes to the calculator.
- The **Group Review Sheet** is an **overlay on the calculator page** (not a separate route) so Bundle state survives; "Cancel" returns to the untouched Bundle.
- Per-line fields in the sheet: **name · seller · size** (size conditional: shoes = EU number, clothes = S/M/L/XL, watches/accessories = none). Quote is **read-only** and becomes the item's `sellingPrice`.
- Negotiated total = calculator's **Offer Total**, pre-filled + editable in the sheet; only persisted as `negotiatedTotal` when discounted (offer < bundle quote), else null/full price.
- **Removed:** the old empty-group "New Group" button + `NewGroupOrderModal`. **Kept:** multi-select grouping, group-detail "Add Item".

## What to shape (the surfaces /impeccable shape should design)

1. **`+ New` split control** in the Orders header — replaces the current `New Group` + `Add Item` pair (`src/pages/OrdersList.tsx:217-224`). How the split looks/behaves (dropdown? segmented?), and how "New Group Order" reads so landing on the calculator isn't surprising.
2. **"Save as Group Order" CTA** on the Quote Calculator — appears when the Bundle is non-empty (`src/pages/QuoteCalculator.tsx`, bundle view ~line 335+). Placement relative to the existing negotiation panel + items list.
3. **Group Review Sheet** (the main new surface) — full-height overlay: customer picker at top, one row per Bundle line (name · seller · size · read-only quote), editable negotiated total, Cancel / Create group. Must handle 1–8+ rows, mobile + desktop, and per-row validation (name/seller/size required before Create enables). This is the surface that most needs design care.

## Hard constraints craft must honor

- `items.create` (`convex/items.ts:79`) **throws** without a valid size for shoes/clothes (`validateItemRules`, `items.ts:45-56`). The sheet must collect size; Create stays disabled until every row is complete + a customer is chosen.
- A Bundle line currently stores only `{id, category, mode, priceCNY, quote, cost}` (`QuoteCalculator.tsx:23-30`). To seed real items, the line must also carry **`localShippingCNY`** (currently a shared input, baked into cost at add-time but not stored per line) — add it to `BundleItem` in `addToBundle`.
- Field mapping for each seeded item: `category`/`priceCNY` from line; `sellingPrice` = line quote; `isForwarderBuy` = (mode === "forwarder") with `forwarderBuyRateUsed`/commission from settings; `exchangeRateUsed`, `forwarderRatePerKg` from settings defaults; `isBranded` default true; `qcStatus: "not_received"`; `status: "ordered"`; `orderDate: now`; `customerId`/`orderGroupId` set; weight blank.
- Seller field = the existing autocomplete **Combobox** fed by `api.items.getUniqueSellers`. Customer field = existing **`CustomerPicker`** (`src/components/items/CustomerPicker.tsx`).

## Backend note (prerequisite, not UI)

Today's mutations (`convex/orderGroups.ts`): `create`, `addItems`, `setNegotiatedTotal`. The flow needs items *created* (not just attached). Either add a single `orderGroups.createWithItems({ customerId, notes?, items: [...], negotiatedTotal? })` mutation (recommended — one transaction, seeds items + group + total) or compose `create` → `items.create`×N → `setNegotiatedTotal`. Craft can decide, but a single mutation avoids partial-failure states. `setNegotiatedTotal` already snapshots `quotesSumAtEntry`, so the group's "stale" warning works from creation.

## Known, accepted

Seeded items have no weight yet → forwarder shipping fee unknown → group profit is **optimistic** until weights are entered. Same caveat the calculator already shows ("excl. forwarder shipping"). The Group Review Sheet and/or the resulting group should carry that caveat consistently — worth shaping a quiet inline note.

## Files in play

- `src/pages/QuoteCalculator.tsx` — bundle state, `BundleItem`, `addToBundle`, bundle view (host the CTA + overlay)
- `src/pages/OrdersList.tsx` — header controls; remove `NewGroupOrderModal` (lines ~24-63, 217-224)
- `src/pages/GroupOrderDetail.tsx` — keep "Add Item"; `NegotiatedTotalBlock` shows the carried total
- `src/components/items/GroupPickerModal.tsx` — multi-select grouping, keep
- `src/components/items/CustomerPicker.tsx`, `src/components/ui/Combobox.tsx` — reuse in the sheet
- `convex/orderGroups.ts`, `convex/items.ts` — mutations + validation
