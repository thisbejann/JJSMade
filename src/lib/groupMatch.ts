// Partial Group Match — how the Orders list filters *into* a Group Order rather
// than treating it as one atomic unit. See docs/adr/0003-partial-group-match.
//
// Two distinct gates, deliberately asymmetric:
//   • Search gates *which groups appear* and never drills — a hit reveals the
//     whole bundle, because searching a customer name means "show this
//     customer's entire order."
//   • The three dropdowns (Status, Category, QC) drill into a group's *members*:
//     an item qualifies only if it clears every active dropdown, and a group
//     appears if at least one member does.
//
// The returned `visibleItems` is the subset each surface renders. When it equals
// the whole membership the match is *full* (opaque row, full money); a strict
// subset is *partial* (reveal the matching members, hide money — a subset of a
// negotiated bundle total has no honest per-item price).

export interface MatchFilters {
  status: string;
  category: string;
  qc: string;
  search: string;
}

// The matcher reads only these fields, so it stays generic over the caller's
// shape — OrdersList passes whole Convex docs, tests pass slim fixtures.
interface MatchableItem {
  name: string;
  seller: string;
  status: string;
  category: string;
  qcStatus: string;
  batch?: string | null;
  customerName?: string | null;
}

interface MatchableGroup<I extends MatchableItem> {
  customerName: string;
  items: I[];
}

export function matchGroupsToFilters<I extends MatchableItem, G extends MatchableGroup<I>>(
  groups: G[],
  { status, category, qc, search }: MatchFilters,
): { group: G; visibleItems: I[] }[] {
  const term = search.trim().toLowerCase();
  const hasDropdown = Boolean(status || category || qc);
  const out: { group: G; visibleItems: I[] }[] = [];

  for (const g of groups) {
    // Search gate — whole group, no drill.
    if (term) {
      const hit =
        g.customerName.toLowerCase().includes(term) ||
        g.items.some(
          (i) =>
            i.name.toLowerCase().includes(term) ||
            i.seller.toLowerCase().includes(term) ||
            (i.batch?.toLowerCase().includes(term) ?? false) ||
            (i.customerName?.toLowerCase().includes(term) ?? false),
        );
      if (!hit) continue;
    }

    // No dropdown active → the whole bundle is visible (full match).
    if (!hasDropdown) {
      out.push({ group: g, visibleItems: g.items });
      continue;
    }

    // Dropdowns drill — a member must clear every active one (AND).
    const visibleItems = g.items.filter(
      (i) =>
        (!status || i.status === status) &&
        (!category || i.category === category) &&
        (!qc || i.qcStatus === qc),
    );
    if (visibleItems.length === 0) continue; // no member qualifies → group hidden
    out.push({ group: g, visibleItems });
  }

  return out;
}
