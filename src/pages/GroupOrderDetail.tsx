import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PageContainer } from "../components/layout/PageContainer";
import { Skeleton } from "../components/ui/Skeleton";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { ItemStatusBadge } from "../components/items/ItemStatusBadge";
import { formatPHP, formatDate } from "../lib/formatters";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  PlusSignIcon,
  Delete02Icon,
  MinusSignIcon,
  PackageIcon,
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

        {/* Header card */}
        <div className="rounded-xl border border-border-default bg-subtle p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-semibold text-primary">{group.customerName}</h1>
                <GroupStatusBadge status={group.status} />
              </div>
              {group.notes && (
                <p className="text-sm text-secondary">{group.notes}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {group.items.length} item{group.items.length !== 1 ? "s" : ""} · Created {formatDate(group.createdAt)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-secondary mb-0.5">Combined Selling Price</p>
              <p className="text-base font-semibold text-primary">{formatPHP(group.totalSellingPrice)}</p>
              <p className="text-xs text-secondary mt-2 mb-0.5">Combined Profit</p>
              <p className={cn("text-base font-semibold", group.totalProfit >= 0 ? "text-green-400" : "text-red-400")}>
                {formatPHP(group.totalProfit)}
              </p>
            </div>
          </div>
        </div>

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
