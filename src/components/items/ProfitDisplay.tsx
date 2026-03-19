import { cn } from "../../lib/utils";
import { formatPHP } from "../../lib/formatters";

interface ProfitDisplayProps {
  profit: number | undefined;
  className?: string;
}

export function ProfitDisplay({ profit, className }: ProfitDisplayProps) {
  const colorClass =
    profit == null || profit === 0
      ? "text-tertiary"
      : profit > 0
        ? "text-success"
        : "text-danger";

  return (
    <span className={cn("text-sm font-semibold", colorClass, className)}>
      {formatPHP(profit)}
    </span>
  );
}
