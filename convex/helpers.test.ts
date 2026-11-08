import { describe, it, expect } from "vitest";
import { categoryHasSize, computeDerivedFields, shippingCost, tdRouteCost } from "./helpers";

// ¥500 at 8.0 = ₱4,000, sold for ₱5,500, forwarder ₱480/kg.
const base = {
  category: "shoes" as const,
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

describe("computeDerivedFields on the TD route", () => {
  // ¥2,800 watch at 8.0 from a TD charging ¥250 shipping and 10% insurance, sold for ₱30,000.
  const watch = {
    category: "watches" as const,
    priceCNY: 2800,
    exchangeRateUsed: 8,
    hasLocalShipping: false,
    forwarderRatePerKg: 480,
    sellingPrice: 30000,
    td: { tdShippingCNY: 250, tdInsurancePct: 10, insured: true },
  };

  it("costs an insured watch as price + full TD shipping + insurance on the price only", () => {
    const d = computeDerivedFields(watch);
    expect(d.pricePHP).toBe(22400);
    expect(d.tdShippingPHP).toBe(2000);
    expect(d.tdInsurancePHP).toBe(2240);
    expect(d.totalCost).toBe(26640);
    expect(d.profit).toBe(3360);
  });

  it("drops insurance from cost when the watch isn't insured", () => {
    const d = computeDerivedFields({ ...watch, td: { ...watch.td, insured: false } });
    expect(d.tdInsurancePHP).toBe(0);
    expect(d.totalCost).toBe(24400);
    expect(d.profit).toBe(5600);
  });

  it("charges no forwarder, local shipping, forwarder-buy or QC fees even when those inputs are passed", () => {
    const d = computeDerivedFields({
      ...watch,
      hasLocalShipping: true,
      localShippingCNY: 20,
      weightKg: 0.8,
      estimatedWeightKg: 1,
      isForwarderBuy: true,
      forwarderBuyRateUsed: 8.6,
      forwarderBuyCommissionPercent: 10,
    });
    expect(d).toMatchObject({
      localShippingPHP: undefined,
      forwarderFee: undefined,
      forwarderBuyFeePHP: undefined,
      qcServiceFeePHP: undefined,
      totalCost: 26640,
    });
  });

  it("leaves profit empty without a selling price", () => {
    expect(computeDerivedFields({ ...watch, sellingPrice: undefined }).profit).toBeUndefined();
  });

  it("refuses to cost a watch without its Trusted Dealer's rates", () => {
    expect(() => computeDerivedFields({ ...watch, td: undefined })).toThrow("Trusted Dealer");
  });

  it("keeps China-route Items off the TD fields", () => {
    const d = computeDerivedFields({ ...base, category: "accessories", td: watch.td });
    expect(d.tdShippingPHP).toBeUndefined();
    expect(d.tdInsurancePHP).toBeUndefined();
    expect(d.totalCost).toBe(4000);
  });
});
