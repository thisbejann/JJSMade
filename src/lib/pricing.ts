import {
  FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT,
  FORWARDER_BUY_QC_FEE_PHP,
  type ItemCategory,
} from "./constants";
import { shippingCost } from "../../convex/helpers";
import type { BagSize, ClothingWeight, ShoeBuild } from "../../convex/schema";

// The Quote Calculator's pricing math. Pure: no React, no Convex functions, so
// every screen that quotes calls the same function. The shipping rules the
// backend also needs live in convex/helpers.ts and are re-exported here.

export { isShippingEstimated, shippingCost } from "../../convex/helpers";
export type { BagSize, ClothingWeight, ShoeBuild };

export type QuoteMode = "regular" | "forwarder";

/**
 * The quick class that picks a Weight Preset. Field names match the Item's
 * stored fields. Each category reads only its own field (see CATEGORY_WEIGHT_CLASS).
 */
export interface WeightClass {
  shoeBuild?: ShoeBuild;
  /** Shoes only. Picks the ≤ 42 or 43+ range of the build. */
  euSize?: number;
  clothingWeight?: ClothingWeight;
  bagSize?: BagSize;
}

export type WeightClassField = "shoeBuild" | "clothingWeight" | "bagSize";

/** The one class field each category picks its Weight Preset by. Null: no class picker. */
export const CATEGORY_WEIGHT_CLASS: Record<ItemCategory, WeightClassField | null> = {
  shoes: "shoeBuild",
  clothes: "clothingWeight",
  bags: "bagSize",
  watches: null,
  accessories: null,
  watches_accessories: null,
};

/** Keeps only the class fields the category's Weight Preset reads. */
export function weightClassFor(category: ItemCategory, choices: WeightClass): WeightClass {
  const field = CATEGORY_WEIGHT_CLASS[category];
  if (field === null) return {};
  if (field === "shoeBuild") return { shoeBuild: choices.shoeBuild, euSize: choices.euSize };
  return { [field]: choices[field] };
}

// Weight Presets, kg with full packaging (ADR 0005). Changing one is a code
// change by design. Shoes: [≤ 42, 43+].
const SHOE_PRESETS: Record<ShoeBuild, readonly [number, number]> = {
  light: [0.8, 0.9],
  regular: [1.1, 1.2],
  chunky: [1.5, 1.7],
};
const CLOTHING_PRESETS: Record<ClothingWeight, number> = { light: 0.5, heavy: 1.0 };
const BAG_PRESETS: Record<BagSize, number> = { small: 1.5, large: 3.5 };
const ACCESSORIES_PRESET = 0.5;

/**
 * The typical shipped weight for a China-route line, in kg. Null means the
 * category carries no Estimated Shipping: Watches ride the TD route.
 * A missing class falls back to the heavier-leaning default, never to 0 kg.
 */
export function weightPreset(category: ItemCategory, weightClass: WeightClass = {}): number | null {
  switch (category) {
    case "shoes": {
      const [upTo42, from43] = SHOE_PRESETS[weightClass.shoeBuild ?? "regular"];
      // A half size follows its numeric value: 42.5 is 43+. No size leans heavy.
      return weightClass.euSize !== undefined && weightClass.euSize <= 42 ? upTo42 : from43;
    }
    case "clothes":
      return CLOTHING_PRESETS[weightClass.clothingWeight ?? "light"];
    case "bags":
      // Bags default to Large: a missing Bag Size must never under-quote.
      return BAG_PRESETS[weightClass.bagSize ?? "large"];
    case "accessories":
    case "watches_accessories":
      return ACCESSORIES_PRESET;
    case "watches":
      return null;
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
  /** True when a typed kg replaced the Weight Preset. */
  estimatedWeightTyped: boolean;
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
  // A typed kg only counts where a preset exists to replace.
  const estimatedWeightTyped = preset !== null && kgOverride !== undefined && kgOverride > 0;
  const estimatedWeightKg = estimatedWeightTyped ? kgOverride : preset;
  const shipping = (estimatedWeightKg ?? 0) * ratePerKg;
  // The quote rounds from the unrounded cost, as the calculator always has.
  return {
    commissionCNY,
    qcFee,
    cost: round2(cost),
    estimatedWeightKg,
    estimatedWeightTyped,
    estimatedShippingPHP: round2(shipping),
    quote: round2(cost + shipping + profitTarget),
  };
}

export interface BundleTotals {
  /** Sum of line quotes: the full price before any discount. */
  bundleQuote: number;
  /** Plain sum of line Estimated Shipping, unrounded beyond centavos. */
  estimatedShippingTotal: number;
  /** Sum of line cost + Estimated Shipping: the lowest Offer Total expected not to lose money. */
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
  lines: ReadonlyArray<Pick<QuoteLine, "quote" | "cost" | "estimatedShippingPHP">>,
  offerTotal?: number
): BundleTotals {
  const bundleQuote = round2(lines.reduce((sum, l) => sum + l.quote, 0));
  const estimatedShippingTotal = round2(lines.reduce((sum, l) => sum + l.estimatedShippingPHP, 0));
  const breakEvenFloor = round2(
    lines.reduce((sum, l) => sum + l.cost + l.estimatedShippingPHP, 0)
  );
  // No Offer Total means the customer pays the full Bundle Quote.
  const offer = offerTotal ?? bundleQuote;
  const discount = round2(bundleQuote - offer);
  const marginState: MarginState =
    offer >= bundleQuote ? "full" : offer >= breakEvenFloor ? "discounted" : "belowCost";
  return {
    bundleQuote,
    estimatedShippingTotal,
    breakEvenFloor,
    discount,
    discountPct: bundleQuote > 0 ? (discount / bundleQuote) * 100 : 0,
    estimatedMargin: round2(offer - breakEvenFloor),
    marginState,
  };
}

/**
 * Actual minus Estimated Shipping, in PHP. Positive means I absorbed more than
 * the quote expected. Null unless the Item has both an estimate and a real weight.
 */
export function shippingGap(
  estimatedWeightKg: number | undefined,
  actualWeightKg: number | undefined,
  ratePerKg: number
): number | null {
  if (estimatedWeightKg == null || actualWeightKg == null) return null;
  return round2(shippingCost(actualWeightKg, ratePerKg) - shippingCost(estimatedWeightKg, ratePerKg));
}

/**
 * A Group Order's summed gap across members with both weights, and how many
 * members that is. A count of 0 means no member qualifies yet.
 */
export function shippingGapTotal(
  members: ReadonlyArray<{
    estimatedWeightKg?: number;
    weightKg?: number;
    forwarderRatePerKg: number;
  }>
): { total: number; count: number } {
  let total = 0;
  let count = 0;
  for (const m of members) {
    const gap = shippingGap(m.estimatedWeightKg, m.weightKg, m.forwarderRatePerKg);
    if (gap !== null) {
      total += gap;
      count += 1;
    }
  }
  return { total: round2(total), count };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
