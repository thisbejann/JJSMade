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
import { Skeleton } from "../../components/ui/Skeleton";
import { formatPHP, formatRelativeDate } from "../../lib/formatters";
import { useDashboardData, usePendingQc } from "./shared";

/**
 * Variant C — "Focus".
 * Warmer and more characterful. Grouping comes from tonal panels (tinted
 * surfaces, no card chrome) rather than bordered cards, so the page has visual
 * appeal without feeling boxed-in. The profit hero gets a warm accent moment;
 * Pending QC gets the warmest tint because it is the focal action.
 */
export function VariantFocus() {
  const navigate = useNavigate();
  const { stats, statusCounts, recent } = useDashboardData();
  const { items: qcItems, handleQc } = usePendingQc();

  return (
    <div className="space-y-8">
      {/* Hero band — profit leads (typography-led, no icon), supporting metrics ride a tonal panel */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-tertiary">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-stretch">
          <div className="flex items-center">
          {stats === undefined ? (
            <Skeleton className="h-14 w-56" />
          ) : (
            <div>
              <p className="text-5xl font-bold tracking-tight text-accent tabular-nums">
                {formatPHP(stats.profitThisMonth)}
              </p>
              <p className="mt-1.5 text-sm text-secondary">Profit this month</p>
            </div>
          )}
        </div>

        {stats === undefined ? (
          <Skeleton className="h-16 flex-1" />
        ) : (
          <div className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-3xl bg-border-subtle sm:grid-cols-4">
            <SoftMetric label="Revenue" value={formatPHP(stats.revenueThisMonth)} />
            <SoftMetric label="Avg profit" value={formatPHP(stats.avgProfitThisMonth)} />
            <SoftMetric label="Sold" value={String(stats.soldThisMonth)} />
            <SoftMetric label="In pipeline" value={String(stats.inPipeline)} />
          </div>
        )}
        </div>
      </div>

      {/* Pipeline */}
      {statusCounts === undefined ? (
        <Skeleton className="h-12" />
      ) : (
        <StatusPipeline statusCounts={statusCounts} />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Recent orders — borderless section with a soft hover */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Recent orders
            </h2>
            <button
              onClick={() => navigate("/orders")}
              className="cursor-pointer text-xs text-secondary transition-colors hover:text-primary"
            >
              View all
            </button>
          </div>
          {recent === undefined ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="py-8 text-sm text-tertiary">No orders logged yet.</p>
          ) : (
            <div className="space-y-1">
              {recent.map((item) => (
                <button
                  key={item._id}
                  onClick={() => navigate(`/orders/${item._id}`)}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-surface"
                >
                  <CategoryIcon category={item.category} className="h-7 w-7" />
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

        {/* Pending QC — warmest tonal panel, the focal action */}
        <section
          className={`h-fit rounded-3xl p-4 ${
            qcItems && qcItems.length > 0
              ? "bg-accent/5 ring-1 ring-accent/20"
              : "bg-surface ring-1 ring-border-subtle"
          }`}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-sm font-medium text-primary">
              Pending QC
              {qcItems && qcItems.length > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent/15 px-1.5 text-xs font-medium tabular-nums text-accent">
                  {qcItems.length}
                </span>
              )}
            </h2>
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
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : qcItems.length === 0 ? (
            <p className="px-1 py-2 text-sm text-tertiary">All clear, nothing to review.</p>
          ) : (
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {qcItems.slice(0, 5).map((item) => (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className="flex items-center gap-3 rounded-2xl bg-base/40 px-2.5 py-2.5"
                  >
                    <CategoryIcon category={item.category} className="h-7 w-7" />
                    <button
                      onClick={() => navigate(`/orders/${item._id}`)}
                      className="min-w-0 flex-1 cursor-pointer text-left transition-opacity hover:opacity-80"
                    >
                      <p className="truncate text-sm font-medium text-primary">{item.name}</p>
                      <p className="truncate text-xs text-tertiary">{item.seller}</p>
                    </button>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => handleQc(item._id, "gl")}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/20"
                      >
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} strokeWidth={2} /> GL
                      </button>
                      <button
                        onClick={() => handleQc(item._id, "rl")}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-danger/10 px-2.5 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/20"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} /> RL
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

function SoftMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3.5">
      <p className="text-lg font-semibold tabular-nums text-primary">{value}</p>
      <p className="mt-0.5 text-xs text-tertiary">{label}</p>
    </div>
  );
}
