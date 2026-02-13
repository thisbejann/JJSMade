import { formatPHP } from "../../lib/formatters";
import { cn } from "../../lib/utils";

interface CostBreakdownProps {
  pricePHP?: number;
  localShippingPHP?: number;
  forwarderFee?: number;
  lalamoveFee?: number;
  totalCost?: number;
  sellingPrice?: number;
  profit?: number;
}

export function CostBreakdown(props: CostBreakdownProps) {
  const total = props.sellingPrice && props.sellingPrice > 0 ? props.sellingPrice : (props.totalCost ?? 0);
  if (total === 0) return null;

  const segments = [
    { label: "Item Price", value: props.pricePHP ?? 0, color: "bg-accent" },
    { label: "Local Shipping", value: props.localShippingPHP ?? 0, color: "bg-info" },
    { label: "Forwarder Fee", value: props.forwarderFee ?? 0, color: "bg-warning" },
    { label: "Lalamove", value: props.lalamoveFee ?? 0, color: "bg-secondary" },
  ].filter((s) => s.value > 0);

  if (props.profit != null && props.sellingPrice && props.sellingPrice > 0) {
    segments.push({
      label: "Profit",
      value: Math.abs(props.profit),
      color: props.profit >= 0 ? "bg-success" : "bg-danger",
    });
  }

  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="flex h-3 rounded-full overflow-hidden">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={cn("h-full transition-all", seg.color)}
            style={{ width: `${(seg.value / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <div className={cn("w-2 h-2 rounded-full shrink-0", seg.color)} />
            <span className="text-secondary">{seg.label}</span>
            <span className="font-mono text-primary ml-auto">{formatPHP(seg.value)}</span>
            <span className="text-tertiary w-10 text-right">
              {((seg.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
