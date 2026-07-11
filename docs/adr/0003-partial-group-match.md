# Orders list filters drill into a Group Order's items

## Status

Accepted

## Context

The Orders list treated a Group Order as **atomic** for filtering: it matched or hid as one unit, never partially (`OrdersList.tsx` comment: *"A group is atomic: it matches or it hides whole, never partially"*). The status filter compared the selected value against the group's single **derived** [Group Status] — the lagging member's status. So a group of 3 `qc_sent` + 2 `ordered` items derives to `ordered` and **vanished** under a `qc_sent` filter, even though three of its items matched. Symmetrically, a fully-delivered bundle (derived status `completed`) disappeared under a `delivered_to_customer` filter, because `completed` is a group-only status with no item equivalent.

The user wanted the opposite: filtering by an item state should **surface the matching items inside a group**, not swallow them. That directly contradicts the atomic principle, and it raises a money problem — a Group Order's price is one negotiated total the customer pays for the whole bundle, **never redistributed** to individual items (see [Offer Total]). Showing "these 3 of 5 items" alongside any per-subset price would be a lie.

## Decision

The three item-level dropdown filters — **Status**, **Category**, **QC** — now match against a group's individual member items (an item qualifies only if it matches *every* active dropdown). A group is included when at least one member qualifies. Rendering keys off how many match:

- **Full match** (all members qualify) — opaque summary row with full bundle money, identical to no-filter. An expanded row is therefore always a reliable signal that *some members are hidden*.
- **Partial match** (some members qualify) — the group auto-reveals, listing **only** the matching items as read-only sub-rows with an "N of M match" marker. **Money is hidden** (band and sub-rows) because a subset of a negotiated bundle has no honest price.

The reveal is **filter-driven only** (no persistent expand toggle) and read-only. **Search** never drills — a search hit reveals the whole group, since searching a customer name means "show this customer's entire bundle." The matching logic lives on the frontend: the existing `filteredGroups` memo already holds every group's items, so it computes a per-group `visibleItems` set and passes it to each surface. No backend or schema change.

## Considered Options

- **Keep groups atomic; just fix status to match like category/QC** (any member matches → show the *whole* group opaquely). Rejected: it stops the group vanishing, but still never shows *which* items matched — the user's actual ask — and shows unrelated items under a filter.
- **Extract matching items as solo-like rows** — pull qualifying members out of their group and render them flat alongside solo items. Rejected: it destroys the bundle/customer context the domain model treats as first-class; a grouped item would look identical to an ungrouped one.
- **Recompute money for the visible subset** (sum the matching items' quotes). Rejected: it violates the negotiated-total invariant — the customer pays a bundle price that is never redistributed to items, so any subtotal is fiction.
- **Keep money visible (full bundle total) during a partial view**, with only the marker to caveat it. Rejected: a full bundle total next to a 3-of-5 item list reads as the price of those three; hiding it removes the ambiguity entirely.

## Consequences

- The atomic-filtering principle is **overturned** for the three item-level dropdowns and recorded in `CONTEXT.md` under [Partial Group Match]; the stale "row expands minimally to reveal its items" claim (never true of the shipped renderers) is corrected there.
- A latent bug is fixed for free: filtering `delivered_to_customer` no longer hides fully-delivered (`completed`) bundles.
- Every group surface (All feed, Bundles table, mobile list, grid card) must implement the partial reveal, so the four renderers gain a `visibleItems`/partial-state path.
- Money legitimately **disappears** from a group while a dropdown filter is active and only some members match — intended, but a behavior a future reader would otherwise find surprising.
- Search and the dropdowns compose asymmetrically: search gates *which groups appear*, dropdowns gate *which items show within them*. A search hit on one item combined with a dropdown can reveal a different member — an accepted edge of keeping search non-drilling.
