import { describe, it, expect } from "vitest";
import { bundleTotals, quoteLine } from "./pricing";

const MARKUPS = { shoes: 850, clothes: 750, watches_accessories: 850 };

describe("quoteLine", () => {
  it("regular mode quotes (price + local shipping) × rate + the category markup", () => {
    const line = quoteLine({
      priceCNY: 300,
      localShippingCNY: 10,
      mode: "regular",
      rate: 8.2,
      category: "shoes",
      markups: MARKUPS,
    });

    expect(line.cost).toBe(2542);
    expect(line.quote).toBe(3392);
  });

  it("Forwarder Buy mode adds the 10% commission on the item price and the ₱150 QC fee to cost", () => {
    const line = quoteLine({
      priceCNY: 300,
      localShippingCNY: 10,
      mode: "forwarder",
      rate: 8.6,
      category: "clothes",
      markups: MARKUPS,
    });

    // 310 × 8.6 = 2666, commission 30 × 8.6 = 258, QC 150
    expect(line.cost).toBe(3074);
    expect(line.quote).toBe(3824);
  });

  it.each([
    ["shoes", 3392],
    ["clothes", 3292],
    ["watches_accessories", 3392],
  ] as const)("uses the %s markup", (category, quote) => {
    const line = quoteLine({
      priceCNY: 300,
      localShippingCNY: 10,
      mode: "regular",
      rate: 8.2,
      category,
      markups: MARKUPS,
    });
    expect(line.quote).toBe(quote);
  });

  it("rounds cost and quote to centavos, quoting from the unrounded cost", () => {
    const line = quoteLine({
      priceCNY: 123.45,
      localShippingCNY: 10,
      mode: "regular",
      rate: 8.13,
      category: "watches_accessories",
      markups: MARKUPS,
    });

    // 133.45 × 8.13 = 1084.9485
    expect(line.cost).toBe(1084.95);
    expect(line.quote).toBe(1934.95);
  });
});

const LINES = [
  { quote: 3392, cost: 2542 },
  { quote: 1934.95, cost: 1084.95 },
  { quote: 3824, cost: 3074 },
];

describe("bundleTotals", () => {
  it("sums line quotes into the Bundle Quote and line costs into the Break-even Floor", () => {
    const totals = bundleTotals(LINES);

    expect(totals.bundleQuote).toBe(9150.95);
    expect(totals.breakEvenFloor).toBe(6700.95);
  });

  it("with a discounted Offer Total, derives the discount and the margin over the floor", () => {
    const totals = bundleTotals(LINES, 8000);

    expect(totals.discount).toBe(1150.95);
    expect(totals.discountPct).toBeCloseTo(12.5774, 4);
    expect(totals.estimatedMargin).toBe(1299.05);
    expect(totals.marginState).toBe("discounted");
  });

  it("without an Offer Total, prices at the full Bundle Quote", () => {
    const totals = bundleTotals(LINES);

    expect(totals.discount).toBe(0);
    expect(totals.discountPct).toBe(0);
    expect(totals.estimatedMargin).toBe(2450);
    expect(totals.marginState).toBe("full");
  });

  it("an offer above the Bundle Quote is a full margin with a negative discount", () => {
    const totals = bundleTotals(LINES, 9500);

    expect(totals.discount).toBe(-349.05);
    expect(totals.estimatedMargin).toBe(2799.05);
    expect(totals.marginState).toBe("full");
  });

  it("an offer exactly at the Break-even Floor is discounted, not below cost", () => {
    const totals = bundleTotals(LINES, 6700.95);

    expect(totals.estimatedMargin).toBe(0);
    expect(totals.marginState).toBe("discounted");
  });

  it("an offer under the Break-even Floor is below cost with a negative margin", () => {
    const totals = bundleTotals(LINES, 6000);

    expect(totals.estimatedMargin).toBe(-700.95);
    expect(totals.marginState).toBe("belowCost");
  });

  it("an empty Bundle has zero totals and no discount percentage", () => {
    const totals = bundleTotals([]);

    expect(totals.bundleQuote).toBe(0);
    expect(totals.breakEvenFloor).toBe(0);
    expect(totals.discountPct).toBe(0);
  });
});
