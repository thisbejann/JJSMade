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
import { QcPhotoGallery } from "../components/items/QcPhotoGallery";
import { formatPHP, formatCNY, formatDate, formatWeight } from "../lib/formatters";
import {
  ALL_PERSONAL_STATUSES,
  PERSONAL_STATUS_CONFIG,
  PERSONAL_STATUS_FLOW,
  type PersonalItemStatus,
} from "../lib/constants";
import { Edit, Trash2, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import type { Id } from "../../convex/_generated/dataModel";

export default function PersonalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = useQuery(api.personalItems.getById, { id: id as Id<"personalItems"> });
  const updateStatus = useMutation(api.personalItems.updateStatus);
  const removeItem = useMutation(api.personalItems.remove);

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
          <Button variant="ghost" onClick={() => navigate("/personal")} className="mt-4">
            Back to Personal Items
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ id: item._id, status: newStatus as PersonalItemStatus });
      toast.success(
        `Status updated to ${PERSONAL_STATUS_CONFIG[newStatus as PersonalItemStatus].label}`
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removeItem({ id: item._id });
      toast.success("Item deleted");
      navigate("/personal");
    } catch {
      toast.error("Failed to delete item");
    }
    setDeleting(false);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <button
              onClick={() => navigate("/personal")}
              className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Personal Items
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
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/personal/${item._id}/edit`)}
            >
              <Edit size={14} /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        </div>

        {/* Status timeline */}
        <Card>
          <CardContent>
            <PersonalStatusTimeline currentStatus={item.status} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="font-display font-semibold text-sm text-primary">QC Photos</h2>
              </CardHeader>
              <CardContent>
                <QcPhotoGallery photoIds={item.qcPhotoIds} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">Source</h3>
                <InfoRow label="Seller" value={item.seller} />
                <InfoRow label="Contact" value={item.sellerContact} />
                <InfoRow label="Batch" value={item.batch} />
                <InfoRow label="Size" value={item.size} />
                <InfoRow label="Order Date" value={formatDate(item.orderDate)} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">Pricing</h3>
                <InfoRow label="Price (CNY)" value={formatCNY(item.priceCNY)} mono />
                <InfoRow
                  label="Exchange Rate"
                  value={`PHP${item.exchangeRateUsed.toFixed(2)}/CNY1`}
                  mono
                />
                <InfoRow label="Price (PHP)" value={formatPHP(item.pricePHP)} mono />
                {item.localShippingPHP != null && item.localShippingPHP > 0 && (
                  <InfoRow label="Local Shipping" value={formatPHP(item.localShippingPHP)} mono />
                )}
                {item.isForwarderBuy && (
                  <>
                    <InfoRow label="Forwarder Buy" value="Yes" />
                    <InfoRow
                      label="Service Rate"
                      value={`PHP${item.forwarderBuyRateUsed?.toFixed(2)}/CNY1`}
                      mono
                    />
                    <InfoRow label="Forwarder Buy Fee" value={formatPHP(item.forwarderBuyFeePHP)} mono />
                    <InfoRow label="QC Service Fee" value={formatPHP(item.qcServiceFeePHP)} mono />
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">Shipping</h3>
                <InfoRow label="Weight" value={formatWeight(item.weightKg)} mono />
                <InfoRow label="Rate" value={`PHP${item.forwarderRatePerKg}/kg`} mono />
                <InfoRow label="Forwarder Fee" value={formatPHP(item.forwarderFee)} mono />
                <InfoRow label="Branded" value={item.isBranded ? "Yes" : "No"} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h3 className="text-xs font-medium text-secondary uppercase tracking-wider">
                  Quick Actions
                </h3>
                <Select
                  label="Update Status"
                  value={item.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  options={ALL_PERSONAL_STATUSES.map((status) => ({
                    value: status,
                    label: PERSONAL_STATUS_CONFIG[status].label,
                  }))}
                />
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
          Are you sure you want to delete "{item.name}"? This action cannot be undone.
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
    </PageContainer>
  );
}

// ── Inline status timeline for personal statuses ──

const colorMap: Record<string, { text: string; dot: string; ring: string }> = {
  info: { text: "text-info", dot: "bg-info", ring: "ring-info/30" },
  warning: { text: "text-warning", dot: "bg-warning", ring: "ring-warning/30" },
  success: { text: "text-success", dot: "bg-success", ring: "ring-success/30" },
  danger: { text: "text-danger", dot: "bg-danger", ring: "ring-danger/30" },
};

function PersonalStatusTimeline({ currentStatus }: { currentStatus: string }) {
  const isTerminal = currentStatus === "cancelled";
  const steps: PersonalItemStatus[] = isTerminal
    ? [...PERSONAL_STATUS_FLOW, "cancelled"]
    : [...PERSONAL_STATUS_FLOW];

  const currentIndex = isTerminal
    ? steps.length - 1
    : PERSONAL_STATUS_FLOW.indexOf(currentStatus as PersonalItemStatus);

  const isStepCurrent = (index: number) => index === currentIndex;
  const isStepCompleted = (index: number) =>
    !isTerminal && currentIndex >= 0 && index < currentIndex;

  const connectorClass = (index: number) => {
    if (index >= steps.length - 1) return "";
    if (isTerminal) {
      return index === steps.length - 2 ? "bg-danger/70" : "bg-border-subtle";
    }
    return index < currentIndex ? "bg-accent/80" : "bg-border-subtle";
  };

  const gridStyle = { gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="flex items-center h-14">
          <div className="w-full grid" style={gridStyle}>
            {steps.map((status, index) => {
              const config = PERSONAL_STATUS_CONFIG[status];
              const colors = colorMap[config.color];
              const isCurrent = isStepCurrent(index);
              const isCompleted = isStepCompleted(index);
              return (
                <div key={`dot-${status}-${index}`} className="relative flex justify-center items-center">
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "absolute top-1/2 left-1/2 w-full h-px -translate-y-1/2",
                        connectorClass(index)
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      "relative z-10 w-4 h-4 rounded-full transition-all flex-shrink-0",
                      isCurrent
                        ? `${colors.dot} ring-4 ${colors.ring}`
                        : isCompleted
                          ? "bg-accent"
                          : "bg-hover border border-border-default"
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="grid pb-1" style={gridStyle}>
          {steps.map((status, index) => {
            const config = PERSONAL_STATUS_CONFIG[status];
            const colors = colorMap[config.color];
            const isCurrent = isStepCurrent(index);
            const isCompleted = isStepCompleted(index);
            return (
              <div key={`label-${status}-${index}`} className="flex justify-center px-2">
                <span
                  className={cn(
                    "text-[11px] leading-tight text-center max-w-[90px]",
                    isCurrent
                      ? `font-semibold ${colors.text}`
                      : isCompleted
                        ? "font-medium text-secondary"
                        : "font-medium text-tertiary"
                  )}
                >
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
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
      <span className={cn("text-sm text-secondary", bold && "font-semibold")}>{label}</span>
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
