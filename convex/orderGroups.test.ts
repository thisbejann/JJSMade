import { describe, it, expect } from "vitest";
import { deriveGroupStatus } from "./orderGroups";

describe("deriveGroupStatus", () => {
  it("returns 'completed' when all items are delivered_to_customer", () => {
    expect(deriveGroupStatus(["delivered_to_customer", "delivered_to_customer"])).toBe("completed");
  });

  it("returns 'cancelled' when all items have excluded statuses", () => {
    expect(deriveGroupStatus(["cancelled", "refunded", "returned"])).toBe("cancelled");
  });

  it("returns the lagging active status across mixed items", () => {
    expect(deriveGroupStatus(["qc_sent", "item_shipout"])).toBe("qc_sent");
  });

  it("ignores excluded statuses when computing lagging status", () => {
    // cancelled item should be excluded; only ordered remains
    expect(deriveGroupStatus(["ordered", "cancelled"])).toBe("ordered");
  });

  it("handles a single active item", () => {
    expect(deriveGroupStatus(["arrived_ph_warehouse"])).toBe("arrived_ph_warehouse");
  });

  it("returns 'cancelled' for an empty list", () => {
    expect(deriveGroupStatus([])).toBe("cancelled");
  });

  it("ignores legacy statuses (sold, shipped_to_warehouse, etc.) treating them as excluded", () => {
    expect(deriveGroupStatus(["sold", "at_cn_warehouse"])).toBe("cancelled");
  });

  it("mixed active + delivered: lagging active status wins over completed", () => {
    expect(deriveGroupStatus(["ordered", "delivered_to_customer"])).toBe("ordered");
  });
});
