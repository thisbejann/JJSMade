import { useNavigate } from "react-router";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { StatusPipeline } from "../../components/items/StatusPipeline";
import { ItemStatusBadge } from "../../components/items/ItemStatusBadge";
import { CategoryIcon } from "../../components/items/CategoryIcon";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatPHP, formatRelativeDate } from "../../lib/formatters";
import { useDashboardData, usePendingQc } from "./shared";

/**
 * Variant B — "Console".
 * Terminal-native density. Monospace numerics throughout, a system header line,
 * metrics as divider-separated cells, and recent orders as a compact data table.
 * Character comes from density + the mono voice, not decoration.
 */
export function VariantConsole() {
  const navigate = useNavigate();
  const { stats, statusCounts, recent } = useDashboardData();
  const { items: qcItems, handleQc } = usePendingQc();

  return (
    <div className="space-y-7">
      {/* System line */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2 font-mono text-xs text-tertiary">
        <span className="tracking-wide">
          jjsmade<span className="text-accent">::</span>control
        </span>
        <span className="tabular-nums">{format(new Date(), "yyyy.MM.dd")}</span>
      </div>

      {/* Metrics — divider-separated cells, mono values */}
      {stats === undefined ? (
        <Skeleton className="h-16" />
      ) : (
        <div className="grid grid-cols-2 divide-x divide-y divide-border-subtle border-y border-border-subtle sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-5">
          <Cell label="profit_mtd" value={formatPHP(stats.profitThisMonth)} accent />
          <Cell label="revenue_mtd" value={formatPHP(stats.revenueThisMonth)} />
          <Cell label="avg_profit" value={formatPHP(stats.avgProfitThisMonth)} />
          <Cell label="sold_mtd" value={String(stats.soldThisMonth)} />
          <Cell label="in_pipeline" value={String(stats.inPipeline)} />
        </div>
      )}

      {/* Pipeline */}
      {statusCounts === undefined ? (
        <Skeleton className="h-12" />
      ) : (
        <StatusPipeline statusCounts={statusCounts} />
      )}

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_360px]">
        {/* Recent orders — compact table */}
        <section>
          <div className="mb-2 flex items-center justify-between font-mono text-xs text-tertiary">
            <span>recent_orders</span>
            <button
              onClick={() => navigate("/orders")}
              className="cursor-pointer transition-colors hover:text-primary"
            >
              [ view_all ]
            </button>
          </div>
          {recent === undefined ? (
            <div className="space-y-1.5 pt-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="py-8 font-mono text-xs text-tertiary">// no orders</p>
          ) : (
            <div className="divide-y divide-border-subtle border-y border-border-subtle">
              {recent.map((item) => (
                <button
                  key={item._id}
                  onClick={() => navigate(`/orders/${item._id}`)}
                  className="flex w-full cursor-pointer items-center gap-3 py-1.5 text-left transition-colors hover:bg-hover"
                >
                  <CategoryIcon category={item.category} className="h-6 w-6 rounded-md" />
                  <p className="min-w-0 flex-1 truncate text-sm text-primary">{item.name}</p>
                  <span className="hidden shrink-0 font-mono text-xs tabular-nums text-tertiary sm:block">
                    {formatRelativeDate(item.createdAt)}
                  </span>
                  <ItemStatusBadge status={item.status} className="shrink-0" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Pending QC — console panel (actionable, elevated surface) */}
        <section
          className={`h-fit rounded-2xl bg-elevated p-3 ${
            qcItems && qcItems.length > 0 ? "ring-1 ring-accent/25" : "ring-1 ring-border-subtle"
          }`}
        >
          <div className="mb-2 flex items-center justify-between font-mono text-xs">
            <span className="text-secondary">
              pending_qc
              {qcItems && qcItems.length > 0 && (
                <span className="ml-2 text-accent">[{qcItems.length}]</span>
              )}
            </span>
            {qcItems && qcItems.length > 5 && (
              <button
                onClick={() => navigate("/orders?qcStatus=pending_review")}
                className="cursor-pointer text-tertiary transition-colors hover:text-primary"
              >
                [ all ]
              </button>
            )}
          </div>
          {qcItems === undefined ? (
            <div className="space-y-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-11" />
              ))}
            </div>
          ) : qcItems.length === 0 ? (
            <p className="py-2 font-mono text-xs text-tertiary">// all clear</p>
          ) : (
            <div className="divide-y divide-border-subtle">
              <AnimatePresence initial={false}>
                {qcItems.slice(0, 5).map((item) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="flex items-center gap-2.5 py-2"
                  >
                    <CategoryIcon category={item.category} className="h-6 w-6 rounded-md" />
                    <button
                      onClick={() => navigate(`/orders/${item._id}`)}
                      className="min-w-0 flex-1 cursor-pointer text-left transition-opacity hover:opacity-80"
                    >
                      <p className="truncate text-sm text-primary">{item.name}</p>
                      <p className="truncate font-mono text-xs text-tertiary">{item.seller}</p>
                    </button>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => handleQc(item._id, "gl")}
                        className="cursor-pointer rounded-md bg-success/8 px-2 py-1.5 font-mono text-xs font-medium text-success transition-colors hover:bg-success/15"
                      >
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => handleQc(item._id, "rl")}
                        className="cursor-pointer rounded-md bg-danger/8 px-2 py-1.5 font-mono text-xs font-medium text-danger transition-colors hover:bg-danger/15"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-4 py-3">
      <p className="font-mono text-[0.6875rem] uppercase tracking-wide text-tertiary">{label}</p>
      <p
        className={`mt-1 font-mono text-lg font-medium tabular-nums ${
          accent ? "text-accent" : "text-primary"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
