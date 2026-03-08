import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Toggle } from "../components/ui/Toggle";
import { ImageUpload } from "../components/ui/ImageUpload";
import { Skeleton } from "../components/ui/Skeleton";
import { ItemStatusBadge } from "../components/items/ItemStatusBadge";
import { QcStatusBadge } from "../components/items/QcStatusBadge";
import { CategoryBadge } from "../components/items/CategoryBadge";
import { StatusTimeline } from "../components/items/StatusTimeline";
import { CostBreakdown } from "../components/items/CostBreakdown";
import { QcPhotoGallery } from "../components/items/QcPhotoGallery";
import { formatPHP, formatCNY, formatDate, formatWeight } from "../lib/formatters";
import { ALL_STATUSES, ALL_QC_STATUSES, QC_STATUS_CONFIG, STATUS_CONFIG } from "../lib/constants";
import { Edit, Trash2, ArrowLeft, CircleCheckBig } from "lucide-react";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import type { Doc, Id } from "../../convex/_generated/dataModel";

type ProgressiveStatus = "qc_sent" | "item_shipout" | "arrived_ph_warehouse" | "delivered_to_customer";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = useQuery(api.items.getById, { id: id as Id<"items"> });
  const updateItem = useMutation(api.items.update);
  const updateStatus = useMutation(api.items.updateStatus);
  const removeItem = useMutation(api.items.remove);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [progressStatus, setProgressStatus] = useState<ProgressiveStatus | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);

  const [qcStatusDraft, setQcStatusDraft] = useState<Doc<"items">["qcStatus"]>("pending_review");
  const [qcPhotoIdsDraft, setQcPhotoIdsDraft] = useState<Id<"_storage">[]>([]);
  const [newQcUploads, setNewQcUploads] = useState<{ id: Id<"_storage">; url: string }[]>([]);
  const [uploadingQc, setUploadingQc] = useState(false);

  const [weightDraft, setWeightDraft] = useState(0);
  const [trackingNumberDraft, setTrackingNumberDraft] = useState("");
  const [forwarderRateDraft, setForwarderRateDraft] = useState(0);
  const [isBrandedDraft, setIsBrandedDraft] = useState(true);

  const [lalamoveDraft, setLalamoveDraft] = useState(0);

  const clearNewQcUploads = () => {
    setNewQcUploads((current) => {
      current.forEach((photo) => URL.revokeObjectURL(photo.url));
      return [];
    });
  };

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

  const closeProgressModal = () => {
    if (progressStatus === "qc_sent") {
      clearNewQcUploads();
    }
    setProgressStatus(null);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ id: item._id, status: newStatus as typeof item.status });
      toast.success(
        `Status updated to ${
          STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG].label
        }`
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleUploadQc = async (files: File[]) => {
    setUploadingQc(true);
    try {
      for (const file of files) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
        setNewQcUploads((current) => [
          ...current,
          { id: storageId, url: URL.createObjectURL(file) },
        ]);
        setQcPhotoIdsDraft((current) =>
          current.includes(storageId) ? current : [...current, storageId]
        );
      }
    } catch {
      toast.error("Failed to upload QC photos");
    }
    setUploadingQc(false);
  };

  const handleRemoveQcPhoto = (idToRemove: Id<"_storage">) => {
    setQcPhotoIdsDraft((current) => current.filter((photoId) => photoId !== idToRemove));
    setNewQcUploads((current) => {
      const photoToRemove = current.find((photo) => photo.id === idToRemove);
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.url);
      }
      return current.filter((photo) => photo.id !== idToRemove);
    });
  };

  const openProgressModal = (targetStatus: ProgressiveStatus) => {
    if (targetStatus === "qc_sent") {
      setQcStatusDraft(item.qcStatus === "not_received" ? "pending_review" : item.qcStatus);
      setQcPhotoIdsDraft(item.qcPhotoIds ?? []);
      clearNewQcUploads();
    }

    if (targetStatus === "item_shipout") {
      setTrackingNumberDraft(item.trackingNumber ?? "");
    }

    if (targetStatus === "arrived_ph_warehouse") {
      setWeightDraft(item.weightKg ?? 0);
      setForwarderRateDraft(item.forwarderRatePerKg ?? 0);
      setIsBrandedDraft(item.isBranded);
      setLalamoveDraft(item.lalamoveFee ?? 0);
    }

    setProgressStatus(targetStatus);
  };

  const handleStatusSelection = (newStatus: string) => {
    if (newStatus === item.status) return;

    if (
      newStatus === "qc_sent" ||
      newStatus === "item_shipout" ||
      newStatus === "arrived_ph_warehouse" ||
      newStatus === "delivered_to_customer"
    ) {
      openProgressModal(newStatus);
      return;
    }

    void handleStatusChange(newStatus);
  };

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

  const handleSaveQcSent = async () => {
    const mergedPhotoIds = Array.from(new Set(qcPhotoIdsDraft));

    if (mergedPhotoIds.length === 0) {
      toast.error("Upload at least one QC photo before setting QC Sent");
      return;
    }

    setSavingProgress(true);
    try {
      await updateItem({
        id: item._id,
        status: "qc_sent",
        qcStatus: qcStatusDraft,
        qcPhotoIds: mergedPhotoIds,
      });
      toast.success("Status updated to QC Sent");
      closeProgressModal();
    } catch {
      toast.error("Failed to update status");
    }
    setSavingProgress(false);
  };

  const handleSaveItemShipout = async () => {
    if (!trackingNumberDraft.trim()) {
      toast.error("Tracking number is required before setting Item Shipout");
      return;
    }

    setSavingProgress(true);
    try {
      await updateItem({
        id: item._id,
        status: "item_shipout",
        trackingNumber: trackingNumberDraft.trim(),
      });
      toast.success("Status updated to Item Shipout");
      closeProgressModal();
    } catch {
      toast.error("Failed to update status");
    }
    setSavingProgress(false);
  };

  const handleSaveArrivedPh = async () => {
    if (weightDraft <= 0) {
      toast.error("Weight is required before setting Arrived in PH");
      return;
    }
    if (forwarderRateDraft <= 0) {
      toast.error("Forwarder rate is required before setting Arrived in PH");
      return;
    }

    setSavingProgress(true);
    try {
      await updateItem({
        id: item._id,
        status: "arrived_ph_warehouse",
        weightKg: weightDraft,
        forwarderRatePerKg: forwarderRateDraft,
        isBranded: isBrandedDraft,
        lalamoveFee: lalamoveDraft > 0 ? lalamoveDraft : undefined,
      });
      toast.success("Status updated to Arrived in PH");
      closeProgressModal();
    } catch {
      toast.error("Failed to update status");
    }
    setSavingProgress(false);
  };

  const handleSaveDelivered = async () => {
    setSavingProgress(true);
    try {
      await updateStatus({
        id: item._id,
        status: "delivered_to_customer",
      });
      toast.success("Status updated to Delivered");
      closeProgressModal();
    } catch {
      toast.error("Failed to update status");
    }
    setSavingProgress(false);
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
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <button
              onClick={() => navigate("/orders")}
              className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Orders
            </button>
            <h1 className="font-display font-bold text-2xl text-primary">{item.name}</h1>
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
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/orders/${item._id}/edit`)}
            >
              <Edit size={14} /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">
                  Quick Actions
                </h3>
                <p className="text-sm text-secondary">
                  Status updates are now pinned near the top with step-specific popups.
                </p>
              </div>
              <div className="w-full sm:w-72">
                <Select
                  label="Update Status"
                  value={item.status}
                  onChange={(e) => handleStatusSelection(e.target.value)}
                  options={ALL_STATUSES.map((status) => ({
                    value: status,
                    label: STATUS_CONFIG[status].label,
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <StatusTimeline currentStatus={item.status} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-sm text-primary">
                  QC Photos
                </h2>
              </CardHeader>
              <CardContent>
                <QcPhotoGallery
                  photoIds={item.qcPhotoIds}
                  onRemovePhoto={handleRemoveDetailQcPhoto}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-sm text-primary">
                  Cost Breakdown
                </h2>
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

          <div className="space-y-4">
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
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={progressStatus === "qc_sent"}
        onClose={closeProgressModal}
        title="QC Sent: Upload Photos"
      >
        <div className="space-y-4">
          {qcPhotoIdsDraft.length > 0 && (
            <div className="rounded-lg border border-border-subtle p-3">
              <p className="text-xs text-secondary mb-2">
                QC photo gallery (click X to remove)
              </p>
              <QcPhotoGallery
                photoIds={qcPhotoIdsDraft}
                onRemovePhoto={handleRemoveQcPhoto}
              />
            </div>
          )}

          <ImageUpload
            images={newQcUploads.map((photo) => ({ id: photo.id, url: photo.url }))}
            onUpload={handleUploadQc}
            onRemove={(id) => handleRemoveQcPhoto(id as Id<"_storage">)}
            uploading={uploadingQc}
          />

          <Select
            label="QC Status"
            value={qcStatusDraft}
            onChange={(e) => setQcStatusDraft(e.target.value as Doc<"items">["qcStatus"])}
            options={ALL_QC_STATUSES.map((status) => ({
              value: status,
              label: QC_STATUS_CONFIG[status].label,
            }))}
          />

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeProgressModal} disabled={savingProgress}>
              Cancel
            </Button>
            <Button onClick={handleSaveQcSent} disabled={savingProgress || uploadingQc}>
              {savingProgress ? "Saving..." : "Save and Continue"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={progressStatus === "item_shipout"}
        onClose={closeProgressModal}
        title="Item Shipout: Shipping Details"
      >
        <div className="space-y-4">
          <Input
            label="Tracking Number"
            value={trackingNumberDraft}
            onChange={(e) => setTrackingNumberDraft(e.target.value)}
            placeholder="Enter tracking number"
          />

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeProgressModal} disabled={savingProgress}>
              Cancel
            </Button>
            <Button onClick={handleSaveItemShipout} disabled={savingProgress}>
              {savingProgress ? "Saving..." : "Save and Continue"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={progressStatus === "arrived_ph_warehouse"}
        onClose={closeProgressModal}
        title="Arrived in PH: Delivery Fee"
      >
        <div className="space-y-4">
          <Input
            label="Weight (kg)"
            type="number"
            value={weightDraft || ""}
            onChange={(e) => setWeightDraft(Number(e.target.value))}
            step="0.01"
          />
          <Input
            label="Forwarder Rate (PHP/kg)"
            type="number"
            value={forwarderRateDraft || ""}
            onChange={(e) => setForwarderRateDraft(Number(e.target.value))}
            prefix="PHP"
          />
          <Toggle
            label="Branded / Sensitive Item?"
            checked={isBrandedDraft}
            onChange={setIsBrandedDraft}
          />
          <Input
            label="Lalamove Fee (PHP)"
            type="number"
            value={lalamoveDraft || ""}
            onChange={(e) => setLalamoveDraft(Number(e.target.value))}
            prefix="PHP"
          />

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeProgressModal} disabled={savingProgress}>
              Cancel
            </Button>
            <Button onClick={handleSaveArrivedPh} disabled={savingProgress}>
              {savingProgress ? "Saving..." : "Save and Continue"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={progressStatus === "delivered_to_customer"}
        onClose={closeProgressModal}
        title="Order Completed"
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-border-subtle bg-surface p-4 text-center">
            <CircleCheckBig size={28} className="mx-auto mb-2 text-success" />
            <p className="text-sm font-medium text-primary">Nice work. This order is ready to close.</p>
            <p className="text-xs text-secondary mt-1">
              Confirm to mark this item as delivered.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeProgressModal} disabled={savingProgress}>
              Cancel
            </Button>
            <Button onClick={handleSaveDelivered} disabled={savingProgress}>
              {savingProgress ? "Saving..." : "Mark as Delivered"}
            </Button>
          </div>
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
