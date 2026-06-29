import { cn } from "../../lib/utils";

export interface MetricTile {
  label: string;
  value: string;
  /**
   * Optional class for the value. Reserve for data-driven semantic color
   * (e.g. `text-success` on profit) — twMerge overrides the default `text-primary`.
   */
  valueClassName?: string;
}

/**
 * The hairline-divided tonal tile panel — the system replacement for
 * "N identical bordered StatCards in a row". The 1px gaps on a `bg-border-subtle`
 * backing read as dividers, so the cells share one quiet plane instead of each
 * carrying its own card chrome. Caller controls column count via `className`
 * (e.g. `grid-cols-2 sm:grid-cols-5`). Established on the Dashboard hero.
 */
export function MetricTiles({
  metrics,
  className,
}: {
  metrics: MetricTile[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-3xl bg-border-subtle",
        className,
      )}
    >
      {metrics.map((metric) => (
        <div key={metric.label} className="bg-surface px-4 py-3.5">
          <p
            className={cn(
              "text-lg font-semibold tabular-nums text-primary",
              metric.valueClassName,
            )}
          >
            {metric.value}
          </p>
          <p className="mt-0.5 text-xs text-tertiary">{metric.label}</p>
        </div>
      ))}
    </div>
  );
}
