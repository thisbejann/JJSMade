import { format, formatDistanceToNow } from "date-fns";

export function formatPHP(amount: number | undefined | null): string {
  if (amount == null) return "—";
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "+₱96.00" / "−₱96.00": for differences, where the sign is the point. */
export function formatSignedPHP(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}${formatPHP(Math.abs(amount))}`;
}

/** "₱1,670.00" / "−₱900.00": a minus for losses, no plus. For margins and quotes. */
export function formatNetPHP(amount: number): string {
  return `${amount < 0 ? "−" : ""}${formatPHP(Math.abs(amount))}`;
}

export function formatCNY(amount: number | undefined | null): string {
  if (amount == null) return "—";
  return `¥${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "¥250 ship · 10% ins": a Trusted Dealer's fixed rates. */
export function formatTdRates(seller: { tdShippingCNY?: number; tdInsurancePct?: number }): string {
  return `¥${(seller.tdShippingCNY ?? 0).toLocaleString("en-US")} ship · ${seller.tdInsurancePct ?? 0}% ins`;
}

export function formatDate(timestamp: number | undefined | null): string {
  if (timestamp == null) return "—";
  return format(new Date(timestamp), "MMM d, yyyy");
}

export function formatDateShort(timestamp: number | undefined | null): string {
  if (timestamp == null) return "—";
  return format(new Date(timestamp), "MMM d");
}

export function formatRelativeDate(timestamp: number | undefined | null): string {
  if (timestamp == null) return "—";
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

export function formatWeight(kg: number | undefined | null): string {
  if (kg == null) return "—";
  return `${kg.toFixed(2)} kg`;
}

/** "1.7" / "0.85": a kg figure, up to two decimals, no unit. For inline estimates. */
export function formatKgValue(kg: number): string {
  return kg.toLocaleString("en-PH", { maximumFractionDigits: 2 });
}

export function formatPercent(value: number | undefined | null): string {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}
