import { format, formatDistanceToNow } from "date-fns";

export function formatPHP(amount: number | undefined | null): string {
  if (amount == null) return "—";
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCNY(amount: number | undefined | null): string {
  if (amount == null) return "—";
  return `¥${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

export function formatPercent(value: number | undefined | null): string {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}
