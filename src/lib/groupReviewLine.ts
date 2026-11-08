import { categoryHasSize } from "../../convex/helpers";
import { FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT, type ItemCategory } from "./constants";
import { weightClassFor, type WeightClass } from "./pricing";

/** One negotiated Bundle line handed in from the calculator. */
export interface BundleLine {
  id: string;
  category: ItemCategory;
  mode: "regular" | "forwarder";
  priceCNY: number;
  localShippingCNY: number;
  quote: number;
  estimatedWeightKg: number | null;
  weightClass: WeightClass;
  estimatedWeightTyped: boolean;
  /** A watch line's Trusted Dealer. Null on China-route lines. */
  td: { name: string; insured: boolean } | null;
}

export interface RowFields {
  name: string;
  seller: string;
  size: string;
}

/** What the calculator already knows: a watch's TD, and a shoe's EU size from its preset. */
export function initialRow(line: BundleLine): RowFields {
  const euSize = line.category === "shoes" ? line.weightClass.euSize : undefined;
  return {
    name: "",
    seller: line.td?.name ?? "",
    size: euSize === undefined ? "" : String(euSize),
  };
}

export function rowComplete(line: BundleLine, row: RowFields): boolean {
  if (!row.name.trim() || !row.seller.trim()) return false;
  return !categoryHasSize(line.category) || row.size.trim() !== "";
}

/** The line's quote-time estimate, in the shape the Item stores it. */
function lineEstimate(line: BundleLine) {
  if (line.estimatedWeightKg === null) return {};
  // Class field names match the Item's, and only the category's own one is set.
  const { shoeBuild, clothingWeight, bagSize } = weightClassFor(line.category, line.weightClass);
  return {
    estimatedWeightKg: line.estimatedWeightKg,
    shoeBuild,
    clothingWeight,
    bagSize,
    estimatedWeightTyped: line.estimatedWeightTyped,
  };
}

/** A TD's rates are absolute, so a watch sends only its TD and the server copies them. */
export function groupItemFromLine(
  line: BundleLine,
  row: RowFields,
  settings: {
    cnyToPhpRate: number;
    defaultForwarderRate: number;
    forwarderBuyServiceRate: number;
  }
) {
  const isForwarderBuy = line.mode === "forwarder";
  return {
    name: row.name.trim(),
    category: line.category,
    size: categoryHasSize(line.category) ? row.size.trim() : undefined,
    seller: row.seller.trim(),
    priceCNY: line.priceCNY,
    localShippingCNY: line.localShippingCNY,
    sellingPrice: line.quote,
    isForwarderBuy,
    exchangeRateUsed: settings.cnyToPhpRate,
    forwarderRatePerKg: settings.defaultForwarderRate,
    forwarderBuyRateUsed: isForwarderBuy ? settings.forwarderBuyServiceRate : undefined,
    forwarderBuyCommissionPercent: isForwarderBuy
      ? FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT
      : undefined,
    tdInsured: line.td?.insured,
    ...lineEstimate(line),
  };
}
