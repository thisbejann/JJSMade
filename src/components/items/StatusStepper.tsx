import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";
import { ImageUpload } from "../ui/ImageUpload";
import { QcPhotoGallery } from "./QcPhotoGallery";
import {
  STATUS_FLOW,
  STATUS_CONFIG,
  ALL_QC_STATUSES,
  QC_STATUS_CONFIG,
  type ItemStatus,
} from "../../lib/constants";
import { cn } from "../../lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

interface StatusStepperProps {
  item: Doc<"items">;
}

const colorMap: Record<string, { text: string; dot: string; ring: string }> = {
  info: { text: "text-info", dot: "bg-info", ring: "ring-info/30" },
  warning: { text: "text-warning", dot: "bg-warning", ring: "ring-warning/30" },
  accent: { text: "text-accent", dot: "bg-accent", ring: "ring-accent/30" },
  success: { text: "text-success", dot: "bg-success", ring: "ring-success/30" },
  danger: { text: "text-danger", dot: "bg-danger", ring: "ring-danger/30" },
};

export function StatusStepper({ item }: StatusStepperProps) {
  const updateItem = useMutation(api.items.update);
  const updateStatus = useMutation(api.items.updateStatus);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [expandedStep, setExpandedStep] = useState<ItemStatus | null>(null);
  const [saving, setSaving] = useState(false);

  // QC Sent drafts
  const [qcStatusDraft, setQcStatusDraft] = useState<Doc<"items">["qcStatus"]>("pending_review");
  const [qcPhotoIdsDraft, setQcPhotoIdsDraft] = useState<Id<"_storage">[]>([]);
  const [newQcUploads, setNewQcUploads] = useState<{ id: Id<"_storage">; url: string }[]>([]);
  const [uploadingQc, setUploadingQc] = useState(false);

  // Item Shipout drafts
  const [trackingNumberDraft, setTrackingNumberDraft] = useState("");

  // Arrived PH drafts
  const [weightDraft, setWeightDraft] = useState(0);
  const [forwarderRateDraft, setForwarderRateDraft] = useState(0);
  const [isBrandedDraft, setIsBrandedDraft] = useState(true);
  const [lalamoveDraft, setLalamoveDraft] = useState(0);

  const currentIndex = STATUS_FLOW.indexOf(item.status as ItemStatus);
  const isTerminal = item.status === "refunded";

  const clearNewQcUploads = () => {
    setNewQcUploads((current) => {
      current.forEach((photo) => URL.revokeObjectURL(photo.url));
      return [];
    });
  };

  const handleExpand = (status: ItemStatus) => {
    if (expandedStep === status) {
      if (expandedStep === "qc_sent") clearNewQcUploads();
      setExpandedStep(null);
      return;
    }

    // Initialize drafts when expanding
    if (status === "qc_sent") {
      setQcStatusDraft(item.qcStatus === "not_received" ? "pending_review" : item.qcStatus);
      setQcPhotoIdsDraft(item.qcPhotoIds ?? []);
      clearNewQcUploads();
    }
    if (status === "item_shipout") {
      setTrackingNumberDraft(item.trackingNumber ?? "");
    }
    if (status === "arrived_ph_warehouse") {
      setWeightDraft(item.weightKg ?? 0);
      setForwarderRateDraft(item.forwarderRatePerKg ?? 0);
      setIsBrandedDraft(item.isBranded);
      setLalamoveDraft(item.lalamoveFee ?? 0);
    }

    setExpandedStep(status);
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
        if (!response.ok) throw new Error("Upload failed");
        const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
        setNewQcUploads((current) => [...current, { id: storageId, url: URL.createObjectURL(file) }]);
        setQcPhotoIdsDraft((current) => (current.includes(storageId) ? current : [...current, storageId]));
      }
    } catch {
      toast.error("Failed to upload QC photos");
    }
    setUploadingQc(false);
  };

  const handleRemoveQcPhoto = (idToRemove: Id<"_storage">) => {
    setQcPhotoIdsDraft((current) => current.filter((id) => id !== idToRemove));
    setNewQcUploads((current) => {
      const photo = current.find((p) => p.id === idToRemove);
      if (photo) URL.revokeObjectURL(photo.url);
      return current.filter((p) => p.id !== idToRemove);
    });
  };

  const handleSaveQcSent = async () => {
    const mergedPhotoIds = Array.from(new Set(qcPhotoIdsDraft));
    if (mergedPhotoIds.length === 0) {
      toast.error("Upload at least one QC photo before setting QC Sent");
      return;
    }
    setSaving(true);
    try {
      await updateItem({
        id: item._id,
        status: "qc_sent",
        qcStatus: qcStatusDraft,
        qcPhotoIds: mergedPhotoIds,
      });
      toast.success("Status updated to QC Sent");
      setExpandedStep(null);
    } catch {
      toast.error("Failed to update status");
    }
    setSaving(false);
  };

  const handleSaveItemShipout = async () => {
    if (!trackingNumberDraft.trim()) {
      toast.error("Tracking number is required");
      return;
    }
    setSaving(true);
    try {
      await updateItem({
        id: item._id,
        status: "item_shipout",
        trackingNumber: trackingNumberDraft.trim(),
      });
      toast.success("Status updated to Item Shipout");
      setExpandedStep(null);
    } catch {
      toast.error("Failed to update status");
    }
    setSaving(false);
  };

  const handleSaveArrivedPh = async () => {
    if (weightDraft <= 0) {
      toast.error("Weight is required");
      return;
    }
    if (forwarderRateDraft <= 0) {
      toast.error("Forwarder rate is required");
      return;
    }
    setSaving(true);
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
      setExpandedStep(null);
    } catch {
      toast.error("Failed to update status");
    }
    setSaving(false);
  };

  const handleSaveDelivered = async () => {
    setSaving(true);
    try {
      await updateStatus({ id: item._id, status: "delivered_to_customer" });
      toast.success("Status updated to Delivered");
      setExpandedStep(null);
    } catch {
      toast.error("Failed to update status");
    }
    setSaving(false);
  };

  const getStepSummary = (status: ItemStatus): string | null => {
    const stepIndex = STATUS_FLOW.indexOf(status);
    if (stepIndex > currentIndex) return null;

    switch (status) {
      case "qc_sent": {
        const qcLabel = QC_STATUS_CONFIG[item.qcStatus]?.label ?? item.qcStatus;
        const photoCount = item.qcPhotoIds?.length ?? 0;
        return `QC: ${qcLabel} · ${photoCount} photo${photoCount !== 1 ? "s" : ""}`;
      }
      case "item_shipout":
        return item.trackingNumber ? `Tracking: ${item.trackingNumber}` : null;
      case "arrived_ph_warehouse":
        return item.weightKg ? `${item.weightKg}kg · PHP${item.forwarderRatePerKg}/kg` : null;
      case "delivered_to_customer":
        return currentIndex >= stepIndex ? "Completed" : null;
      default:
        return null;
    }
  };

  const isNextStep = (status: ItemStatus) => {
    const stepIndex = STATUS_FLOW.indexOf(status);
    return stepIndex === currentIndex + 1;
  };

  const canExpand = (status: ItemStatus) => {
    if (isTerminal) return false;
    const stepIndex = STATUS_FLOW.indexOf(status);
    // Can expand the next step or the current step (to update data)
    return stepIndex === currentIndex + 1 || (stepIndex === currentIndex && status !== "ordered");
  };

  return (
    <div className="space-y-0">
      {STATUS_FLOW.map((status, index) => {
        const config = STATUS_CONFIG[status];
        const colors = colorMap[config.color];
        const isCompleted = !isTerminal && currentIndex >= 0 && index < currentIndex;
        const isCurrent = index === currentIndex && !isTerminal;
        const isExpanded = expandedStep === status;
        const summary = isCompleted || isCurrent ? getStepSummary(status) : null;
        const expandable = canExpand(status);

        return (
          <div key={status} className="flex gap-3">
            {/* Dot + connector */}
            <div className="flex flex-col items-center w-6 shrink-0">
              <div
                className={cn(
                  "w-4 h-4 rounded-full shrink-0 mt-1 flex items-center justify-center",
                  isCurrent
                    ? `${colors.dot} ring-4 ${colors.ring}`
                    : isCompleted
                      ? "bg-accent"
                      : "bg-hover border border-border-default"
                )}
              >
                {isCompleted && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={10} strokeWidth={2} className="text-base" />}
              </div>
              {index < STATUS_FLOW.length - 1 && (
                <div
                  className={cn(
                    "w-px flex-1 my-1",
                    isCompleted ? "bg-accent/80" : "bg-border-subtle"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn("pb-4 flex-1 min-w-0", index === STATUS_FLOW.length - 1 && "pb-0")}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span
                    className={cn(
                      "text-sm",
                      isCurrent
                        ? `font-semibold ${colors.text}`
                        : isCompleted
                          ? "font-medium text-secondary"
                          : "text-tertiary"
                    )}
                  >
                    {config.label}
                  </span>
                  {summary && (
                    <p className="text-xs text-tertiary mt-0.5">{summary}</p>
                  )}
                </div>
                {expandable && (
                  <button
                    type="button"
                    onClick={() => handleExpand(status)}
                    className={cn(
                      "p-1 rounded-md transition-colors cursor-pointer",
                      isNextStep(status)
                        ? "text-accent hover:bg-accent-muted"
                        : "text-secondary hover:bg-hover"
                    )}
                  >
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={16}
                      strokeWidth={1.5}
                      className={cn("transition-transform", isExpanded && "rotate-180")}
                    />
                  </button>
                )}
              </div>

              {/* Expanded inline form */}
              {isExpanded && status === "qc_sent" && (
                <div className="mt-3 space-y-3 rounded-lg border border-border-subtle bg-surface p-3">
                  {qcPhotoIdsDraft.length > 0 && (
                    <div className="rounded-lg border border-border-subtle p-2">
                      <p className="text-xs text-secondary mb-2">QC Photos (click X to remove)</p>
                      <QcPhotoGallery
                        photoIds={qcPhotoIdsDraft}
                        onRemovePhoto={handleRemoveQcPhoto}
                        itemName={item.name}
                      />
                    </div>
                  )}
                  <ImageUpload
                    images={newQcUploads.map((p) => ({ id: p.id, url: p.url }))}
                    onUpload={handleUploadQc}
                    onRemove={(id) => handleRemoveQcPhoto(id as Id<"_storage">)}
                    uploading={uploadingQc}
                  />
                  <Select
                    label="QC Status"
                    value={qcStatusDraft}
                    onChange={(e) => setQcStatusDraft(e.target.value as Doc<"items">["qcStatus"])}
                    options={ALL_QC_STATUSES.map((s) => ({
                      value: s,
                      label: QC_STATUS_CONFIG[s].label,
                    }))}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { clearNewQcUploads(); setExpandedStep(null); }} disabled={saving}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveQcSent} disabled={saving || uploadingQc}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              )}

              {isExpanded && status === "item_shipout" && (
                <div className="mt-3 space-y-3 rounded-lg border border-border-subtle bg-surface p-3">
                  <Input
                    label="Tracking Number"
                    value={trackingNumberDraft}
                    onChange={(e) => setTrackingNumberDraft(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setExpandedStep(null)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveItemShipout} disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              )}

              {isExpanded && status === "arrived_ph_warehouse" && (
                <div className="mt-3 space-y-3 rounded-lg border border-border-subtle bg-surface p-3">
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
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setExpandedStep(null)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveArrivedPh} disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              )}

              {isExpanded && status === "delivered_to_customer" && (
                <div className="mt-3 space-y-3 rounded-lg border border-border-subtle bg-surface p-3">
                  <div className="text-center py-2">
                    <p className="text-sm font-medium text-primary">Ready to close this order?</p>
                    <p className="text-xs text-secondary mt-1">Confirm to mark as delivered.</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setExpandedStep(null)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveDelivered} disabled={saving}>
                      {saving ? "Saving..." : "Mark as Delivered"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
