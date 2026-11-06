import { describe, it, expect } from "vitest";
import {
  bundleTotals,
  isShippingEstimated,
  quoteLine,
  shippingGap,
  shippingGapTotal,
  weightClassFor,
  weightPreset,
} from "./pricing";

describe("weightPreset", () => {
  it.each([
    ["light", 42, 0.8],
    ["light", 43, 0.9],
    ["regular", 42, 1.1],
    ["regular", 43, 1.2],
    ["chunky", 42, 1.5],
    ["chunky", 43, 1.7],
  ] as const)("Shoes %s at EU %s is %s kg", (build, euSize, kg) => {
    expect(weightPreset("shoes", { shoeBuild: build, euSize })).toBe(kg);
  });

  it("a half size follows its numeric value, so EU 42.5 counts as 43+", () => {
    expect(weightPreset("shoes", { shoeBuild: "chunky", euSize: 42.5 })).toBe(1.7);
    expect(weightPreset("shoes", { shoeBuild: "light", euSize: 42.5 })).toBe(0.9);
  });

  it("small sizes stay in the ≤ 42 range", () => {
    expect(weightPreset("shoes", { shoeBuild: "regular", euSize: 36 })).toBe(1.1);
  });

  it("Shoes with no build default to Regular", () => {
    expect(weightPreset("shoes", { euSize: 41 })).toBe(1.1);
    expect(weightPreset("shoes", { euSize: 44 })).toBe(1.2);
  });

  it("Shoes with no EU size lean heavy and use the 43+ range", () => {
    expect(weightPreset("shoes", { shoeBuild: "chunky" })).toBe(1.7);
    expect(weightPreset("shoes")).toBe(1.2);
  });

  it.each([
    ["light", 0.5],
    ["heavy", 1.0],
  ] as const)("Clothes %s is %s kg", (weight, kg) => {
    expect(weightPreset("clothes", { clothingWeight: weight })).toBe(kg);
  });

  it("Clothes with no weight default to Light", () => {
    expect(weightPreset("clothes")).toBe(0.5);
  });

  it.each([
    ["small", 1.5],
    ["large", 3.5],
  ] as const)("Bags %s is %s kg", (size, kg) => {
    expect(weightPreset("bags", { bagSize: size })).toBe(kg);
  });

  it("Bags with no Bag Size default to Large", () => {
    expect(weightPreset("bags")).toBe(3.5);
  });

  it("Watches & Accessories uses the Accessories preset until Watches split off", () => {
    expect(weightPreset("watches_accessories")).toBe(0.5);
  });
});


const BASE = { ratePerKg: 480, profitTarget: 400 };

describe("quoteLine", () => {
  it("regular mode quotes cost + preset kg × forwarder rate + the Profit Target", () => {
    const line = quoteLine({
      ...BASE,
      priceCNY: 300,
      localShippingCNY: 10,
      mode: "regular",
      rate: 8.2,
      category: "shoes",
      weightClass: { shoeBuild: "chunky", euSize: 44 },
    });

    // (300 + 10) × 8.2 = 2542; 1.7 kg × 480 = 816
    expect(line.cost).toBe(2542);
    expect(line.estimatedWeightKg).toBe(1.7);
    expect(line.estimatedShippingPHP).toBe(816);
    expect(line.quote).toBe(3758);
  });

  it("Forwarder Buy mode adds the 10% commission and the ₱150 QC fee to cost, then shipping and profit", () => {
    const line = quoteLine({
      ...BASE,
      priceCNY: 300,
      localShippingCNY: 10,
      mode: "forwarder",
      rate: 8.6,
      category: "clothes",
      weightClass: { clothingWeight: "heavy" },
    });

    // 310 × 8.6 = 2666, commission 30 × 8.6 = 258, QC 150; 1.0 kg × 480 = 480
    expect(line.cost).toBe(3074);
    expect(line.estimatedShippingPHP).toBe(480);
    expect(line.quote).toBe(3954);
  });

  it("a Large bag quotes cost + 3.5 kg × forwarder rate + the Profit Target", () => {
    const line = quoteLine({
      ...BASE,
      priceCNY: 300,
      localShippingCNY: 10,
      mode: "regular",
      rate: 8.2,
      category: "bags",
      weightClass: { bagSize: "large" },
    });

    // 2542 + 3.5 × 480 = 1680 + 400
    expect(line.estimatedShippingPHP).toBe(1680);
    expect(line.quote).toBe(4622);
  });

  it("a typed kg replaces a Bag Size preset", () => {
    const line = quoteLine({
      ...BASE,
      priceCNY: 300,
      localShippingCNY: 10,
      mode: "regular",
      rate: 8.2,
      category: "bags",
      weightClass: { bagSize: "small" },
      kgOverride: 2.2,
    });

    expect(line.estimatedWeightKg).toBe(2.2);
    expect(line.estimatedShippingPHP).toBe(1056);
  });

  it("a typed kg replaces the preset", () => {
    const line = quoteLine({
      ...BASE,
      priceCNY: 300,
      localShippingCNY: 10,
      mode: "regular",
      rate: 8.2,
      category: "shoes",
      weightClass: { shoeBuild: "regular", euSize: 41 },
      kgOverride: 2,
    });

    expect(line.estimatedWeightKg).toBe(2);
    expect(line.estimatedShippingPHP).toBe(960);
    expect(line.quote).toBe(3902);
    expect(line.estimatedWeightTyped).toBe(true);
  });

  it("a blank (zero) typed kg falls back to the preset", () => {
    const line = quoteLine({
      ...BASE,
      priceCNY: 300,
      localShippingCNY: 10,
      mode: "regular",
      rate: 8.2,
      category: "clothes",
      kgOverride: 0,
    });

    expect(line.estimatedWeightKg).toBe(0.5);
    expect(line.quote).toBe(3182);
    expect(line.estimatedWeightTyped).toBe(false);
  });

  it("a line with no class picked uses the default preset", () => {
    const line = quoteLine({
      ...BASE,
      priceCNY: 300,
      localShippingCNY: 10,
      mode: "regular",
      rate: 8.2,
      category: "shoes",
    });

    // Regular, 43+: 1.2 kg × 480 = 576
    expect(line.estimatedShippingPHP).toBe(576);
    expect(line.quote).toBe(3518);
  });

  it("uses the Settings forwarder rate and Profit Target", () => {
    const line = quoteLine({
      priceCNY: 300,
      localShippingCNY: 10,
      mode: "regular",
      rate: 8.2,
      category: "watches_accessories",
      ratePerKg: 500,
      profitTarget: 600,
    });

    // 0.5 kg × 500 = 250
    expect(line.estimatedShippingPHP).toBe(250);
    expect(line.quote).toBe(3392);
  });

  it("rounds cost and quote to centavos, quoting from the unrounded cost", () => {
    const line = quoteLine({
      ...BASE,
      priceCNY: 123.45,
      localShippingCNY: 10,
      mode: "regular",
      rate: 8.13,
      category: "watches_accessories",
    });

    // 133.45 × 8.13 = 1084.9485; + 240 shipping + 400
    expect(line.cost).toBe(1084.95);
    expect(line.quote).toBe(1724.95);
  });
});

// Each line is cost + Estimated Shipping + the ₱400 Profit Target.
const LINES = [
  { quote: 3392, cost: 2542, estimatedShippingPHP: 450 },
  { quote: 1934.95, cost: 1084.95, estimatedShippingPHP: 450 },
  { quote: 3824, cost: 3074, estimatedShippingPHP: 350 },
];

describe("bundleTotals", () => {
  it("sums line quotes into the Bundle Quote and cost + shipping into the Break-even Floor", () => {
    const totals = bundleTotals(LINES);

    expect(totals.bundleQuote).toBe(9150.95);
    // 6700.95 cost + 1250 shipping
    expect(totals.breakEvenFloor).toBe(7950.95);
  });

  it("totals Estimated Shipping as the plain sum of its lines", () => {
    const totals = bundleTotals([
      { quote: 1000, cost: 500, estimatedShippingPHP: 100.01 },
      { quote: 1000, cost: 500, estimatedShippingPHP: 0.02 },
    ]);

    expect(totals.estimatedShippingTotal).toBe(100.03);
  });

  it("with a discounted Offer Total, derives the discount and the Estimated Margin over the floor", () => {
    const totals = bundleTotals(LINES, 8000);

    expect(totals.discount).toBe(1150.95);
    expect(totals.discountPct).toBeCloseTo(12.5774, 4);
    expect(totals.estimatedMargin).toBe(49.05);
    expect(totals.marginState).toBe("discounted");
  });

  it("without an Offer Total, prices at the full Bundle Quote and earns the Profit Targets", () => {
    const totals = bundleTotals(LINES);

    expect(totals.discount).toBe(0);
    expect(totals.discountPct).toBe(0);
    expect(totals.estimatedMargin).toBe(1200);
    expect(totals.estimatedShippingTotal).toBe(1250);
    expect(totals.marginState).toBe("full");
  });

  it("an offer above the Bundle Quote is a full margin with a negative discount", () => {
    const totals = bundleTotals(LINES, 9500);

    expect(totals.discount).toBe(-349.05);
    expect(totals.estimatedMargin).toBe(1549.05);
    expect(totals.marginState).toBe("full");
  });

  it("an offer exactly at the Break-even Floor is discounted, not below cost", () => {
    const totals = bundleTotals(LINES, 7950.95);

    expect(totals.estimatedMargin).toBe(0);
    expect(totals.marginState).toBe("discounted");
  });

  it("an offer that covers cost but not shipping is below cost", () => {
    const totals = bundleTotals(LINES, 7000);

    expect(totals.estimatedMargin).toBe(-950.95);
    expect(totals.marginState).toBe("belowCost");
  });

  it("an all-watch Bundle carries no shipping, so its floor is the cost alone", () => {
    const totals = bundleTotals(
      [
        { quote: 5400, cost: 5000, estimatedShippingPHP: 0 },
        { quote: 3400, cost: 3000, estimatedShippingPHP: 0 },
      ],
      8500
    );

    expect(totals.breakEvenFloor).toBe(8000);
    expect(totals.estimatedShippingTotal).toBe(0);
    expect(totals.estimatedMargin).toBe(500);
  });

  it("an empty Bundle has zero totals and no discount percentage", () => {
    const totals = bundleTotals([]);

    expect(totals.bundleQuote).toBe(0);
    expect(totals.breakEvenFloor).toBe(0);
    expect(totals.estimatedShippingTotal).toBe(0);
    expect(totals.discountPct).toBe(0);
  });
});

describe("shippingGap", () => {
  it("is positive when the Item weighed more than estimated: I absorbed more", () => {
    // est. 1.7 kg = ₱816, actual 1.9 kg = ₱912 at ₱480/kg
    expect(shippingGap(1.7, 1.9, 480)).toBe(96);
  });

  it("is negative when the Item weighed less than estimated", () => {
    // est. 3.5 kg = ₱1,680, actual 3.3 kg = ₱1,584
    expect(shippingGap(3.5, 3.3, 480)).toBe(-96);
  });

  it("is zero when the estimate was exact", () => {
    expect(shippingGap(1.2, 1.2, 480)).toBe(0);
  });

  it("is none when the Item has no estimate", () => {
    expect(shippingGap(undefined, 1.9, 480)).toBeNull();
  });

  it("is none when the Item is not yet weighed", () => {
    expect(shippingGap(1.7, undefined, 480)).toBeNull();
  });
});

describe("shippingGapTotal", () => {
  it("sums the gap across members that have both weights, skipping the rest", () => {
    expect(
      shippingGapTotal([
        { estimatedWeightKg: 1.7, weightKg: 1.9, forwarderRatePerKg: 480 }, // +96
        { estimatedWeightKg: 3.5, weightKg: 3.3, forwarderRatePerKg: 480 }, // −96
        { estimatedWeightKg: 1.2, weightKg: 1.5, forwarderRatePerKg: 500 }, // +150
        { estimatedWeightKg: 0.5, forwarderRatePerKg: 480 }, // not weighed
        { weightKg: 0.8, forwarderRatePerKg: 480 }, // no estimate
      ])
    ).toEqual({ total: 150, count: 3 });
  });

  it("counts none when no member has both weights", () => {
    expect(
      shippingGapTotal([
        { estimatedWeightKg: 0.5, forwarderRatePerKg: 480 },
        { weightKg: 0.8, forwarderRatePerKg: 480 },
      ])
    ).toEqual({ total: 0, count: 0 });
    expect(shippingGapTotal([])).toEqual({ total: 0, count: 0 });
  });
});

describe("isShippingEstimated", () => {
  it("is true for an unweighed Item quoted in the calculator", () => {
    expect(isShippingEstimated({ estimatedWeightKg: 1.7 })).toBe(true);
  });

  it("is false once the Item is weighed", () => {
    expect(isShippingEstimated({ estimatedWeightKg: 1.7, weightKg: 1.9 })).toBe(false);
  });

  it("is false for an Item with no estimate", () => {
    expect(isShippingEstimated({})).toBe(false);
  });
});

describe("weightClassFor", () => {
  const all = {
    shoeBuild: "chunky",
    euSize: 44,
    clothingWeight: "heavy",
    bagSize: "small",
  } as const;

  it("keeps a shoe's build and EU size", () => {
    expect(weightClassFor("shoes", all)).toEqual({ shoeBuild: "chunky", euSize: 44 });
  });

  it("keeps only the Clothing Weight for clothes", () => {
    expect(weightClassFor("clothes", all)).toEqual({ clothingWeight: "heavy" });
  });

  it("keeps only the Bag Size for bags", () => {
    expect(weightClassFor("bags", all)).toEqual({ bagSize: "small" });
  });

  it("keeps nothing for a category without a class", () => {
    expect(weightClassFor("watches_accessories", all)).toEqual({});
  });
});
