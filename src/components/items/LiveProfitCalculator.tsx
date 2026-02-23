import { formatPHP } from "../../lib/formatters";
import { cn } from "../../lib/utils";

interface LiveProfitCalculatorProps {
  pricePHP: number;
  localShippingPHP: number;
  forwarderFee: number;
  forwarderBuyFeePHP: number;
  qcServiceFeePHP: number;
  lalamoveFee: number;
  totalCost: number;
  sellingPrice: number;
  profit: number;
  markupPercent: number;
}

export function LiveProfitCalculator(props: LiveProfitCalculatorProps) {
  const rows = [
    { label: "Item Price", value: props.pricePHP },
    { label: "Local Shipping", value: props.localShippingPHP },
    { label: "Forwarder Fee", value: props.forwarderFee },
    { label: "Forwarder Buy Fee", value: props.forwarderBuyFeePHP },
    { label: "QC Service Fee", value: props.qcServiceFeePHP },
    { label: "Lalamove Fee", value: props.lalamoveFee },
  ].filter((row) => row.label === "Item Price" || row.value > 0);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4 space-y-3">
      <h3 className="font-display font-semibold text-sm text-primary">
        Cost and Profit
      </h3>

      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-secondary">{row.label}</span>
            <span className="font-mono text-primary">{formatPHP(row.value)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-border-subtle pt-2 space-y-1.5">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-secondary">Total Cost</span>
          <span className="font-mono text-primary">{formatPHP(props.totalCost)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Selling Price</span>
          <span className="font-mono text-primary">
            {props.sellingPrice > 0 ? formatPHP(props.sellingPrice) : "--"}
          </span>
        </div>
      </div>

      <div className="border-t border-border-subtle pt-2 space-y-1.5">
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-secondary">Profit</span>
          <span
            className={cn(
              "font-mono",
              props.profit > 0
                ? "text-success"
                : props.profit < 0
                  ? "text-danger"
                  : "text-tertiary"
            )}
          >
            {props.sellingPrice > 0 ? formatPHP(props.profit) : "--"}
          </span>
        </div>
        {props.sellingPrice > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-secondary">Markup</span>
            <span className="font-mono text-secondary">
              {props.markupPercent.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
