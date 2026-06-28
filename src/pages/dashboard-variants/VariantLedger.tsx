import { useNavigate } from "react-router";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { StatusPipeline } from "../../components/items/StatusPipeline";
import { ItemStatusBadge } from "../../components/items/ItemStatusBadge";
import { CategoryIcon } from "../../components/items/CategoryIcon";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatPHP, formatRelativeDate } from "../../lib/formatters";
import { useDashboardData, usePendingQc } from "./shared";

/**
 * Variant A — "Ledger".
 * Borderless, typography-led. The metrics band is the page hero, carried by
 * weight + scale contrast (no card chrome). Sections are separated by uppercase
 * tracked labels and hairline dividers. Pending QC is the single contained card
 * because it is the one actionable unit.
 */
export function VariantLedger() {
  const navigate = useNavigate();
  const { stats, statusCounts, recent } = useDashboardData();
  const { items: qcItems, handleQc } = usePendingQc();

  return (
    <div className="space-y-9">
      {/* Metrics band — the hero. No card, no icons; weight does the work. */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-tertiary">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        {stats === undefined ? (
          <div className="mt-3 flex flex-wrap items-end gap-x-10 gap-y-4">
            <Skeleton className="h-14 w-56" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-end gap-x-10 gap-y-5">
            <div>
              <p className="text-5xl font-bold tracking-tight text-accent tabular-nums">
                {formatPHP(stats.profitThisMonth)}
              </p>
              <p className="mt-1.5 text-sm text-secondary">Profit this month</p>
            </div>
            <Metric label="Revenue" value={formatPHP(stats.revenueThisMonth)} />
            <Metric label="Avg profit" value={formatPHP(stats.avgProfitThisMonth)} />
            <Metric label="Sold" value={String(stats.soldThisMonth)} />
            <Metric label="In pipeline" value={String(stats.inPipeline)} />
          </div>
        )}
      </div>

      {/* Pipeline */}
      {statusCounts === undefined ? (
        <Skeleton className="h-12" />
      ) : (
        <StatusPipeline statusCounts={statusCounts} />
      )}

      <div className="grid grid-cols-1 gap-x-10 gap-y-9 lg:grid-cols-[1fr_340px]">
        {/* Recent orders — borderless section */}
        <section>
          <SectionHeader
            title="Recent orders"
            action={
              <button
                onClick={() => navigate("/orders")}
                className="cursor-pointer text-xs text-secondary transition-colors hover:text-primary"
              >
                View all
              </button>
            }
          />
          {recent === undefined ? (
            <div className="space-y-2 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="py-8 text-sm text-tertiary">No orders logged yet.</p>
          ) : (
            <div className="divide-y divide-border-subtle border-t border-border-subtle">
              {recent.map((item) => (
                <button
                  key={item._id}
                  onClick={() => navigate(`/orders/${item._id}`)}
                  className="group flex w-full cursor-pointer items-center gap-3 py-2 text-left transition-colors hover:bg-accent/5"
                >
                  <CategoryIcon category={item.category} className="h-6 w-6" />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-primary">
                    {item.name}
                  </p>
                  <span className="hidden shrink-0 text-xs tabular-nums text-tertiary sm:block">
                    {formatRelativeDate(item.createdAt)}
                  </span>
                  <ItemStatusBadge status={item.status} className="shrink-0" />
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={14}
                    strokeWidth={2}
                    className="shrink-0 -translate-x-1 text-tertiary opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Pending QC — the single card (actionable) */}
        <Card
          size="sm"
          className={qcItems && qcItems.length > 0 ? "h-fit ring-1 ring-accent/25" : "h-fit"}
        >
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary">Pending QC</span>
              {qcItems && qcItems.length > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent/10 px-1.5 text-xs font-medium tabular-nums text-accent">
                  {qcItems.length}
                </span>
              )}
            </div>
            {qcItems && qcItems.length > 5 && (
              <button
                onClick={() => navigate("/orders?qcStatus=pending_review")}
                className="cursor-pointer text-xs text-secondary transition-colors hover:text-primary"
              >
                View all
              </button>
            )}
          </div>
          {qcItems === undefined ? (
            <div className="space-y-2 px-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-11" />
              ))}
            </div>
          ) : qcItems.length === 0 ? (
            <p className="px-4 py-2 text-sm text-tertiary">All clear, nothing to review.</p>
          ) : (
            <div className="divide-y divide-border-subtle border-t border-border-subtle">
              <AnimatePresence initial={false}>
                {qcItems.slice(0, 5).map((item) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <CategoryIcon category={item.category} className="h-6 w-6" />
                    <button
                      onClick={() => navigate(`/orders/${item._id}`)}
                      className="min-w-0 flex-1 cursor-pointer text-left transition-opacity hover:opacity-80"
                    >
                      <p className="truncate text-sm font-medium text-primary">{item.name}</p>
                      <p className="truncate text-xs text-tertiary">{item.seller}</p>
                    </button>
                    <QcButtons onGl={() => handleQc(item._id, "gl")} onRl={() => handleQc(item._id, "rl")} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xl font-semibold tabular-nums text-primary">{value}</p>
      <p className="mt-1 text-xs text-tertiary">{label}</p>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-1 flex items-center justify-between">
      <h2 className="text-xs font-medium uppercase tracking-wider text-tertiary">{title}</h2>
      {action}
    </div>
  );
}

function QcButtons({ onGl, onRl }: { onGl: () => void; onRl: () => void }) {
  return (
    <div className="flex shrink-0 gap-1.5">
      <button
        onClick={onGl}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-success/8 px-2.5 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/15"
      >
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} strokeWidth={2} /> GL
      </button>
      <button
        onClick={onRl}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-danger/8 px-2.5 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/15"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} /> RL
      </button>
    </div>
  );
}
