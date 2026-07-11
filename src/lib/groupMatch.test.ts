import { describe, it, expect } from "vitest";
import { matchGroupsToFilters, type MatchFilters } from "./groupMatch";

// Slim fixtures — the matcher only reads the fields below, so tests pass the
// minimum rather than whole Convex docs.
type TItem = {
  name: string;
  seller: string;
  status: string;
  category: string;
  qcStatus: string;
  batch?: string | null;
  customerName?: string | null;
};
type TGroup = { customerName: string; items: TItem[] };

function item(overrides: Partial<TItem> = {}): TItem {
  return {
    name: "Jordan 1",
    seller: "acme",
    status: "ordered",
    category: "shoes",
    qcStatus: "not_received",
    ...overrides,
  };
}

const NO_FILTERS: MatchFilters = { status: "", category: "", qc: "", search: "" };

describe("matchGroupsToFilters", () => {
  it("returns every group with all members visible when no filter is active", () => {
    const groups: TGroup[] = [
      { customerName: "Anna", items: [item(), item({ status: "qc_sent" })] },
    ];
    const result = matchGroupsToFilters(groups, NO_FILTERS);
    expect(result).toHaveLength(1);
    expect(result[0].visibleItems).toHaveLength(2);
  });

  it("drills a status dropdown into members — only matching items are visible (partial)", () => {
    const groups: TGroup[] = [
      {
        customerName: "Anna",
        items: [
          item({ status: "qc_sent" }),
          item({ status: "qc_sent" }),
          item({ status: "ordered" }),
        ],
      },
    ];
    const result = matchGroupsToFilters(groups, { ...NO_FILTERS, status: "qc_sent" });
    expect(result).toHaveLength(1);
    expect(result[0].visibleItems).toHaveLength(2);
    expect(result[0].visibleItems.every((i) => i.status === "qc_sent")).toBe(true);
  });

  it("keeps every member visible (full match) when all members clear the dropdown", () => {
    const groups: TGroup[] = [
      { customerName: "Anna", items: [item({ status: "qc_sent" }), item({ status: "qc_sent" })] },
    ];
    const result = matchGroupsToFilters(groups, { ...NO_FILTERS, status: "qc_sent" });
    expect(result[0].visibleItems).toHaveLength(2);
  });

  it("excludes a group when no member clears the dropdown", () => {
    const groups: TGroup[] = [
      { customerName: "Anna", items: [item({ status: "ordered" }), item({ status: "ordered" })] },
    ];
    const result = matchGroupsToFilters(groups, { ...NO_FILTERS, status: "qc_sent" });
    expect(result).toHaveLength(0);
  });

  it("composes multiple dropdowns with AND — a member must clear every active one", () => {
    const groups: TGroup[] = [
      {
        customerName: "Anna",
        items: [
          item({ status: "qc_sent", category: "shoes" }),
          item({ status: "qc_sent", category: "clothes" }),
          item({ status: "ordered", category: "shoes" }),
        ],
      },
    ];
    const result = matchGroupsToFilters(groups, { ...NO_FILTERS, status: "qc_sent", category: "shoes" });
    expect(result[0].visibleItems).toHaveLength(1);
    expect(result[0].visibleItems[0].category).toBe("shoes");
    expect(result[0].visibleItems[0].status).toBe("qc_sent");
  });

  it("does not drill on search — a hit reveals the whole group", () => {
    const groups: TGroup[] = [
      {
        customerName: "Anna",
        items: [item({ name: "Jordan 1" }), item({ name: "Yeezy 350" })],
      },
    ];
    const result = matchGroupsToFilters(groups, { ...NO_FILTERS, search: "jordan" });
    expect(result).toHaveLength(1);
    expect(result[0].visibleItems).toHaveLength(2); // whole bundle, not just the hit
  });

  it("matches search against the customer name", () => {
    const groups: TGroup[] = [{ customerName: "Anna Cruz", items: [item()] }];
    const result = matchGroupsToFilters(groups, { ...NO_FILTERS, search: "cruz" });
    expect(result).toHaveLength(1);
  });

  it("excludes a group when search matches nothing", () => {
    const groups: TGroup[] = [{ customerName: "Anna", items: [item({ name: "Jordan 1", seller: "acme" })] }];
    const result = matchGroupsToFilters(groups, { ...NO_FILTERS, search: "zzz" });
    expect(result).toHaveLength(0);
  });

  it("search gates the group while a dropdown drills within it", () => {
    const groups: TGroup[] = [
      {
        customerName: "Anna",
        items: [item({ status: "qc_sent" }), item({ status: "ordered" })],
      },
      { customerName: "Bob", items: [item({ status: "qc_sent" })] },
    ];
    const result = matchGroupsToFilters(groups, { ...NO_FILTERS, search: "anna", status: "qc_sent" });
    expect(result).toHaveLength(1); // Bob gated out by search
    expect(result[0].group.customerName).toBe("Anna");
    expect(result[0].visibleItems).toHaveLength(1); // drilled to the qc_sent member
  });

  it("surfaces a fully-delivered bundle under a delivered_to_customer filter (latent-bug fix)", () => {
    // A completed bundle's members are individually delivered_to_customer even
    // though the group's derived status is the group-only 'completed'. Matching
    // per-item means the filter no longer hides it.
    const groups: TGroup[] = [
      {
        customerName: "Anna",
        items: [item({ status: "delivered_to_customer" }), item({ status: "delivered_to_customer" })],
      },
    ];
    const result = matchGroupsToFilters(groups, { ...NO_FILTERS, status: "delivered_to_customer" });
    expect(result).toHaveLength(1);
    expect(result[0].visibleItems).toHaveLength(2);
  });
});
