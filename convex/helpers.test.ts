import { describe, it, expect } from "vitest";
import { computeDerivedFields } from "./helpers";

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
