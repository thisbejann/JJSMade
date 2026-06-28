import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  UserGroupIcon,
  Tag01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import { ItemStatusBadge } from "./ItemStatusBadge";
import { ProfitDisplay } from "./ProfitDisplay";
import { formatPHP, formatPercent } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

const GROUP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ordered:               { label: "Ordered",       color: "bg-blue-500/15 text-blue-400" },
  qc_sent:               { label: "QC Sent",        color: "bg-yellow-500/15 text-yellow-400" },
  item_shipout:          { label: "Item Shipout",   color: "bg-blue-500/15 text-blue-400" },
  arrived_ph_warehouse:  { label: "Arrived in PH",  color: "bg-yellow-500/15 text-yellow-400" },
  delivered_to_customer: { label: "Delivered",      color: "bg-green-500/15 text-green-400" },
  completed:             { label: "Completed",      color: "bg-green-500/15 text-green-400" },
  cancelled:             { label: "Cancelled",      color: "bg-red-500/15 text-red-400" },
};

interface GroupOrderRowProps {
  group: {
    _id: Id<"orderGroups">;
    customerName: string;
    status: string;
    orderDate: number;
    totalSellingPrice: number;
    totalProfit: number;
    // Negotiated-bundle fields (group-level override of the full price).
    negotiatedTotal: number | null;
    effectiveTotal: number;
    discount: number;
    discountPct: number;
    groupProfit: number;
    stale: boolean;
    items: Doc<"items">[];
  };
}

/** Neutral (non-coral) discount chip — discount is data, not an action. */
function DiscountChip({ discount, discountPct }: { discount: number; discountPct: number }) {
  if (discount <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-elevated border border-border-subtle px-2 py-0.5 text-xs text-secondary">
      <HugeiconsIcon icon={Tag01Icon} size={10} strokeWidth={1.5} />
      <span className="font-mono">−{formatPHP(discount)}</span>
      <span className="text-tertiary">({formatPercent(discountPct)})</span>
    </span>
  );
}

/** Subtle "review" badge shown when the agreed price is stale. */
function ReviewBadge() {
  return (
    <span
      title="Items changed since this price was set — review"
      className="inline-flex items-center gap-1 text-warning text-xs shrink-0"
    >
      <HugeiconsIcon icon={Alert02Icon} size={12} strokeWidth={1.8} />
      review
    </span>
  );
}

export function GroupOrderRow({ group }: GroupOrderRowProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const statusCfg = GROUP_STATUS_CONFIG[group.status] ?? { label: group.status, color: "bg-surface text-secondary" };

  return (
    <>
      {/* Group summary row */}
      <tr
        onClick={() => navigate(`/groups/${group._id}`)}
        className="border-b border-border-subtle hover:bg-hover cursor-pointer transition-colors"
      >
        {/* Expand toggle */}
        <td className="py-3 px-4 w-px">
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            aria-label={expanded ? "Collapse group" : "Expand group"}
            className="p-1.5 rounded text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            <HugeiconsIcon
              icon={expanded ? ArrowDown01Icon : ArrowRight01Icon}
              size={14}
              strokeWidth={2}
            />
          </button>
        </td>
        {/* Customer name + group indicator */}
        <td className="py-3 px-4" colSpan={2}>
          <div className="flex items-center gap-2 min-w-0">
            <HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.5} className="text-accent shrink-0" />
            <span className="text-sm font-medium text-primary truncate">{group.customerName}</span>
            <span className="text-xs text-secondary shrink-0">· {group.items.length} item{group.items.length !== 1 ? "s" : ""}</span>
            {group.stale && <ReviewBadge />}
          </div>
        </td>
        {/* Status */}
        <td className="py-3 px-4">
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusCfg.color)}>
            {statusCfg.label}
          </span>
        </td>
        {/* QC — empty for group rows */}
        <td className="py-3 px-4" />
        {/* Weight — empty */}
        <td className="py-3 px-4" />
        {/* Customer pays (effective total) + discount chip */}
        <td className="py-3 px-4">
          <div className="flex flex-col items-start gap-0.5">
            <span className="font-mono text-sm text-primary">{formatPHP(group.effectiveTotal)}</span>
            {group.negotiatedTotal != null && (
              <DiscountChip discount={group.discount} discountPct={group.discountPct} />
            )}
          </div>
        </td>
        {/* Profit (at the effective/negotiated price) */}
        <td className="py-3 px-4">
          <ProfitDisplay profit={group.groupProfit} />
        </td>
        {/* Actions — empty */}
        <td className="py-3 px-4" />
      </tr>

      {/* Expanded sub-rows */}
      {expanded && group.items.map((item) => (
        <tr
          key={item._id}
          onClick={(e) => { e.stopPropagation(); navigate(`/orders/${item._id}`); }}
          className="border-b border-border-subtle bg-subtle/50 hover:bg-hover cursor-pointer transition-colors"
        >
          <td className="py-2 px-4" /> {/* indent spacer */}
          <td className="py-2 px-4" colSpan={2}>
            <div className="flex items-center gap-2 pl-4 min-w-0">
              <Link
                to={`/orders/${item._id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-secondary hover:text-primary transition-colors truncate max-w-[180px]"
              >
                {item.name}
              </Link>
            </div>
          </td>
          <td className="py-2 px-4">
            <ItemStatusBadge status={item.status} />
          </td>
          <td className="py-2 px-4" />
          <td className="py-2 px-4" />
          <td className="py-2 px-4 font-mono text-sm text-secondary">
            {formatPHP(item.sellingPrice)}
          </td>
          <td className="py-2 px-4">
            <ProfitDisplay profit={item.profit} />
          </td>
          <td className="py-2 px-4" />
        </tr>
      ))}
    </>
  );
}

/** Card variant for mobile/grid view */
export function GroupOrderCard({ group }: GroupOrderRowProps) {
  const navigate = useNavigate();
  const statusCfg = GROUP_STATUS_CONFIG[group.status] ?? { label: group.status, color: "bg-surface text-secondary" };

  return (
    <div
      onClick={() => navigate(`/groups/${group._id}`)}
      className="rounded-xl border border-border-subtle bg-surface p-4 space-y-3 cursor-pointer transition-colors hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.5} className="text-accent shrink-0" />
          <h3 className="text-sm font-semibold text-primary truncate">{group.customerName}</h3>
          {group.stale && <ReviewBadge />}
        </div>
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0", statusCfg.color)}>
          {statusCfg.label}
        </span>
      </div>
      <p className="text-xs text-secondary">{group.items.length} item{group.items.length !== 1 ? "s" : ""}</p>
      {/* Customer pays + profit on one row, neutral discount chip beneath */}
      <div className="flex items-end justify-between pt-2 border-t border-border-subtle">
        <div className="min-w-0">
          <p className="text-xs text-secondary">Customer pays</p>
          <p className="font-mono text-sm font-semibold text-primary tabular-nums">{formatPHP(group.effectiveTotal)}</p>
          {group.negotiatedTotal != null && (
            <div className="mt-1">
              <DiscountChip discount={group.discount} discountPct={group.discountPct} />
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-secondary">Profit</p>
          <ProfitDisplay profit={group.groupProfit} />
        </div>
      </div>
    </div>
  );
}
