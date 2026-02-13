import { cn } from "../../lib/utils";
import { formatPHP, formatCNY } from "../../lib/formatters";

interface PriceDisplayProps {
  amountPHP: number | undefined;
  amountCNY?: number | undefined;
  className?: string;
}

export function PriceDisplay({ amountPHP, amountCNY, className }: PriceDisplayProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="font-mono text-sm text-primary">
        {formatPHP(amountPHP)}
      </span>
      {amountCNY != null && (
        <span className="font-mono text-xs text-secondary">
          {formatCNY(amountCNY)}
        </span>
      )}
    </div>
  );
}
