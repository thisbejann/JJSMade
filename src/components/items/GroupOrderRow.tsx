import { useNavigate, Link } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
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
  /**
   * The members that cleared an active filter. Absent — or equal to the full
   * membership — means a **full match**: opaque row, full bundle money. A strict
   * subset means a **partial match**: the group reveals only these members,
   * read-only, and money is hidden (a subset of a negotiated bundle total has no
   * honest per-item price). See docs/adr/0003-partial-group-match.
   */
  visibleItems?: Doc<"items">[];
}

/** "N of M match" marker shown in place of money during a partial reveal. */
function MatchMarker({ shown, total }: { shown: number; total: number }) {
  return (
    <span className="shrink-0 rounded-full bg-elevated border border-border-subtle px-2 py-0.5 text-xs font-medium text-secondary tabular-nums">
      {shown} of {total} match
    </span>
  );
}

/** Customer initials for the bundle avatar — max two letters, e.g. "Anna Cruz" → "AC". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
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
 * Group "object row" for the unified **All** feed. Deliberately shares the solo
 * object row's anatomy so the two read as one feed: same `items-center`/`py-3`
 * rhythm, same two-line body, same right-hand money rail (total + profit, no
 * label) so the numbers align vertically across group and item rows. What marks
 * it as a bundle is the leading avatar (solo rows have none) plus the item-count
 * and member-name line, not a louder color.
 */
export function GroupObjectRow({ group, visibleItems }: GroupOrderRowProps) {
  const navigate = useNavigate();
  const shownItems = visibleItems ?? group.items;
  const partial = shownItems.length < group.items.length;
  const names = group.items.map((i) => i.name);
  const shown = names.slice(0, 2).join(", ");
  const overflow = names.length - Math.min(2, names.length);

  // Partial reveal — only the matching members, read-only, money hidden.
  if (partial) {
    return (
      <div className="bg-subtle/40">
        <div
          onClick={() => navigate(`/groups/${group._id}`)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(`/groups/${group._id}`); } }}
          tabIndex={0}
          role="link"
          className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-elevated text-[11px] font-semibold text-secondary">
            {initials(group.customerName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="min-w-0 truncate text-sm font-medium text-primary">{group.customerName}</span>
              {group.stale && <ReviewBadge />}
            </div>
            <div className="mt-1 flex items-center gap-2 min-w-0 text-xs">
              <GroupStatusBadge status={group.status} className="shrink-0" />
              <span className="text-tertiary">bundle</span>
            </div>
          </div>
          {/* Marker stands in for the money rail — a subset has no honest price. */}
          <MatchMarker shown={shownItems.length} total={group.items.length} />
        </div>
        {shownItems.map((item) => (
          <Link
            key={item._id}
            to={`/orders/${item._id}`}
            className="flex items-center gap-2 py-2 pl-14 pr-4 hover:bg-hover transition-colors"
          >
            <span className="min-w-0 truncate text-sm text-secondary">{item.name}</span>
            <ItemStatusBadge status={item.status} />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/groups/${group._id}`)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(`/groups/${group._id}`); } }}
      tabIndex={0}
      role="link"
      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
    >
      {/* Neutral initials avatar. Its mere presence (solo rows lead with a
          checkbox, not an avatar) marks the row as a customer bundle, so it
          needn't spend the warm accent — coral stays reserved for actions. */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-elevated text-[11px] font-semibold text-secondary">
        {initials(group.customerName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="min-w-0 truncate text-sm font-medium text-primary">{group.customerName}</span>
          <span className="shrink-0 text-xs text-tertiary tabular-nums">
            {group.items.length} item{group.items.length !== 1 ? "s" : ""}
          </span>
          {group.stale && <ReviewBadge />}
          {group.negotiatedTotal != null && (
            <DiscountChip discount={group.discount} discountPct={group.discountPct} />
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 min-w-0 text-xs">
          <GroupStatusBadge status={group.status} className="shrink-0" />
          <span className="min-w-0 truncate text-tertiary">
            {shown}{overflow > 0 ? `, +${overflow} more` : ""}
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm text-primary">{formatPHP(group.effectiveTotal)}</p>
        <ProfitDisplay profit={group.groupProfit} className="text-xs" />
      </div>
    </div>
  );
}

/**
 * Group-native table row for the **Bundles** segment. Every column maps to a
 * real group field — no borrowed solo-item columns (seller/QC/weight), so the
 * headers never lie. Money columns are right-aligned to match their headers.
 */
export function GroupTableRow({ group, visibleItems }: GroupOrderRowProps) {
  const navigate = useNavigate();
  const shownItems = visibleItems ?? group.items;
  const partial = shownItems.length < group.items.length;
  const names = group.items.map((i) => i.name);
  const shown = names.slice(0, 3).join(", ");
  const overflow = names.length - Math.min(3, names.length);

  // Partial reveal — band carries the marker where money would sit (Discount,
  // Customer Pays, Profit all blank), matching members follow as read-only rows.
  if (partial) {
    return (
      <>
        <tr
          onClick={() => navigate(`/groups/${group._id}`)}
          className="border-b border-border-subtle bg-subtle/40 hover:bg-hover cursor-pointer transition-colors"
        >
          <td className="py-3 px-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-elevated text-[11px] font-semibold text-secondary">
                {initials(group.customerName)}
              </div>
              <span className="min-w-0 truncate text-sm font-medium text-primary">{group.customerName}</span>
              {group.stale && <ReviewBadge />}
            </div>
          </td>
          <td className="py-3 px-4">
            <p className="text-sm text-primary">{group.items.length} item{group.items.length !== 1 ? "s" : ""}</p>
          </td>
          <td className="py-3 px-4">
            <GroupStatusBadge status={group.status} />
          </td>
          <td className="py-3 px-4" />
          <td className="py-3 px-4 text-right">
            <div className="flex justify-end">
              <MatchMarker shown={shownItems.length} total={group.items.length} />
            </div>
          </td>
          <td className="py-3 px-4" />
        </tr>
        {shownItems.map((item) => (
          <tr
            key={item._id}
            onClick={() => navigate(`/orders/${item._id}`)}
            className="border-b border-border-subtle bg-subtle/20 hover:bg-hover cursor-pointer transition-colors"
          >
            <td className="py-2 pl-12 pr-4" colSpan={2}>
              <span className="text-sm text-secondary">{item.name}</span>
            </td>
            <td className="py-2 px-4">
              <ItemStatusBadge status={item.status} />
            </td>
            <td colSpan={3} />
          </tr>
        ))}
      </>
    );
  }

  return (
    <tr
      onClick={() => navigate(`/groups/${group._id}`)}
      className="border-b border-border-subtle hover:bg-hover cursor-pointer transition-colors"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-elevated text-[11px] font-semibold text-secondary">
            {initials(group.customerName)}
          </div>
          <span className="min-w-0 truncate text-sm font-medium text-primary">{group.customerName}</span>
          {group.stale && <ReviewBadge />}
        </div>
      </td>
      <td className="py-3 px-4">
        <p className="text-sm text-primary">{group.items.length} item{group.items.length !== 1 ? "s" : ""}</p>
        <p className="max-w-65 truncate text-xs text-tertiary">
          {shown}{overflow > 0 ? `, +${overflow}` : ""}
        </p>
      </td>
      <td className="py-3 px-4">
        <GroupStatusBadge status={group.status} />
      </td>
      <td className="py-3 px-4">
        <div className="flex justify-end">
          {group.negotiatedTotal != null ? (
            <DiscountChip discount={group.discount} discountPct={group.discountPct} />
          ) : (
            <span className="text-sm text-tertiary">—</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4 text-right font-mono text-sm text-primary">
        {formatPHP(group.effectiveTotal)}
      </td>
      <td className="py-3 px-4 text-right">
        <ProfitDisplay profit={group.groupProfit} />
      </td>
    </tr>
  );
}

/** Compact single-line entry for the mobile list view (table mode on small screens). */
export function GroupListRow({ group, visibleItems }: GroupOrderRowProps) {
  const navigate = useNavigate();
  const shownItems = visibleItems ?? group.items;
  const partial = shownItems.length < group.items.length;

  // Partial reveal — band plus matching members, money hidden.
  if (partial) {
    return (
      <div className="bg-subtle/40">
        <div
          onClick={() => navigate(`/groups/${group._id}`)}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-hover"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon icon={UserGroupIcon} size={13} strokeWidth={1.5} className="text-secondary shrink-0" />
              <p className="min-w-0 truncate text-sm font-medium text-primary">{group.customerName}</p>
              {group.stale && <ReviewBadge />}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <GroupStatusBadge status={group.status} />
            </div>
          </div>
          <MatchMarker shown={shownItems.length} total={group.items.length} />
        </div>
        {shownItems.map((item) => (
          <Link
            key={item._id}
            to={`/orders/${item._id}`}
            className="flex items-center gap-2 py-2 pl-9 pr-4 transition-colors active:bg-hover"
          >
            <span className="min-w-0 truncate text-sm text-secondary">{item.name}</span>
            <ItemStatusBadge status={item.status} />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/groups/${group._id}`)}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-hover"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon icon={UserGroupIcon} size={13} strokeWidth={1.5} className="text-secondary shrink-0" />
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
export function GroupOrderCard({ group, visibleItems }: GroupOrderRowProps) {
  const navigate = useNavigate();
  const shownItems = visibleItems ?? group.items;
  const partial = shownItems.length < group.items.length;

  // Partial reveal — matching members listed in place of the money footer.
  if (partial) {
    return (
      <div
        onClick={() => navigate(`/groups/${group._id}`)}
        className="rounded-xl border border-border-subtle bg-surface p-4 space-y-3 cursor-pointer transition-colors hover:border-primary/30"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.5} className="text-secondary shrink-0" />
            <h3 className="text-sm font-semibold text-primary truncate">{group.customerName}</h3>
            {group.stale && <ReviewBadge />}
          </div>
          <GroupStatusBadge status={group.status} className="shrink-0" />
        </div>
        <div>
          <MatchMarker shown={shownItems.length} total={group.items.length} />
        </div>
        <div className="space-y-1.5 border-t border-border-subtle pt-2">
          {shownItems.map((item) => (
            <Link
              key={item._id}
              to={`/orders/${item._id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <span className="min-w-0 truncate text-xs text-secondary">{item.name}</span>
              <ItemStatusBadge status={item.status} />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/groups/${group._id}`)}
      className="rounded-xl border border-border-subtle bg-surface p-4 space-y-3 cursor-pointer transition-colors hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.5} className="text-secondary shrink-0" />
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
