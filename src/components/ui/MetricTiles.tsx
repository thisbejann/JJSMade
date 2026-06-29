import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface MetricTile {
  label: string;
  value: string;
  /**
   * Optional class for the value. Reserve for data-driven semantic color
   * (e.g. `text-success` on profit) — twMerge overrides the default `text-primary`.
   */
  valueClassName?: string;
  /** Optional accent icon chip, anchored to the right of the cell. */
  icon?: ReactNode;
  /** Optional context line under the label (e.g. "March 2026" for Best Month). */
  sublabel?: string;
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
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className={cn(
                  "text-lg font-semibold tabular-nums text-primary",
                  metric.valueClassName,
                )}
              >
                {metric.value}
              </p>
              <p className="mt-0.5 text-xs text-tertiary">{metric.label}</p>
              {metric.sublabel && (
                <p className="mt-0.5 truncate text-xs text-tertiary">{metric.sublabel}</p>
              )}
            </div>
            {metric.icon && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
                {metric.icon}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
