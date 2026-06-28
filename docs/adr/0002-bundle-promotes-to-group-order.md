# Bundle promotes to a Group Order

## Status

Accepted

## Context

Creating a group order forced you to re-key every item one at a time *after* the sale: you'd negotiate the whole multi-item order in the Quote Calculator's Bundle, agree on a price, then throw that work away and re-enter each item through the full ItemForm, then re-set the negotiated total by hand. The Quote Calculator — until now deliberately **ephemeral** ("throwaway negotiation scratchpad", see `CONTEXT.md`) — already held everything needed to start those orders.

## Decision

The Quote Calculator becomes the front door for creating a Group Order. "New Group Order" (a `+ New` split in the Orders header) routes to the calculator; a **Save as Group Order** action **promotes** the Bundle in one step, seeding one real `items` row per Bundle line and carrying the negotiated Offer Total across as the group's `negotiatedTotal`. The Bundle itself stays ephemeral — promotion is one-way and creates a brand-new persisted Group Order, after which the Bundle is discarded.

Because a Bundle line only carries `{category, mode, priceCNY, quote, cost}` but `items.create` requires `name`, `seller`, and a valid `size` (enforced by `validateItemRules`), promotion routes through a **Group Review Sheet** — a finalize step that collects the customer plus per-line name/seller/size before committing.

## Considered Options

- **Capture name/seller/size inline in the calculator** (each Bundle line is a full mini-form). Rejected: it clutters a fast, iterative negotiation surface with data entry for lines you may haggle away, and scatters the "commit" decision (customer, agreed total) across the screen.
- **A merged single-table entry form** replacing both calculator and review sheet (rows of CNY + name + seller + size with live quotes). Rejected: it rebuilds the clean calculator as a heavier grid and abandons the deliberate two-surface split between *negotiating* and *finalizing*.
- **Review Sheet as a dedicated route** rather than an overlay. Rejected: it forces the Bundle into a global store to survive navigation; an overlay keeps Bundle state in place and lets "Cancel" return to the untouched Bundle.

## Consequences

- The Quote Calculator is no longer purely ephemeral: it now has a one-way bridge into persisted data. `CONTEXT.md` (Bundle, Save as Group Order, Group Review Sheet) records this so the calculator's pre-sale framing isn't read as "nothing here ever persists."
- Seeded items are created `status: "ordered"` with weight blank, so their forwarder shipping fee is unknown and group profit is optimistic until weights are entered — the same caveat the calculator already carries.
- The old empty-group "New Group" creation path is removed; multi-select grouping and the group-detail "Add Item" button remain for adding to groups after a sale.
