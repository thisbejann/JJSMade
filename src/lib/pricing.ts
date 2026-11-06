import {
  FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT,
  FORWARDER_BUY_QC_FEE_PHP,
  type ItemCategory,
} from "./constants";

// The Quote Calculator's pricing math. Pure: no React, no Convex, so every
// screen that quotes calls the same function.

export type QuoteMode = "regular" | "forwarder";

export type ShoeBuild = "light" | "regular" | "chunky";
export type ClothingWeight = "light" | "heavy";

/** The quick class that picks a Weight Preset. Each category reads its own field. */
export interface WeightClass {
  /** Shoes */
  build?: ShoeBuild;
  /** Shoes */
  euSize?: number;
  /** Clothes */
  weight?: ClothingWeight;
}

// Weight Presets, kg with full packaging (ADR 0005). Changing one is a code
// change by design. Shoes: [≤ 42, 43+].
const SHOE_PRESETS: Record<ShoeBuild, readonly [number, number]> = {
  light: [0.8, 0.9],
  regular: [1.1, 1.2],
  chunky: [1.5, 1.7],
};
const CLOTHING_PRESETS: Record<ClothingWeight, number> = { light: 0.5, heavy: 1.0 };
const ACCESSORIES_PRESET = 0.5;

/**
 * The typical shipped weight for a China-route line, in kg. Null means the
 * category carries no Estimated Shipping (Watches, once they exist).
 * A missing class falls back to the heavier-leaning default, never to 0 kg.
 */
export function weightPreset(category: ItemCategory, cls: WeightClass = {}): number | null {
  switch (category) {
    case "shoes": {
      const [upTo42, from43] = SHOE_PRESETS[cls.build ?? "regular"];
      // A half size follows its numeric value: 42.5 is 43+. No size leans heavy.
      return cls.euSize !== undefined && cls.euSize <= 42 ? upTo42 : from43;
    }
    case "clothes":
      return CLOTHING_PRESETS[cls.weight ?? "light"];
    case "watches_accessories":
      // Until Watches split off (ADR 0004), this category prices as Accessories.
      return ACCESSORIES_PRESET;
  }
}

export interface QuoteLineInput {
  priceCNY: number;
  localShippingCNY: number;
  mode: QuoteMode;
  /** CNY → PHP rate for the chosen mode. */
  rate: number;
  category: ItemCategory;
  weightClass?: WeightClass;
  /** A typed weight in kg. Replaces the Weight Preset when above zero. */
  kgOverride?: number;
  /** Forwarder Shipping Fee rate, PHP per kg. */
  ratePerKg: number;
  profitTarget: number;
}

export interface QuoteLine {
  /** Commission on the item price, in CNY. Zero in regular mode. */
  commissionCNY: number;
  /** Zero in regular mode. */
  qcFee: number;
  /** What the item costs before shipping to PH. */
  cost: number;
  /** Null when the category carries no Estimated Shipping. */
  estimatedWeightKg: number | null;
  estimatedShippingPHP: number;
  quote: number;
}

export function quoteLine(input: QuoteLineInput): QuoteLine {
  const { priceCNY, localShippingCNY, mode, rate, category, kgOverride, ratePerKg, profitTarget } =
    input;
  const isForwarder = mode === "forwarder";
  const commissionCNY = isForwarder
    ? priceCNY * (FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT / 100)
    : 0;
  const qcFee = isForwarder ? FORWARDER_BUY_QC_FEE_PHP : 0;
  const cost = (priceCNY + localShippingCNY) * rate + commissionCNY * rate + qcFee;
  const preset = weightPreset(category, input.weightClass);
  const estimatedWeightKg =
    preset !== null && kgOverride !== undefined && kgOverride > 0 ? kgOverride : preset;
  const shipping = (estimatedWeightKg ?? 0) * ratePerKg;
  // The quote rounds from the unrounded cost, as the calculator always has.
  return {
    commissionCNY,
    qcFee,
    cost: round2(cost),
    estimatedWeightKg,
    estimatedShippingPHP: round2(shipping),
    quote: round2(cost + shipping + profitTarget),
  };
}

export interface BundleTotals {
  /** Sum of line quotes: the full price before any discount. */
  bundleQuote: number;
  /** Sum of line costs: the lowest Offer Total that doesn't lose money. */
  breakEvenFloor: number;
  /** Bundle Quote − Offer Total. */
  discount: number;
  /** Discount as a percentage of the Bundle Quote. */
  discountPct: number;
  /** Offer Total − Break-even Floor. */
  estimatedMargin: number;
  marginState: MarginState;
}

/** full: at or above the quote. discounted: below it, still above cost. */
export type MarginState = "full" | "discounted" | "belowCost";

export function bundleTotals(
  lines: ReadonlyArray<Pick<QuoteLine, "quote" | "cost">>,
  offerTotal?: number
): BundleTotals {
  const bundleQuote = round2(lines.reduce((sum, l) => sum + l.quote, 0));
  const breakEvenFloor = round2(lines.reduce((sum, l) => sum + l.cost, 0));
  // No Offer Total means the customer pays the full Bundle Quote.
  const offer = offerTotal ?? bundleQuote;
  const discount = round2(bundleQuote - offer);
  const marginState: MarginState =
    offer >= bundleQuote ? "full" : offer >= breakEvenFloor ? "discounted" : "belowCost";
  return {
    bundleQuote,
    breakEvenFloor,
    discount,
    discountPct: bundleQuote > 0 ? (discount / bundleQuote) * 100 : 0,
    estimatedMargin: round2(offer - breakEvenFloor),
    marginState,
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
