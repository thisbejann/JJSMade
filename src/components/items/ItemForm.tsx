import { useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSettings } from "../../hooks/useSettings";
import { useComputedCosts } from "../../hooks/useComputedCosts";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";
import { DatePicker } from "../ui/DatePicker";
import { Combobox } from "../ui/Combobox";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { ImageUpload } from "../ui/ImageUpload";
import { LiveProfitCalculator } from "./LiveProfitCalculator";
import { MarkupIndicator } from "./MarkupIndicator";
import { PriceCalculator } from "./PriceCalculator";
import { QcPhotoGallery } from "./QcPhotoGallery";
import { CustomerPicker } from "./CustomerPicker";
import {
  ALL_STATUSES,
  ALL_QC_STATUSES,
  STATUS_CONFIG,
  QC_STATUS_CONFIG,
  CATEGORY_CONFIG,
  type ItemCategory,
} from "../../lib/constants";
import { HugeiconsIcon } from "@hugeicons/react";
import { RunningShoesIcon, Shirt01Icon, Watch01Icon } from "@hugeicons/core-free-icons";
import { cn } from "../../lib/utils";
import { formatPHP } from "../../lib/formatters";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

const CATEGORY_ICONS = {
  shoes: RunningShoesIcon,
  clothes: Shirt01Icon,
  watches_accessories: Watch01Icon,
};

const CLOTHES_SIZES = ["S", "M", "L", "XL"] as const;

const QC_VISIBLE_STATUSES = new Set<Doc<"items">["status"]>([
  "qc_sent",
  "item_shipout",
  "arrived_ph_warehouse",
  "delivered_to_customer",
  "refunded",
]);

const SHIPPING_VISIBLE_STATUSES = new Set<Doc<"items">["status"]>([
  "item_shipout",
  "arrived_ph_warehouse",
  "delivered_to_customer",
]);


interface ItemFormProps {
  existingItem?: Doc<"items">;
  lockedCustomerId?: Id<"customers">;
  groupId?: Id<"orderGroups">;
  onSuccess: (id: string) => void;
}

// Smoothly expands/collapses conditional field groups. Spacing must live
// INSIDE the children (pt-*) — an outer margin would jump instead of animating.
function Reveal({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0, overflow: "hidden" }}
          animate={{
            height: "auto",
            opacity: 1,
            // release clipping once open so card shadows and focus rings render
            transitionEnd: { overflow: "visible" },
          }}
          exit={{ height: 0, opacity: 0, overflow: "hidden" }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FeeLine({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-secondary">{label}</span>
      <span
        className={cn(
          "font-mono text-sm",
          accent ? "font-semibold text-accent" : "text-primary"
        )}
      >
        {formatPHP(value)}
      </span>
    </div>
  );
}

function sanitizeSizeForCategory(category: ItemCategory, currentSize: string) {
  const trimmed = currentSize.trim();
  if (category === "watches_accessories") return "";
  if (category === "clothes") {
    const upper = trimmed.toUpperCase();
    return CLOTHES_SIZES.includes(upper as (typeof CLOTHES_SIZES)[number])
      ? upper
      : "";
  }
  if (!trimmed) return "";
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) || parsed <= 0 ? "" : trimmed;
}

export function ItemForm({ existingItem, lockedCustomerId, groupId, onSuccess }: ItemFormProps) {
  const { settings } = useSettings();
  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const sellers = useQuery(api.items.getUniqueSellers) ?? [];
  const batches = useQuery(api.items.getUniqueBatches) ?? [];

  const [name, setName] = useState(existingItem?.name ?? "");
  const [category, setCategory] = useState<ItemCategory>(
    existingItem?.category ?? "shoes"
  );
  const [size, setSize] = useState(existingItem?.size ?? "");
  const [seller, setSeller] = useState(existingItem?.seller ?? "");
  const [sellerContact, setSellerContact] = useState(existingItem?.sellerContact ?? "");
  const [batch, setBatch] = useState(existingItem?.batch ?? "");
  const [orderDate, setOrderDate] = useState(
    existingItem
      ? format(new Date(existingItem.orderDate), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd")
  );
  const [notes, setNotes] = useState(existingItem?.notes ?? "");

  const [status, setStatus] = useState<Doc<"items">["status"]>(
    existingItem?.status ?? "ordered"
  );
  const [qcStatus, setQcStatus] = useState(existingItem?.qcStatus ?? "not_received");
  const [rlModalOpen, setRlModalOpen] = useState(false);

  const [priceCNY, setPriceCNY] = useState(existingItem?.priceCNY ?? 0);
  const [exchangeRateInput, setExchangeRateInput] = useState(
    existingItem?.exchangeRateUsed ?? settings.cnyToPhpRate
  );
  const [exchangeRateTouched, setExchangeRateTouched] = useState(
    Boolean(existingItem)
  );
  const exchangeRate = existingItem
    ? exchangeRateInput
    : exchangeRateTouched
      ? exchangeRateInput
      : settings.cnyToPhpRate;

  const [hasLocalShipping, setHasLocalShipping] = useState(
    existingItem?.hasLocalShipping ?? true
  );
  const [localShippingCNY, setLocalShippingCNY] = useState(
    existingItem?.localShippingCNY ?? 0
  );

  const [isForwarderBuy, setIsForwarderBuy] = useState(
    existingItem?.isForwarderBuy ?? false
  );
  const [forwarderBuyRateInput, setForwarderBuyRateInput] = useState(
    existingItem?.forwarderBuyRateUsed ?? settings.forwarderBuyServiceRate ?? 8.6
  );
  const [forwarderBuyRateTouched, setForwarderBuyRateTouched] = useState(
    Boolean(existingItem)
  );
  const forwarderBuyRateUsed = existingItem
    ? forwarderBuyRateInput
    : forwarderBuyRateTouched
      ? forwarderBuyRateInput
      : (settings.forwarderBuyServiceRate ?? 8.6);
  const [forwarderBuyCommissionPercent, setForwarderBuyCommissionPercent] = useState(
    existingItem?.forwarderBuyCommissionPercent ?? 10
  );

  const [isBranded, setIsBranded] = useState(existingItem?.isBranded ?? true);
  const [forwarderRateInput, setForwarderRateInput] = useState(
    existingItem?.forwarderRatePerKg ?? settings.defaultForwarderRate
  );
  const [forwarderRateTouched, setForwarderRateTouched] = useState(
    Boolean(existingItem)
  );
  const forwarderRate = existingItem
    ? forwarderRateInput
    : forwarderRateTouched
      ? forwarderRateInput
      : settings.defaultForwarderRate;
  const [weightKg, setWeightKg] = useState(existingItem?.weightKg ?? 0);
  const [trackingNumber, setTrackingNumber] = useState(
    existingItem?.trackingNumber ?? ""
  );
  const [sellingPrice, setSellingPrice] = useState(existingItem?.sellingPrice ?? 0);
  const [customerId, setCustomerId] = useState<Id<"customers"> | null>(
    lockedCustomerId ?? existingItem?.customerId ?? null
  );

  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [photoIds, setPhotoIds] = useState<Id<"_storage">[]>(
    existingItem?.qcPhotoIds ?? []
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showQcSection = QC_VISIBLE_STATUSES.has(status);
  const showShippingSection = SHIPPING_VISIBLE_STATUSES.has(status);
  const existingPhotoIds = (existingItem?.qcPhotoIds ?? []).filter((id) => photoIds.includes(id));

  const costs = useComputedCosts({
    priceCNY,
    exchangeRate,
    hasLocalShipping,
    localShippingCNY,
    weightKg,
    forwarderRatePerKg: forwarderRate,
    isForwarderBuy,
    forwarderBuyRateUsed,
    forwarderBuyCommissionPercent,
    sellingPrice,
  });

  const handleUpload = useCallback(
    async (files: File[]) => {
      setUploading(true);
      try {
        for (const file of files) {
          const uploadUrl = await generateUploadUrl();
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });
          const { storageId } = await response.json();
          setPhotoIds((current) => [...current, storageId]);
          setPhotos((current) => [
            ...current,
            { id: storageId, url: URL.createObjectURL(file) },
          ]);
        }
      } catch {
        toast.error("Failed to upload photos");
      }
      setUploading(false);
    },
    [generateUploadUrl]
  );

  const handleRemovePhoto = (id: string) => {
    setPhotoIds((current) => current.filter((photoId) => photoId !== id));
    setPhotos((current) => current.filter((photo) => photo.id !== id));
  };

  const validateSize = () => {
    const normalizedSize = size.trim().toUpperCase();
    if (category === "shoes") {
      const parsed = Number(size.trim());
      if (!size.trim() || Number.isNaN(parsed) || parsed <= 0) {
        toast.error("Shoes must have a valid EU size");
        return null;
      }
      return size.trim();
    }
    if (category === "clothes") {
      if (
        !CLOTHES_SIZES.includes(
          normalizedSize as (typeof CLOTHES_SIZES)[number]
        )
      ) {
        toast.error("Clothes size must be S, M, L, or XL");
        return null;
      }
      return normalizedSize;
    }
    return undefined;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !seller.trim() || priceCNY <= 0) {
      toast.error("Please fill in required fields");
      return;
    }

    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    const normalizedSize = validateSize();
    if (normalizedSize === null) return;

    if (isForwarderBuy && forwarderBuyRateUsed <= 0) {
      toast.error("Forwarder buy service rate must be greater than 0");
      return;
    }
    if (isForwarderBuy && forwarderBuyCommissionPercent < 0) {
      toast.error("Forwarder buy commission percent must be 0 or higher");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        category,
        size: normalizedSize,
        seller: seller.trim(),
        sellerContact: sellerContact || undefined,
        batch: batch || undefined,
        priceCNY,
        exchangeRateUsed: exchangeRate,
        hasLocalShipping,
        localShippingCNY: hasLocalShipping ? localShippingCNY : undefined,
        isForwarderBuy,
        forwarderBuyRateUsed: isForwarderBuy ? forwarderBuyRateUsed : undefined,
        forwarderBuyCommissionPercent: isForwarderBuy
          ? forwarderBuyCommissionPercent
          : undefined,
        qcPhotoIds: photoIds.length > 0 ? photoIds : undefined,
        qcStatus: qcStatus as "not_received" | "pending_review" | "gl" | "rl",
        weightKg: weightKg > 0 ? weightKg : undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        isBranded,
        forwarderRatePerKg: forwarderRate,
        sellingPrice: sellingPrice > 0 ? sellingPrice : undefined,
        customerId: customerId ?? undefined,
        orderGroupId: groupId,
        status: status as Doc<"items">["status"],
        notes: notes || undefined,
        orderDate: new Date(orderDate).getTime(),
      };

      if (existingItem) {
        await updateItem({ id: existingItem._id, ...data });
        toast.success("Item updated");
        onSuccess(existingItem._id);
      } else {
        const id = await createItem(data);
        toast.success("Item created");
        onSuccess(id);
      }
    } catch {
      toast.error("Failed to save item");
    }
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-[1080px] grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 pb-16 lg:pb-0"
    >
      <div>
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">
              Item Details
            </h2>
            <Input
              label="Item Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan 4 Military Black Size 42"
            />

            <div>
              <label className="block text-xs font-medium text-secondary mb-2">
                Category *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CATEGORY_CONFIG) as ItemCategory[]).map((cat) => {
                  const icon = CATEGORY_ICONS[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setSize((current) => sanitizeSizeForCategory(cat, current));
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer",
                        category === cat
                          ? "border-accent bg-accent-muted text-accent"
                          : "border-border-default text-secondary hover:border-border-strong hover:bg-hover"
                      )}
                    >
                      <HugeiconsIcon icon={icon} size={20} strokeWidth={1.5} />
                      <span className="text-xs font-medium">
                        {CATEGORY_CONFIG[cat].label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {category === "shoes" && (
                <Input
                  label="EU Size *"
                  type="number"
                  step="0.5"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. 42.5"
                />
              )}

              {category === "clothes" && (
                <Select
                  label="Size *"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  options={CLOTHES_SIZES.map((itemSize) => ({
                    value: itemSize,
                    label: itemSize,
                  }))}
                  placeholder="Select size"
                />
              )}

              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Doc<"items">["status"])}
                options={ALL_STATUSES.map((itemStatus) => ({
                  value: itemStatus,
                  label: STATUS_CONFIG[itemStatus].label,
                }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Combobox
                label="Seller *"
                value={seller}
                onChange={setSeller}
                options={sellers}
                placeholder="Search or type seller name"
              />
              <Input
                label="Seller Contact"
                value={sellerContact}
                onChange={(e) => setSellerContact(e.target.value)}
                placeholder="WeChat ID, link, etc."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Combobox
                label="Batch / Factory"
                value={batch}
                onChange={setBatch}
                options={batches}
                placeholder="e.g. HP Batch, LJR"
              />
              <DatePicker
                label="Order Date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                className="w-full rounded-lg border border-border-default bg-base px-3 py-2 text-sm text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all resize-none h-20"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent>
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-base text-primary">
                Pricing
              </h2>

              <div>
                <label className="block text-xs font-medium text-secondary mb-2">
                  Purchase Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([false, true] as const).map((viaForwarder) => (
                    <button
                      key={String(viaForwarder)}
                      type="button"
                      onClick={() => setIsForwarderBuy(viaForwarder)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border",
                        isForwarderBuy === viaForwarder
                          ? "border-accent bg-accent-muted text-accent"
                          : "border-border-default text-secondary hover:border-border-strong hover:bg-hover"
                      )}
                    >
                      {viaForwarder ? "Bought by Forwarder" : "Regular Order"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Price in CNY *"
                  type="number"
                  value={priceCNY || ""}
                  onChange={(e) => setPriceCNY(Number(e.target.value))}
                  step="0.01"
                  prefix="CNY"
                />
                {isForwarderBuy ? (
                  <Input
                    label="Buy Service Rate (CNY to PHP)"
                    type="number"
                    value={forwarderBuyRateUsed || ""}
                    onChange={(e) => {
                      setForwarderBuyRateTouched(true);
                      setForwarderBuyRateInput(Number(e.target.value));
                    }}
                    step="0.01"
                  />
                ) : (
                  <Input
                    label="Exchange Rate (CNY to PHP)"
                    type="number"
                    value={exchangeRate || ""}
                    onChange={(e) => {
                      setExchangeRateTouched(true);
                      setExchangeRateInput(Number(e.target.value));
                    }}
                    step="0.01"
                  />
                )}
              </div>
            </div>

            <Reveal show={isForwarderBuy}>
              <div className="grid gap-4 sm:grid-cols-2 pt-4">
                <Input
                  label="Buy Commission (%)"
                  type="number"
                  value={forwarderBuyCommissionPercent}
                  onChange={(e) =>
                    setForwarderBuyCommissionPercent(Number(e.target.value))
                  }
                  step="0.01"
                />
              </div>
            </Reveal>

            <div className="pt-4">
              <Toggle
                label="Has Local Shipping?"
                checked={hasLocalShipping}
                onChange={setHasLocalShipping}
              />
            </div>

            <Reveal show={hasLocalShipping}>
              <div className="grid gap-4 sm:grid-cols-2 pt-4">
                <Input
                  label="Local Shipping (CNY, Optional)"
                  type="number"
                  value={localShippingCNY || ""}
                  onChange={(e) => setLocalShippingCNY(Number(e.target.value))}
                  step="0.01"
                  prefix="CNY"
                  placeholder="0 for free shipping"
                />
              </div>
            </Reveal>

            <div className="mt-4 border-t border-border-subtle pt-3">
              <FeeLine label="Price in PHP" value={costs.pricePHP} accent />
              <Reveal show={isForwarderBuy}>
                <div className="space-y-1.5 pt-1.5">
                  <FeeLine
                    label={`Forwarder Buy Fee (${forwarderBuyCommissionPercent.toFixed(0)}% of item)`}
                    value={costs.forwarderBuyFeePHP}
                  />
                  <FeeLine label="QC Service Fee" value={costs.qcServiceFeePHP} />
                </div>
              </Reveal>
              <Reveal show={hasLocalShipping && localShippingCNY > 0}>
                <div className="pt-1.5">
                  <FeeLine
                    label="Local Shipping in PHP"
                    value={costs.localShippingPHP}
                  />
                </div>
              </Reveal>
            </div>
          </CardContent>
        </Card>

        <Reveal show={showQcSection}>
          <div className="pt-6">
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-display font-semibold text-base text-primary">
                QC Photos
              </h2>

              {existingPhotoIds.length > 0 && (
                <div className="rounded-lg border border-border-subtle p-3 space-y-2">
                  <p className="text-xs text-secondary">Existing QC photos</p>
                  <QcPhotoGallery
                    photoIds={existingPhotoIds}
                    onRemovePhoto={handleRemovePhoto}
                  />
                </div>
              )}

              <ImageUpload
                images={photos}
                onUpload={handleUpload}
                onRemove={handleRemovePhoto}
                uploading={uploading}
              />
              <div>
                <label className="block text-xs font-medium text-secondary mb-2">
                  QC Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ALL_QC_STATUSES.map((currentQcStatus) => (
                    <button
                      key={currentQcStatus}
                      type="button"
                      onClick={() => {
                        setQcStatus(currentQcStatus);
                        if (status === "qc_sent") {
                          if (currentQcStatus === "gl") {
                            setStatus("item_shipout");
                          } else if (currentQcStatus === "rl") {
                            setRlModalOpen(true);
                          }
                        }
                      }}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border",
                        qcStatus === currentQcStatus
                          ? "border-accent bg-accent-muted text-accent"
                          : "border-border-default text-secondary hover:bg-hover"
                      )}
                    >
                      {QC_STATUS_CONFIG[currentQcStatus].label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </Reveal>

        <Reveal show={showShippingSection}>
          <div className="pt-6">
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-display font-semibold text-base text-primary">
                Shipping and Fees
              </h2>
              <Toggle
                label="Branded / Sensitive Item?"
                checked={isBranded}
                onChange={setIsBranded}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Forwarder Rate (PHP/kg)"
                  type="number"
                  value={forwarderRate || ""}
                  onChange={(e) => {
                    setForwarderRateTouched(true);
                    setForwarderRateInput(Number(e.target.value));
                  }}
                  prefix="PHP"
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  value={weightKg || ""}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  step="0.01"
                />
                <Input
                  label="Tracking Number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              {weightKg > 0 && (
                <FeeLine label="Forwarder Fee" value={costs.forwarderFee} />
              )}

            </CardContent>
          </Card>
          </div>
        </Reveal>

        <Card className="mt-6 overflow-visible">
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">
              Sale Info
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Selling Price (PHP)"
                type="number"
                value={sellingPrice || ""}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                prefix="PHP"
              />
              <CustomerPicker
                label={lockedCustomerId ? "Customer (locked to group)" : "Customer *"}
                value={customerId}
                onChange={setCustomerId}
                placeholder="Search or create customer..."
                disabled={!!lockedCustomerId}
              />
            </div>
            {sellingPrice > 0 && (
              <MarkupIndicator
                markup={costs.profit}
                min={settings.defaultMarkupMin}
                max={settings.defaultMarkupMax}
              />
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="mt-6 w-full hidden lg:flex"
          disabled={submitting}
        >
          {submitting ? "Saving..." : existingItem ? "Update Item" : "Save Item"}
        </Button>
      </div>

      {/* Rail: sticky on desktop, stacks after the form on mobile */}
      <div>
        <div className="lg:sticky lg:top-20 space-y-4">
          <LiveProfitCalculator
            pricePHP={costs.pricePHP}
            localShippingPHP={costs.localShippingPHP}
            forwarderFee={costs.forwarderFee}
            forwarderBuyFeePHP={costs.forwarderBuyFeePHP}
            qcServiceFeePHP={costs.qcServiceFeePHP}
            totalCost={costs.totalCost}
            sellingPrice={sellingPrice}
            profit={costs.profit}
            markupPercent={costs.markupPercent}
          />
          <PriceCalculator
            cnyToPhpRate={settings.cnyToPhpRate}
            forwarderBuyServiceRate={settings.forwarderBuyServiceRate ?? 8.6}
            priceCNY={priceCNY}
          />
        </div>
      </div>

      {/* Mobile: sticky bottom bar with cost, profit, and save */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border-subtle px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-sm min-w-0">
            <div>
              <span className="text-secondary">Cost </span>
              <span className="font-mono font-medium text-primary">{formatPHP(costs.totalCost)}</span>
            </div>
            {sellingPrice > 0 && (
              <div>
                <span className="text-secondary">Profit </span>
                <span className={cn(
                  "font-mono font-semibold",
                  costs.profit > 0 ? "text-success" : costs.profit < 0 ? "text-danger" : "text-tertiary"
                )}>
                  {formatPHP(costs.profit)}
                </span>
              </div>
            )}
          </div>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Saving..." : existingItem ? "Update" : "Save"}
          </Button>
        </div>
      </div>

      <Modal
        open={rlModalOpen}
        onClose={() => setRlModalOpen(false)}
        title="RL — What should happen?"
      >
        <p className="text-sm text-secondary mb-5">
          The item was rejected (RL). Choose the next action:
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => {
              setStatus("ordered");
              setRlModalOpen(false);
            }}
          >
            Replace (back to Ordered)
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setStatus("refunded");
              setRlModalOpen(false);
            }}
          >
            Refund
          </Button>
        </div>
      </Modal>
    </form>
  );
}
