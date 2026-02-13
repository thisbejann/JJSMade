import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { ItemStatusBadge } from "../components/items/ItemStatusBadge";
import { QcStatusBadge } from "../components/items/QcStatusBadge";
import { CategoryBadge } from "../components/items/CategoryBadge";
import { StatusTimeline } from "../components/items/StatusTimeline";
import { CostBreakdown } from "../components/items/CostBreakdown";
import { QcPhotoGallery } from "../components/items/QcPhotoGallery";
import { formatPHP, formatCNY, formatDate, formatWeight } from "../lib/formatters";
import { ALL_STATUSES, STATUS_CONFIG } from "../lib/constants";
import { Edit, Trash2, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import type { Id } from "../../convex/_generated/dataModel";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = useQuery(api.items.getById, { id: id as Id<"items"> });
  const updateStatus = useMutation(api.items.updateStatus);
  const removeItem = useMutation(api.items.remove);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (item === undefined) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (item === null) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <p className="text-secondary">Item not found</p>
          <Button variant="ghost" onClick={() => navigate("/orders")} className="mt-4">
            Back to Orders
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ id: item._id, status: newStatus as typeof item.status });
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG].label}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removeItem({ id: item._id });
      toast.success("Item deleted");
      navigate("/orders");
    } catch {
      toast.error("Failed to delete item");
    }
    setDeleting(false);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Hero */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <button onClick={() => navigate("/orders")} className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors cursor-pointer">
              <ArrowLeft size={14} /> Back to Orders
            </button>
            <h1 className="font-display font-bold text-2xl text-primary">{item.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={item.category} />
              <ItemStatusBadge status={item.status} />
              <QcStatusBadge qcStatus={item.qcStatus} />
            </div>
            <p className="text-sm text-secondary">
              {item.seller} {item.batch && `· ${item.batch}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/orders/${item._id}/edit`)}>
              <Edit size={14} /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        </div>

        {/* Status Timeline */}
        <Card>
          <CardContent>
            <StatusTimeline currentStatus={item.status} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            {/* QC Photos */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-sm text-primary">QC Photos</h2>
              </CardHeader>
              <CardContent>
                <QcPhotoGallery photoIds={item.qcPhotoIds} />
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-sm text-primary">Cost Breakdown</h2>
              </CardHeader>
              <CardContent>
                <CostBreakdown
                  pricePHP={item.pricePHP}
                  localShippingPHP={item.localShippingPHP}
                  forwarderFee={item.forwarderFee}
                  lalamoveFee={item.lalamoveFee}
                  totalCost={item.totalCost}
                  sellingPrice={item.sellingPrice}
                  profit={item.profit}
                />
              </CardContent>
            </Card>
          </div>

          {/* Info Grid */}
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">Source</h3>
                <InfoRow label="Seller" value={item.seller} />
                <InfoRow label="Contact" value={item.sellerContact} />
                <InfoRow label="Batch" value={item.batch} />
                <InfoRow label="Order Date" value={formatDate(item.orderDate)} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">Pricing</h3>
                <InfoRow label="Price (CNY)" value={formatCNY(item.priceCNY)} mono />
                <InfoRow label="Exchange Rate" value={`₱${item.exchangeRateUsed.toFixed(2)}/¥1`} mono />
                <InfoRow label="Price (PHP)" value={formatPHP(item.pricePHP)} mono />
                {item.localShippingPHP != null && item.localShippingPHP > 0 && (
                  <InfoRow label="Local Shipping" value={formatPHP(item.localShippingPHP)} mono />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">Shipping</h3>
                <InfoRow label="Weight" value={formatWeight(item.weightKg)} mono />
                <InfoRow label="Rate" value={`₱${item.forwarderRatePerKg}/kg`} mono />
                <InfoRow label="Forwarder Fee" value={formatPHP(item.forwarderFee)} mono />
                <InfoRow label="Branded" value={item.isBranded ? "Yes" : "No"} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">Sale</h3>
                <InfoRow label="Selling Price" value={formatPHP(item.sellingPrice)} mono />
                <InfoRow label="Lalamove Fee" value={formatPHP(item.lalamoveFee)} mono />
                <InfoRow label="Customer" value={item.customerName} />
                <InfoRow label="Sold Date" value={formatDate(item.soldDate)} />
                <div className="pt-2 border-t border-border-subtle">
                  <InfoRow label="Total Cost" value={formatPHP(item.totalCost)} mono bold />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary font-semibold">Profit</span>
                    <span className={cn("font-mono text-sm font-bold",
                      (item.profit ?? 0) > 0 ? "text-success" : (item.profit ?? 0) < 0 ? "text-danger" : "text-tertiary"
                    )}>
                      {formatPHP(item.profit)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Status Update */}
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">Quick Actions</h3>
                <Select
                  label="Update Status"
                  value={item.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s].label }))}
                />
              </CardContent>
            </Card>

            {item.notes && (
              <Card>
                <CardContent>
                  <h3 className="text-xs font-medium text-secondary uppercase tracking-wider mb-2">Notes</h3>
                  <p className="text-sm text-primary whitespace-pre-wrap">{item.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Item">
        <p className="text-sm text-secondary mb-4">
          Are you sure you want to delete "{item.name}"? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}

function InfoRow({ label, value, mono, bold }: { label: string; value?: string | null; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={cn("text-sm text-secondary", bold && "font-semibold")}>{label}</span>
      <span className={cn("text-sm text-primary", mono && "font-mono", bold && "font-semibold")}>
        {value ?? "—"}
      </span>
    </div>
  );
}
