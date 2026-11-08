import { ConvexError } from "convex/values";
import type { ItemCategory, ItemStatus } from "./schema";

// Pure rules shared by the Convex functions and the frontend. They live here,
// not in src/, because Convex bundles only what is inside convex/ in local and
// scratch deployments. src/lib/pricing.ts re-exports the shipping ones.

/** Forwarder Shipping Fee for a weight, in PHP. Estimated or actual, the same formula. */
export function shippingCost(weightKg: number, ratePerKg: number): number {
  return round(weightKg * ratePerKg);
}

/** Unweighed, but quoted in the calculator: cost and profit rest on Estimated Shipping. */
export function isShippingEstimated<T extends { weightKg?: number; estimatedWeightKg?: number }>(
  item: T
): item is T & { estimatedWeightKg: number } {
  return item.weightKg == null && item.estimatedWeightKg != null;
}

/** Categories existing Items may keep but new Items can't pick. */
const LEGACY_CATEGORIES: ReadonlySet<ItemCategory> = new Set(["watches_accessories"]);

export function isLegacyCategory(category: ItemCategory): boolean {
  return LEGACY_CATEGORIES.has(category);
}

/** Only Shoes (EU) and Clothes (S/M/L/XL) carry a size. */
export function categoryHasSize(category: ItemCategory): boolean {
  return category === "shoes" || category === "clothes";
}

/** Category alone decides the Sourcing Route (ADR 0004): Watches go through a Trusted Dealer. */
export function isTdRoute(category: ItemCategory): boolean {
  return category === "watches";
}

/** China-route steps, current and legacy. A TD ships straight to the owner, so a watch never reaches them. */
const WAREHOUSE_STATUSES: ReadonlySet<ItemStatus> = new Set([
  "arrived_ph_warehouse",
  "shipped_to_warehouse",
  "at_cn_warehouse",
  "shipped_to_ph",
  "at_ph_warehouse",
]);

export function statusFitsRoute(category: ItemCategory, status: ItemStatus): boolean {
  return !(isTdRoute(category) && WAREHOUSE_STATUSES.has(status));
}

export function assertStatusFitsRoute(category: ItemCategory, status: ItemStatus) {
  if (!statusFitsRoute(category, status)) {
    throw new ConvexError("Watches skip the warehouse: a TD ships straight to you");
  }
}

/** The rates a watch copies from its Trusted Dealer when it is ordered. */
export type TdRates = { tdShippingCNY: number; tdInsurancePct: number };

/**
 * A watch keeps the rates it was ordered with until its seller changes. This doesn't
 * require the name to still be a TD, so a watch stays editable after its TD is renamed.
 */
export function keepsStoredRates<
  T extends {
    category: ItemCategory;
    seller: string;
    tdShippingCNY?: number;
    tdInsurancePct?: number;
  },
>(existing: T | undefined, seller: string): existing is T & TdRates {
  return (
    existing != null &&
    isTdRoute(existing.category) &&
    existing.seller.trim() === seller.trim() &&
    existing.tdShippingCNY != null &&
    existing.tdInsurancePct != null
  );
}

type ChinaRouteInput = {
  priceCNY: number;
  exchangeRateUsed: number;
  hasLocalShipping: boolean;
  localShippingCNY?: number;
  weightKg?: number;
  /** The quote-time Weight Preset (or typed kg) carried from the calculator. */
  estimatedWeightKg?: number;
  forwarderRatePerKg: number;
  isForwarderBuy?: boolean;
  forwarderBuyRateUsed?: number;
  forwarderBuyCommissionPercent?: number;
  sellingPrice?: number;
};

/** An Item's stored cost fields. Fields of the other Sourcing Route come back empty. */
export function computeDerivedFields(
  data: ChinaRouteInput & {
    category: ItemCategory;
    /** Required on the TD route, ignored on the China route. */
    td?: TdRates & { insured: boolean };
  }
) {
  if (!isTdRoute(data.category)) {
    return { ...chinaRouteCost(data), tdShippingPHP: undefined, tdInsurancePHP: undefined };
  }
  if (!data.td) throw new Error("A watch needs its Trusted Dealer's rates");
  const cost = tdRouteCost({ priceCNY: data.priceCNY, rate: data.exchangeRateUsed, ...data.td });
  return {
    pricePHP: cost.pricePHP,
    localShippingPHP: undefined,
    forwarderFee: undefined,
    forwarderBuyFeePHP: undefined,
    qcServiceFeePHP: undefined,
    tdShippingPHP: cost.tdShippingPHP,
    tdInsurancePHP: cost.tdInsurancePHP,
    totalCost: cost.totalCost,
    profit: profitOf(data.sellingPrice, cost.totalCost),
  };
}

/** China route cost: price, local CN shipping, forwarder fee and forwarder-buy fees. */
export function chinaRouteCost(data: ChinaRouteInput) {
  const isForwarderBuy = data.isForwarderBuy ?? false;
  let forwarderBuyRate: number | undefined;
  let forwarderBuyCommissionPercent: number | undefined;
  let effectiveRate = data.exchangeRateUsed;

  if (isForwarderBuy) {
    const candidateRate = data.forwarderBuyRateUsed;
    if (
      candidateRate == null ||
      Number.isNaN(candidateRate) ||
      candidateRate <= 0
    ) {
      throw new Error("Forwarder buy service rate is required");
    }
    forwarderBuyRate = candidateRate;
    const candidateCommission = data.forwarderBuyCommissionPercent ?? 10;
    if (
      Number.isNaN(candidateCommission) ||
      candidateCommission < 0
    ) {
      throw new Error("Forwarder buy commission percent must be 0 or higher");
    }
    forwarderBuyCommissionPercent = candidateCommission;
    effectiveRate = candidateRate;
  }
  const pricePHP = round(data.priceCNY * effectiveRate);

  const localShippingPHP =
    data.hasLocalShipping && data.localShippingCNY
      ? round(data.localShippingCNY * effectiveRate)
      : undefined;

  const forwarderFee =
    data.weightKg != null
      ? shippingCost(data.weightKg, data.forwarderRatePerKg)
      : undefined;

  // Until the forwarder weighs it, profit rests on Estimated Shipping rather
  // than leaving shipping out. Only cost moves: forwarderFee stays the actual fee.
  const estimatedShippingPHP = isShippingEstimated(data)
    ? shippingCost(data.estimatedWeightKg, data.forwarderRatePerKg)
    : undefined;

  const forwarderBuyFeePHP = isForwarderBuy
    ? round(
        data.priceCNY *
          ((forwarderBuyCommissionPercent as number) / 100) *
          (forwarderBuyRate as number)
      )
    : undefined;

  const qcServiceFeePHP = isForwarderBuy ? 150 : undefined;

  const totalCost = round(
    pricePHP +
      (localShippingPHP ?? 0) +
      (forwarderFee ?? estimatedShippingPHP ?? 0) +
      (forwarderBuyFeePHP ?? 0) +
      (qcServiceFeePHP ?? 0)
  );

  return {
    pricePHP,
    localShippingPHP,
    forwarderFee,
    forwarderBuyFeePHP,
    qcServiceFeePHP,
    totalCost,
    profit: profitOf(data.sellingPrice, totalCost),
  };
}

function profitOf(sellingPrice: number | undefined, totalCost: number) {
  return sellingPrice != null ? round(sellingPrice - totalCost) : undefined;
}

/** A watch's cost on the TD route: price + TD Shipping Fee + TD Insurance (% of price only). */
export function tdRouteCost(data: {
  priceCNY: number;
  rate: number;
  tdShippingCNY: number;
  tdInsurancePct: number;
  insured: boolean;
}) {
  const pricePHP = round(data.priceCNY * data.rate);
  const tdShippingPHP = round(data.tdShippingCNY * data.rate);
  const tdInsurancePHP = data.insured
    ? round(data.priceCNY * (data.tdInsurancePct / 100) * data.rate)
    : 0;
  // Summed from the rounded parts so the total matches the breakdown shown.
  const totalCost = round(pricePHP + tdShippingPHP + tdInsurancePHP);
  return { pricePHP, tdShippingPHP, tdInsurancePHP, totalCost };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
