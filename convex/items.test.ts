import { describe, it, expect } from "vitest";
import { isShippingEstimated } from "./helpers";
import {
  normalizeSize,
  planBagReclassification,
  storedEstimateFields,
  validateItemRules,
  watchTd,
} from "./items";

describe("Bags size rule", () => {
  it("drops any size typed for a Bag", () => {
    expect(normalizeSize("bags", "Medium")).toBeUndefined();
  });

  it("accepts a Bag saved without a size", () => {
    expect(() =>
      validateItemRules({ category: "bags", size: undefined, isForwarderBuy: false, status: "ordered" })
    ).not.toThrow();
  });
});

describe("planBagReclassification", () => {
  it("moves non-bag Items into Bags", () => {
    const plan = planBagReclassification([
      { _id: "a", category: "clothes" },
      { _id: "b", category: "shoes" },
      { _id: "c", category: "watches_accessories" },
    ]);
    expect(plan).toEqual({ toMove: ["a", "b", "c"], alreadyBags: [] });
  });

  it("is a no-op for Items already in Bags", () => {
    const plan = planBagReclassification([
      { _id: "a", category: "bags" },
      { _id: "b", category: "clothes" },
    ]);
    expect(plan).toEqual({ toMove: ["b"], alreadyBags: ["a"] });
  });
});

describe("legacy Watches & Accessories", () => {
  const base = { size: undefined, isForwarderBuy: false, status: "ordered" as const };

  it("can't be picked for a new Item", () => {
    expect(() => validateItemRules({ ...base, category: "watches_accessories" })).toThrow(
      "Watches & Accessories is retired"
    );
  });

  it("can't be picked when editing an Item from another category", () => {
    expect(() =>
      validateItemRules({ ...base, category: "watches_accessories", existingCategory: "shoes" })
    ).toThrow("Watches & Accessories is retired");
  });

  it("stays valid on a legacy Item edited without reclassifying", () => {
    expect(() =>
      validateItemRules({
        ...base,
        category: "watches_accessories",
        existingCategory: "watches_accessories",
      })
    ).not.toThrow();
  });

  it("lets a legacy Item be reclassified as Watches or Accessories", () => {
    for (const category of ["watches", "accessories"] as const) {
      expect(() =>
        validateItemRules({ ...base, category, existingCategory: "watches_accessories" })
      ).not.toThrow();
    }
  });
});

describe("Watches on the TD route", () => {
  const watch = { category: "watches" as const, size: undefined, isForwarderBuy: false, status: "ordered" as const };

  it("saves without a size", () => {
    expect(() => validateItemRules(watch)).not.toThrow();
    expect(normalizeSize("watches", "42mm")).toBeUndefined();
  });

  it("can't be bought by the forwarder", () => {
    expect(() =>
      validateItemRules({
        ...watch,
        isForwarderBuy: true,
        forwarderBuyRateUsed: 8.6,
        forwarderBuyCommissionPercent: 10,
      })
    ).toThrow("A watch can't be bought by the forwarder");
  });

  it.each(["arrived_ph_warehouse", "at_ph_warehouse", "at_cn_warehouse", "shipped_to_warehouse", "shipped_to_ph"] as const)(
    "can't be put in the warehouse status %s",
    (status) => {
      expect(() => validateItemRules({ ...watch, status })).toThrow("Watches skip the warehouse");
    }
  );

  it.each(["ordered", "qc_sent", "item_shipout", "delivered_to_customer", "refunded", "cancelled"] as const)(
    "follows the TD status flow through %s",
    (status) => {
      expect(() => validateItemRules({ ...watch, status })).not.toThrow();
    }
  );

  it("leaves China-route Items free to reach the PH warehouse", () => {
    expect(() =>
      validateItemRules({ category: "accessories", isForwarderBuy: false, status: "arrived_ph_warehouse" })
    ).not.toThrow();
  });
});

describe("an Item's quote-time estimate when it is edited", () => {
  const quoted = {
    estimatedWeightKg: 1.2,
    estimatedWeightTyped: false,
    shoeBuild: "regular" as const,
    clothingWeight: "light" as const,
    bagSize: "large" as const,
  };

  it("is dropped once the Item is on the TD route", () => {
    const saved = { ...quoted, ...storedEstimateFields("watches") };
    expect(saved).toEqual({
      estimatedWeightKg: undefined,
      estimatedWeightTyped: undefined,
      shoeBuild: undefined,
      clothingWeight: undefined,
      bagSize: undefined,
    });
    expect(isShippingEstimated(saved)).toBe(false);
  });

  it("stays on the China route, where it is still what profit rests on", () => {
    const saved = { ...quoted, ...storedEstimateFields("bags") };
    expect(saved).toEqual(quoted);
    expect(isShippingEstimated(saved)).toBe(true);
  });
});

describe("watchTd", () => {
  const rates = { tdShippingCNY: 250, tdInsurancePct: 10 };

  it("insures a watch unless it opted out", () => {
    expect(watchTd(rates, undefined)).toEqual({ ...rates, insured: true });
    expect(watchTd(rates, true)).toEqual({ ...rates, insured: true });
    expect(watchTd(rates, false)).toEqual({ ...rates, insured: false });
  });

  it("is absent off the TD route, where there are no rates", () => {
    expect(watchTd(undefined, true)).toBeUndefined();
  });
});
