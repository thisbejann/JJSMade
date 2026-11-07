import { describe, it, expect } from "vitest";
import { normalizeSize, planBagReclassification, validateItemRules } from "./items";

describe("Bags size rule", () => {
  it("drops any size typed for a Bag", () => {
    expect(normalizeSize("bags", "Medium")).toBeUndefined();
  });

  it("accepts a Bag saved without a size", () => {
    expect(() =>
      validateItemRules({ category: "bags", size: undefined, isForwarderBuy: false })
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
