import { useQuery } from "convex/react";
import { useNavigate } from "react-router";
import { isToday, isYesterday } from "date-fns";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "../ui/Skeleton";
import { ItemStatusBadge } from "../items/ItemStatusBadge";
import { GroupStatusBadge } from "../items/GroupStatusBadge";
import { CategoryIcon } from "../items/CategoryIcon";
import { formatPHP, formatDateShort } from "../../lib/formatters";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";

function dayLabel(ts: number): string {
  if (isToday(ts)) return "Today";
  if (isYesterday(ts)) return "Yesterday";
  return formatDateShort(ts);
}

function HoverArrow() {
  return (
    <HugeiconsIcon
      icon={ArrowRight01Icon}
      size={14}
      strokeWidth={2}
      className="shrink-0 -translate-x-1 text-tertiary opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
    />
  );
}

/**
 * The dashboard feed is deliberately not a mini Orders page. The Orders page
 * is the workspace (search, filter, group); this is the ledger of what just
 * happened, so it clusters by day instead of offering controls, and each
 * entry carries its money so recent value is readable without clicking in.
 */
export function RecentOrders() {
  const feed = useQuery(api.orderGroups.recentFeed, { limit: 10 });
  const navigate = useNavigate();

  const clusters: { label: string; entries: NonNullable<typeof feed> }[] = [];
  for (const entry of feed ?? []) {
    const label = dayLabel(entry.activityAt);
    const last = clusters[clusters.length - 1];
    if (last && last.label === label) last.entries.push(entry);
    else clusters.push({ label, entries: [entry] });
  }

  return (
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

      {feed === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : feed.length === 0 ? (
        <p className="py-8 text-sm text-tertiary">No orders logged yet.</p>
      ) : (
        <div className="space-y-5">
          {clusters.map((cluster, ci) => (
            <div key={`${cluster.label}-${ci}`}>
              <p className="mb-1.5 px-2.5 text-xs font-medium uppercase tracking-wider text-tertiary">
                {cluster.label}
              </p>
              <div className="space-y-0.5">
                {cluster.entries.map((entry) =>
                  entry.kind === "group" ? (
                    // Bundles get the same elevated-tint band as the Orders
                    // page, so "this is a group" reads identically everywhere.
                    <button
                      key={entry._id}
                      onClick={() => navigate(`/groups/${entry._id}`)}
                      className="group flex w-full cursor-pointer items-center gap-3 rounded-xl bg-elevated/40 px-2.5 py-2 text-left transition-colors hover:bg-hover"
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
                        <HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.5} />
                      </span>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-primary">
                        {entry.customerName}
                        <span className="ml-1.5 font-normal text-secondary">
                          · {entry.itemCount} item{entry.itemCount !== 1 ? "s" : ""}
                        </span>
                      </p>
                      <GroupStatusBadge status={entry.status} className="shrink-0" />
                      <span className="hidden w-24 shrink-0 text-right font-mono text-sm text-primary tabular-nums sm:block">
                        {formatPHP(entry.effectiveTotal)}
                      </span>
                      <HoverArrow />
                    </button>
                  ) : (
                    <button
                      key={entry._id}
                      onClick={() => navigate(`/orders/${entry._id}`)}
                      className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-surface"
                    >
                      <CategoryIcon category={entry.category} className="h-7 w-7" />
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-primary">
                        {entry.name}
                      </p>
                      <ItemStatusBadge status={entry.status} className="shrink-0" />
                      <span className="hidden w-24 shrink-0 text-right font-mono text-sm text-secondary tabular-nums sm:block">
                        {formatPHP(entry.sellingPrice)}
                      </span>
                      <HoverArrow />
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
