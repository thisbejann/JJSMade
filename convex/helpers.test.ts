import { describe, it, expect } from "vitest";
import { categoryHasSize, computeDerivedFields, shippingCost, tdRouteCost } from "./helpers";

// ¥500 at 8.0 = ₱4,000, sold for ₱5,500, forwarder ₱480/kg.
const base = {
  priceCNY: 500,
  exchangeRateUsed: 8,
  hasLocalShipping: false,
  forwarderRatePerKg: 480,
  sellingPrice: 5500,
};

describe("computeDerivedFields profit before weighing", () => {
  it("uses Estimated Shipping while the Item has no actual weight", () => {
    const d = computeDerivedFields({ ...base, estimatedWeightKg: 1.7 });
    expect(d.forwarderFee).toBeUndefined();
    expect(d.totalCost).toBe(4816);
    expect(d.profit).toBe(684);
  });

  it("uses the actual Forwarder Shipping Fee once weighed", () => {
    const d = computeDerivedFields({ ...base, estimatedWeightKg: 1.7, weightKg: 1.2 });
    expect(d.forwarderFee).toBe(576);
    expect(d.totalCost).toBe(4576);
    expect(d.profit).toBe(924);
  });

  it("leaves a legacy Item without an estimate unchanged", () => {
    const d = computeDerivedFields(base);
    expect(d.totalCost).toBe(4000);
    expect(d.profit).toBe(1500);
  });
});

describe("shippingCost", () => {
  it("is weight × the forwarder rate, rounded to centavos", () => {
    expect(shippingCost(1.7, 480)).toBe(816);
    expect(shippingCost(0.333, 480)).toBe(159.84);
  });
});

describe("categoryHasSize", () => {
  it.each([
    ["shoes", true],
    ["clothes", true],
    ["watches", false],
    ["accessories", false],
    ["watches_accessories", false],
    ["bags", false],
  ] as const)("%s takes a size: %s", (category, expected) => {
    expect(categoryHasSize(category)).toBe(expected);
  });
});

describe("tdRouteCost", () => {
  // ¥2,800 watch from a TD charging ¥250 shipping and 10% insurance, at 8.0.
  const watch = { priceCNY: 2800, rate: 8, tdShippingCNY: 250, tdInsurancePct: 10 };

  it("adds TD shipping and insurance on the watch price only", () => {
    expect(tdRouteCost({ ...watch, insured: true })).toEqual({
      pricePHP: 22400,
      tdShippingPHP: 2000,
      tdInsurancePHP: 2240,
      totalCost: 26640,
    });
  });

  it("drops insurance when the watch is not insured", () => {
    const cost = tdRouteCost({ ...watch, insured: false });
    expect(cost.tdInsurancePHP).toBe(0);
    expect(cost.totalCost).toBe(24400);
  });

  it("rounds each part to centavos", () => {
    expect(tdRouteCost({ priceCNY: 333, rate: 7.777, tdShippingCNY: 0, tdInsurancePct: 12.5, insured: true })).toEqual({
      pricePHP: 2589.74,
      tdShippingPHP: 0,
      tdInsurancePHP: 323.72,
      totalCost: 2913.46,
    });
  });
});
