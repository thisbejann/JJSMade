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
import { GroupStatusBadge } from "./GroupStatusBadge";
import { ProfitDisplay } from "./ProfitDisplay";
import { formatPHP, formatPercent } from "../../lib/formatters";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

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

/**
 * Group rows don't share the solo-item column anatomy (no seller, QC, or
 * weight), so instead of leaving ragged empty cells they render as a
 * full-width band spanning every column. The elevated tint plus its own
 * internal layout makes "this is a bundle" legible at a glance. Money cells
 * use fixed widths so totals align vertically across bands and sub-rows.
 */
export function GroupOrderRow({ group, colSpan }: GroupOrderRowProps & { colSpan: number }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Group summary band */}
      <tr
        onClick={() => navigate(`/groups/${group._id}`)}
        className="border-b border-border-subtle bg-elevated/40 hover:bg-hover cursor-pointer transition-colors"
      >
        <td colSpan={colSpan} className="py-3 px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              aria-label={expanded ? "Collapse group" : "Expand group"}
              className="p-1.5 -my-1.5 shrink-0 rounded text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              <HugeiconsIcon
                icon={expanded ? ArrowDown01Icon : ArrowRight01Icon}
                size={14}
                strokeWidth={2}
              />
            </button>
            <HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.5} className="text-accent shrink-0" />
            <span className="min-w-0 truncate text-sm font-medium text-primary">{group.customerName}</span>
            <span className="text-xs text-secondary shrink-0">· {group.items.length} item{group.items.length !== 1 ? "s" : ""}</span>
            {group.stale && <ReviewBadge />}
            <div className="ml-auto flex shrink-0 items-center gap-5">
              {group.negotiatedTotal != null && (
                <DiscountChip discount={group.discount} discountPct={group.discountPct} />
              )}
              <GroupStatusBadge status={group.status} />
              <span className="w-28 text-right font-mono text-sm text-primary">{formatPHP(group.effectiveTotal)}</span>
              <ProfitDisplay profit={group.groupProfit} className="inline-block w-24 text-right" />
            </div>
          </div>
        </td>
      </tr>

      {/* Expanded sub-rows — indented under the band, money cells aligned with it */}
      {expanded && group.items.map((item) => (
        <tr
          key={item._id}
          onClick={(e) => { e.stopPropagation(); navigate(`/orders/${item._id}`); }}
          className="border-b border-border-subtle bg-subtle/50 hover:bg-hover cursor-pointer transition-colors"
        >
          <td colSpan={colSpan} className="py-2 pl-12 pr-4">
            <div className="flex items-center gap-3">
              <Link
                to={`/orders/${item._id}`}
                onClick={(e) => e.stopPropagation()}
                className="min-w-0 truncate text-sm text-secondary hover:text-primary transition-colors"
              >
                {item.name}
              </Link>
              <ItemStatusBadge status={item.status} />
              <div className="ml-auto flex shrink-0 items-center gap-5">
                <span className="w-28 text-right font-mono text-sm text-secondary">{formatPHP(item.sellingPrice)}</span>
                <ProfitDisplay profit={item.profit} className="inline-block w-24 text-right" />
              </div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/** Compact single-line entry for the mobile list view (table mode on small screens). */
export function GroupListRow({ group }: GroupOrderRowProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/groups/${group._id}`)}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-hover"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon icon={UserGroupIcon} size={13} strokeWidth={1.5} className="text-accent shrink-0" />
          <p className="min-w-0 truncate text-sm font-medium text-primary">{group.customerName}</p>
          {group.stale && <ReviewBadge />}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <GroupStatusBadge status={group.status} />
          <span className="text-xs text-tertiary">{group.items.length} item{group.items.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm text-primary">{formatPHP(group.effectiveTotal)}</p>
        <ProfitDisplay profit={group.groupProfit} className="text-xs" />
      </div>
    </div>
  );
}

/** Card variant for mobile/grid view */
export function GroupOrderCard({ group }: GroupOrderRowProps) {
  const navigate = useNavigate();

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
        <GroupStatusBadge status={group.status} className="shrink-0" />
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
