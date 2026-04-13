import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";
import { ItemStatusBadge } from "../components/items/ItemStatusBadge";
import { QcStatusBadge } from "../components/items/QcStatusBadge";
import { CategoryBadge } from "../components/items/CategoryBadge";
import { StatusStepper } from "../components/items/StatusStepper";
import { CostBreakdown } from "../components/items/CostBreakdown";
import { QcPhotoGallery } from "../components/items/QcPhotoGallery";
import { formatPHP, formatCNY, formatDate, formatWeight } from "../lib/formatters";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit01Icon, Delete02Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = useQuery(api.items.getById, { id: id as Id<"items"> });
  const updateItem = useMutation(api.items.update);
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
          <Button
            variant="ghost"
            onClick={() => navigate("/orders")}
            className="mt-4"
          >
            Back to Orders
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleRemoveDetailQcPhoto = async (photoId: Id<"_storage">) => {
    const currentPhotoIds = item.qcPhotoIds ?? [];
    if (!currentPhotoIds.includes(photoId)) return;
    const nextPhotoIds = currentPhotoIds.filter((id) => id !== photoId);

    try {
      await updateItem({
        id: item._id,
        qcPhotoIds: nextPhotoIds,
      });
      toast.success("QC photo deleted");
    } catch {
      toast.error("Failed to delete QC photo");
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
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <button
              onClick={() => navigate("/orders")}
              className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={1.5} /> Back to Orders
            </button>
            <h2 className="font-display font-bold text-2xl text-primary">{item.name}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <CategoryBadge category={item.category} />
              <ItemStatusBadge status={item.status} />
              <QcStatusBadge qcStatus={item.qcStatus} />
            </div>
            <p className="text-sm text-secondary">
              {item.seller} {item.batch && `- ${item.batch}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/orders/${item._id}/edit`)}
            >
              <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={1.5} /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.5} /> Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardContent>
            <StatusStepper item={item} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>QC Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <QcPhotoGallery
                  photoIds={item.qcPhotoIds}
                  onRemovePhoto={handleRemoveDetailQcPhoto}
                  itemName={item.name}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <CostBreakdown
                  pricePHP={item.pricePHP}
                  localShippingPHP={item.localShippingPHP}
                  forwarderFee={item.forwarderFee}
                  forwarderBuyFeePHP={item.forwarderBuyFeePHP}
                  qcServiceFeePHP={item.qcServiceFeePHP}
                  lalamoveFee={item.lalamoveFee}
                  totalCost={item.totalCost}
                  sellingPrice={item.sellingPrice}
                  profit={item.profit}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">
                  Source
                </h3>
                <InfoRow label="Seller" value={item.seller} />
                <InfoRow label="Contact" value={item.sellerContact} />
                <InfoRow label="Batch" value={item.batch} />
                <InfoRow label="Size" value={item.size} />
                <InfoRow label="Order Date" value={formatDate(item.orderDate)} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">
                  Pricing
                </h3>
                <InfoRow label="Price (CNY)" value={formatCNY(item.priceCNY)} mono />
                {!item.isForwarderBuy && (
                  <InfoRow
                    label="Exchange Rate"
                    value={`PHP${item.exchangeRateUsed.toFixed(2)}/CNY1`}
                    mono
                  />
                )}
                <InfoRow label="Price (PHP)" value={formatPHP(item.pricePHP)} mono />
                {item.localShippingPHP != null && item.localShippingPHP > 0 && (
                  <InfoRow
                    label="Local Shipping"
                    value={formatPHP(item.localShippingPHP)}
                    mono
                  />
                )}
                {item.isForwarderBuy && (
                  <>
                    <InfoRow label="Forwarder Buy" value="Yes" />
                    <InfoRow
                      label="Service Rate"
                      value={`PHP${item.forwarderBuyRateUsed?.toFixed(2)}/CNY1`}
                      mono
                    />
                    <InfoRow
                      label="Commission"
                      value={`${(item.forwarderBuyCommissionPercent ?? 10).toFixed(2)}%`}
                      mono
                    />
                    <InfoRow
                      label="Forwarder Buy Fee"
                      value={formatPHP(item.forwarderBuyFeePHP)}
                      mono
                    />
                    <InfoRow
                      label="QC Service Fee"
                      value={formatPHP(item.qcServiceFeePHP)}
                      mono
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">
                  Shipping
                </h3>
                <InfoRow label="Weight" value={formatWeight(item.weightKg)} mono />
                <InfoRow label="Tracking No." value={item.trackingNumber} />
                <InfoRow
                  label="Rate"
                  value={`PHP${item.forwarderRatePerKg}/kg`}
                  mono
                />
                <InfoRow
                  label="Forwarder Fee"
                  value={formatPHP(item.forwarderFee)}
                  mono
                />
                <InfoRow label="Branded" value={item.isBranded ? "Yes" : "No"} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">
                  Sale
                </h3>
                <InfoRow
                  label="Selling Price"
                  value={formatPHP(item.sellingPrice)}
                  mono
                />
                <InfoRow label="Lalamove Fee" value={formatPHP(item.lalamoveFee)} mono />
                <InfoRow label="Customer" value={item.customerName} />
                <InfoRow label="Sold Date" value={formatDate(item.soldDate)} />
                <div className="pt-2 border-t border-border-subtle">
                  <InfoRow label="Total Cost" value={formatPHP(item.totalCost)} mono bold />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary font-semibold">Profit</span>
                    <span
                      className={cn(
                        "font-mono text-sm font-bold",
                        (item.profit ?? 0) > 0
                          ? "text-success"
                          : (item.profit ?? 0) < 0
                            ? "text-danger"
                            : "text-tertiary"
                      )}
                    >
                      {formatPHP(item.profit)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {item.notes && (
              <Card>
                <CardContent className="min-w-0">
                  <h3 className="text-xs font-medium text-secondary uppercase tracking-wider mb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-primary whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                    {item.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Item">
        <p className="text-sm text-secondary mb-4">
          Are you sure you want to delete "{item.name}"? This action cannot be
          undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}

function InfoRow({
  label,
  value,
  mono,
  bold,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-3 min-w-0">
      <span className={cn("text-sm text-secondary", bold && "font-semibold")}>
        {label}
      </span>
      <span
        className={cn(
          "text-sm text-primary text-right min-w-0 max-w-[60%] break-words [overflow-wrap:anywhere]",
          mono && "font-mono",
          bold && "font-semibold"
        )}
      >
        {value ?? "--"}
      </span>
    </div>
  );
}
