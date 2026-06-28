import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PageContainer } from "../components/layout/PageContainer";
import { Skeleton } from "../components/ui/Skeleton";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { ItemStatusBadge } from "../components/items/ItemStatusBadge";
import { formatPHP, formatPercent, formatDate } from "../lib/formatters";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  PlusSignIcon,
  Delete02Icon,
  MinusSignIcon,
  PackageIcon,
  Tag01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { cn } from "../lib/utils";

const GROUP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ordered:                { label: "Ordered",        color: "bg-blue-500/15 text-blue-400" },
  qc_sent:                { label: "QC Sent",         color: "bg-yellow-500/15 text-yellow-400" },
  item_shipout:           { label: "Item Shipout",    color: "bg-blue-500/15 text-blue-400" },
  arrived_ph_warehouse:   { label: "Arrived in PH",   color: "bg-yellow-500/15 text-yellow-400" },
  delivered_to_customer:  { label: "Delivered",       color: "bg-green-500/15 text-green-400" },
  completed:              { label: "Completed",       color: "bg-green-500/15 text-green-400" },
  cancelled:              { label: "Cancelled",       color: "bg-red-500/15 text-red-400" },
};

function GroupStatusBadge({ status }: { status: string }) {
  const cfg = GROUP_STATUS_CONFIG[status] ?? { label: status, color: "bg-surface text-secondary" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.color)}>
      {cfg.label}
    </span>
  );
}

/** Signed profit: "₱1,670.00" / "−₱900.00", colored green ≥0 / red <0. */
function ProfitNumber({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("font-mono tabular-nums", value >= 0 ? "text-success" : "text-danger", className)}>
      {value < 0 ? "−" : ""}
      {formatPHP(Math.abs(value))}
    </span>
  );
}

interface NegotiationGroup {
  _id: Id<"orderGroups">;
  customerName: string;
  status: string;
  notes?: string;
  createdAt: number;
  items: unknown[];
  sumOfQuotes: number;
  negotiatedTotal: number | null;
  effectiveTotal: number;
  discount: number;
  discountPct: number;
  groupProfit: number;
  stale: boolean;
}

/**
 * The "Receipt" header block. Records a negotiated bundle total (the discounted
 * price a customer agreed to for the whole group) and shows the true group
 * profit at that price.
 *
 * - Default (no price set): hero shows the sum of quotes as text + a coral
 *   "Set bundle price" pill. Tap it to reveal a focused editable field.
 * - Set: hero is the editable agreed value; discount + profit lines appear.
 * - Clear: empty the field → reverts to full price (negotiatedTotal = null).
 * - Stale: an amber strip offers "Update total" to re-snapshot the quotes.
 */
function NegotiatedTotalBlock({ group }: { group: NegotiationGroup }) {
  const setNegotiatedTotal = useMutation(api.orderGroups.setNegotiatedTotal);
  const clearNegotiatedTotal = useMutation(api.orderGroups.clearNegotiatedTotal);

  const hasPrice = group.negotiatedTotal != null;
  const [engaged, setEngaged] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [draft, setDraft] = useState(hasPrice ? String(group.negotiatedTotal) : "");
  const [focusToken, setFocusToken] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const showInput = hasPrice || engaged;

  // Keep the field in sync with the server value whenever the user isn't
  // actively typing (e.g. another tab edits it, or after a commit).
  useEffect(() => {
    if (!isFocused) {
      setDraft(group.negotiatedTotal != null ? String(group.negotiatedTotal) : "");
    }
  }, [group.negotiatedTotal, isFocused]);

  // Focus + select the field when entry is triggered (pill / "Update total").
  useEffect(() => {
    if (focusToken > 0) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [focusToken]);

  const engage = () => {
    // Pre-fill with the full price so the user discounts down from it.
    setDraft(String(group.sumOfQuotes));
    setEngaged(true);
    setFocusToken((t) => t + 1);
  };

  const updateTotal = () => {
    // "Update total" opens the field pre-filled with the agreed number.
    setDraft(group.negotiatedTotal != null ? String(group.negotiatedTotal) : "");
    setEngaged(true);
    setFocusToken((t) => t + 1);
  };

  const commit = async () => {
    setIsFocused(false);
    setEngaged(false);
    const raw = draft.trim();

    if (raw === "") {
      if (hasPrice) await clearNegotiatedTotal({ groupId: group._id });
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return; // invalid → ignore, effect resyncs

    // Engaged from default but left at full price → treat as "no deal".
    if (!hasPrice && n === group.sumOfQuotes) return;

    // Persist when the number changed, or when re-confirming a stale price
    // (saving unchanged re-snapshots the quotes and clears the warning).
    if (n !== group.negotiatedTotal || group.stale) {
      await setNegotiatedTotal({ groupId: group._id, total: n });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") inputRef.current?.blur();
    if (e.key === "Escape") {
      // Cancel: restore the canonical value before blurring.
      setDraft(group.negotiatedTotal != null ? String(group.negotiatedTotal) : "");
      setEngaged(false);
      inputRef.current?.blur();
    }
  };

  const itemCount = group.items.length;
  const isLoss = group.groupProfit < 0;

  return (
    <div className="rounded-xl border border-border-default bg-surface overflow-hidden">
      {/* Stale strip — never auto-changes the agreed number, just flags it */}
      {group.stale && (
        <div className="flex items-center justify-between gap-3 bg-warning-muted border-b border-warning/30 px-5 py-2.5">
          <span className="flex items-center gap-2 text-sm text-warning min-w-0">
            <HugeiconsIcon icon={Alert02Icon} size={15} strokeWidth={1.8} className="shrink-0" />
            <span className="truncate">Items changed since you set {formatPHP(group.negotiatedTotal)}.</span>
          </span>
          <button
            onClick={updateTotal}
            className="shrink-0 rounded-full bg-warning/15 hover:bg-warning/25 text-warning text-xs font-medium px-3 py-1 transition-colors cursor-pointer"
          >
            Update total
          </button>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Identity */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-semibold text-primary">{group.customerName}</h1>
            <GroupStatusBadge status={group.status} />
          </div>
          {group.notes && <p className="text-sm text-secondary">{group.notes}</p>}
          <p className="text-xs text-tertiary mt-1">
            {itemCount} item{itemCount !== 1 ? "s" : ""} · Created {formatDate(group.createdAt)}
          </p>
        </div>

        {/* Receipt — full-width section under identity, border-separated */}
        <div className="border-t border-border-default pt-4">
          {/* Hero: "Customer pays" */}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-secondary mb-1">
                Customer pays
                {!showInput && <span className="text-tertiary"> · full price</span>}
              </p>
              {showInput ? (
                <div className="inline-flex items-center gap-0.5 rounded-lg px-1 -mx-1 font-mono text-3xl font-semibold ring-1 ring-transparent focus-within:ring-accent transition-shadow">
                  <span className="text-tertiary">₱</span>
                  <input
                    ref={inputRef}
                    type="number"
                    inputMode="decimal"
                    value={draft}
                    placeholder={String(group.sumOfQuotes)}
                    onChange={(e) => setDraft(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={commit}
                    onKeyDown={handleKeyDown}
                    aria-label="Negotiated bundle total"
                    className="w-44 min-w-0 bg-transparent outline-none tabular-nums text-primary placeholder:text-tertiary
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              ) : (
                <p className="font-mono text-3xl font-semibold text-primary tabular-nums">
                  {formatPHP(group.sumOfQuotes)}
                </p>
              )}
            </div>

            {!showInput && (
              <button
                onClick={engage}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-accent-muted text-accent text-sm font-medium px-3.5 py-1.5 hover:bg-accent/20 transition-colors cursor-pointer"
              >
                <HugeiconsIcon icon={Tag01Icon} size={14} strokeWidth={1.8} />
                Set bundle price
              </button>
            )}
          </div>

          {/* Receipt breakdown */}
          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex items-center justify-between text-secondary">
              <span>List total (sum of quotes)</span>
              <span className="font-mono tabular-nums">{formatPHP(group.sumOfQuotes)}</span>
            </div>
            {hasPrice && group.discount > 0 && (
              <div className="flex items-center justify-between text-secondary">
                <span>Bundle discount ({formatPercent(group.discountPct)})</span>
                <span className="font-mono tabular-nums">−{formatPHP(group.discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-border-subtle">
              <span className="text-secondary">
                Your profit{!hasPrice ? " (at full price)" : ""}
              </span>
              <ProfitNumber value={group.groupProfit} className="text-base font-semibold" />
            </div>
            {isLoss && (
              <p className="text-right text-xs text-danger">
                Below cost — this bundle loses money.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GroupOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const groupId = id as Id<"orderGroups">;

  const group = useQuery(api.orderGroups.getById, { id: groupId });
  const removeItem = useMutation(api.orderGroups.removeItem);
  const deleteGroup = useMutation(api.orderGroups.deleteGroup);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  if (group === undefined) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </PageContainer>
    );
  }

  if (group === null) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <p className="text-secondary text-sm">Group order not found.</p>
          <Button variant="ghost" onClick={() => navigate("/orders")} className="mt-4">Back to Orders</Button>
        </div>
      </PageContainer>
    );
  }

  const handleRemoveItem = async (itemId: Id<"items">) => {
    setRemovingItemId(itemId);
    try {
      await removeItem({ itemId });
      toast.success("Item removed from group");
    } catch {
      toast.error("Failed to remove item");
    }
    setRemovingItemId(null);
  };

  const handleDelete = async (mode: "dissolve" | "delete-all") => {
    setDeleting(true);
    try {
      await deleteGroup({ groupId, mode });
      toast.success(mode === "dissolve" ? "Group dissolved — items are now solo" : "Group and all items deleted");
      navigate("/orders");
    } catch {
      toast.error("Failed to delete group");
      setDeleting(false);
    }
  };

  const addItemUrl = `/orders/new?groupId=${groupId}&customerId=${group.customerId}`;

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={1.5} /> Back to Orders
        </button>

        {/* Header card — negotiated bundle total */}
        <NegotiatedTotalBlock group={group} />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate(addItemUrl)}>
            <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.5} />
            Add Item
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteModalOpen(true)}>
            <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.5} />
            Delete Group
          </Button>
        </div>

        {/* Items list */}
        {group.items.length === 0 ? (
          <div className="rounded-lg border border-border-default bg-subtle p-10 text-center">
            <HugeiconsIcon icon={PackageIcon} size={28} strokeWidth={1.5} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-secondary text-sm">No items in this group yet.</p>
            <Button size="sm" className="mt-4" onClick={() => navigate(addItemUrl)}>
              Add First Item
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border-default overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default bg-subtle">
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wide">Item</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wide">Selling Price</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-secondary uppercase tracking-wide">Profit</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {group.items.map((item, i) => (
                  <tr
                    key={item._id}
                    className={cn("transition-colors hover:bg-hover", i !== 0 && "border-t border-border-default")}
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${item._id}`}
                        className="font-medium text-primary hover:text-accent transition-colors line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      {item.batch && <p className="text-xs text-tertiary">{item.batch}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <ItemStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-secondary">
                      {formatPHP(item.sellingPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {item.profit != null ? (
                        <span className={item.profit >= 0 ? "text-green-400" : "text-red-400"}>
                          {formatPHP(item.profit)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        disabled={removingItemId === item._id}
                        aria-label={`Remove ${item.name} from group`}
                        className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <HugeiconsIcon icon={MinusSignIcon} size={14} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Group modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Group Order">
        <p className="text-sm text-secondary mb-5">
          Choose how to delete this group. This cannot be undone.
        </p>
        <div className="space-y-3 mb-5">
          <button
            onClick={() => handleDelete("dissolve")}
            disabled={deleting}
            className="w-full text-left rounded-lg border border-border-default bg-subtle hover:bg-hover p-4 transition-colors cursor-pointer disabled:opacity-50"
          >
            <p className="font-medium text-primary text-sm">Dissolve</p>
            <p className="text-xs text-secondary mt-0.5">Delete the group. Items remain as Solo Items.</p>
          </button>
          <button
            onClick={() => handleDelete("delete-all")}
            disabled={deleting}
            className="w-full text-left rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 p-4 transition-colors cursor-pointer disabled:opacity-50"
          >
            <p className="font-medium text-red-400 text-sm">Delete All</p>
            <p className="text-xs text-secondary mt-0.5">Delete the group and permanently delete all {group.items.length} item{group.items.length !== 1 ? "s" : ""}.</p>
          </button>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>Cancel</Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
