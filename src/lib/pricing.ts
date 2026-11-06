import {
  FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT,
  FORWARDER_BUY_QC_FEE_PHP,
  type ItemCategory,
} from "./constants";

// The Quote Calculator's pricing math. Pure: no React, no Convex, so every
// screen that quotes calls the same function.

export type QuoteMode = "regular" | "forwarder";

export interface QuoteLineInput {
  priceCNY: number;
  localShippingCNY: number;
  mode: QuoteMode;
  /** CNY → PHP rate for the chosen mode. */
  rate: number;
  category: ItemCategory;
  markups: Record<ItemCategory, number>;
}

export interface QuoteLine {
  /** Commission on the item price, in CNY. Zero in regular mode. */
  commissionCNY: number;
  /** Zero in regular mode. */
  qcFee: number;
  cost: number;
  markup: number;
  quote: number;
}

export function quoteLine(input: QuoteLineInput): QuoteLine {
  const { priceCNY, localShippingCNY, mode, rate, category, markups } = input;
  const isForwarder = mode === "forwarder";
  const commissionCNY = isForwarder
    ? priceCNY * (FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT / 100)
    : 0;
  const qcFee = isForwarder ? FORWARDER_BUY_QC_FEE_PHP : 0;
  const cost = (priceCNY + localShippingCNY) * rate + commissionCNY * rate + qcFee;
  const markup = markups[category];
  // The quote rounds from the unrounded cost, as the calculator always has.
  return {
    commissionCNY,
    qcFee,
    cost: round2(cost),
    markup,
    quote: round2(cost + markup),
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
