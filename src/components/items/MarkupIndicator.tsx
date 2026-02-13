import { formatPHP } from "../../lib/formatters";
import { cn } from "../../lib/utils";

interface MarkupIndicatorProps {
  markup: number;
  min: number;
  max: number;
}

export function MarkupIndicator({ markup, min, max }: MarkupIndicatorProps) {
  const inRange = markup >= min && markup <= max;
  const nearRange = markup >= min - 100 && markup <= max + 100;
  const color = inRange ? "text-success" : nearRange ? "text-warning" : "text-danger";
  const barColor = inRange ? "bg-success" : nearRange ? "bg-warning" : "bg-danger";

  const range = max - min + 200;
  const position = Math.max(0, Math.min(100, ((markup - (min - 100)) / range) * 100));

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-secondary">Markup</span>
        <span className={cn("font-mono text-sm font-medium", color)}>
          {formatPHP(markup)}
        </span>
      </div>
      <div className="relative h-1.5 bg-hover rounded-full overflow-hidden">
        <div
          className={cn("absolute top-0 left-0 h-full rounded-full transition-all", barColor)}
          style={{ width: `${position}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-tertiary font-mono">
        <span>{formatPHP(min)}</span>
        <span>{formatPHP(max)}</span>
      </div>
    </div>
  );
}
