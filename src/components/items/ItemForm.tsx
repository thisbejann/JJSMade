import { useState, useCallback } from "react";
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
import {
  ALL_STATUSES,
  ALL_QC_STATUSES,
  STATUS_CONFIG,
  QC_STATUS_CONFIG,
  CATEGORY_CONFIG,
  type ItemCategory,
} from "../../lib/constants";
import { Footprints, Shirt, Watch } from "lucide-react";
import { cn } from "../../lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

const CATEGORY_ICONS = {
  shoes: Footprints,
  clothes: Shirt,
  watches_accessories: Watch,
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

const LALAMOVE_VISIBLE_STATUSES = new Set<Doc<"items">["status"]>([
  "arrived_ph_warehouse",
  "delivered_to_customer",
]);


interface ItemFormProps {
  existingItem?: Doc<"items">;
  onSuccess: (id: string) => void;
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

export function ItemForm({ existingItem, onSuccess }: ItemFormProps) {
  const { settings } = useSettings();
  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const allItems = useQuery(api.items.list, {});
  const sellers = [...new Set((allItems ?? []).map((item) => item.seller))];
  const batches = [
    ...new Set((allItems ?? []).filter((item) => item.batch).map((item) => item.batch!)),
  ];

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
  const [lalamoveFee, setLalamoveFee] = useState(existingItem?.lalamoveFee ?? 0);

  const [sellingPrice, setSellingPrice] = useState(existingItem?.sellingPrice ?? 0);
  const [customerName, setCustomerName] = useState(existingItem?.customerName ?? "");

  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [photoIds, setPhotoIds] = useState<Id<"_storage">[]>(
    existingItem?.qcPhotoIds ?? []
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showQcSection = QC_VISIBLE_STATUSES.has(status);
  const showShippingSection = SHIPPING_VISIBLE_STATUSES.has(status);
  const showLalamoveField = LALAMOVE_VISIBLE_STATUSES.has(status);

  const costs = useComputedCosts({
    priceCNY,
    exchangeRate,
    hasLocalShipping,
    localShippingCNY,
    weightKg,
    forwarderRatePerKg: forwarderRate,
    isForwarderBuy,
    forwarderBuyRateUsed,
    lalamoveFee,
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

    const normalizedSize = validateSize();
    if (normalizedSize === null) return;

    if (isForwarderBuy && forwarderBuyRateUsed <= 0) {
      toast.error("Forwarder buy service rate must be greater than 0");
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
        qcPhotoIds: photoIds.length > 0 ? photoIds : undefined,
        qcStatus: qcStatus as "not_received" | "pending_review" | "gl" | "rl",
        weightKg: weightKg > 0 ? weightKg : undefined,
        isBranded,
        forwarderRatePerKg: forwarderRate,
        sellingPrice: sellingPrice > 0 ? sellingPrice : undefined,
        lalamoveFee: lalamoveFee > 0 ? lalamoveFee : undefined,
        customerName: customerName || undefined,
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
      className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6"
    >
      <div className="space-y-6">
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
                  const Icon = CATEGORY_ICONS[cat];
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
                      <Icon size={20} />
                      <span className="text-xs font-medium">
                        {CATEGORY_CONFIG[cat].label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

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

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                className="w-full rounded-lg border border-border-default bg-base px-3 py-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none h-20"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">
              Pricing
            </h2>
            <Input
              label="Price in CNY *"
              type="number"
              value={priceCNY || ""}
              onChange={(e) => setPriceCNY(Number(e.target.value))}
              step="0.01"
              prefix="CNY"
            />
            {!isForwarderBuy && (
              <>
                <Input
                  label="Exchange Rate (CNY to PHP)"
                  type="number"
                  value={exchangeRate || ""}
                  onChange={(e) => {
                    setExchangeRateTouched(true);
                    setExchangeRateInput(Number(e.target.value));
                  }}
                  step="0.01"
                  suffix={`1 CNY = PHP ${exchangeRate.toFixed(2)}`}
                />

                <div className="rounded-lg bg-accent-muted px-3 py-2">
                  <p className="text-xs text-secondary">Price in PHP</p>
                  <p className="font-mono text-lg font-semibold text-accent">
                    PHP{" "}
                    {costs.pricePHP.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </>
            )}

            <Toggle
              label="Has Local Shipping?"
              checked={hasLocalShipping}
              onChange={setHasLocalShipping}
            />
            {hasLocalShipping && (
              <>
                <Input
                  label="Local Shipping (CNY)"
                  type="number"
                  value={localShippingCNY || ""}
                  onChange={(e) => setLocalShippingCNY(Number(e.target.value))}
                  step="0.01"
                  prefix="CNY"
                />
                <div className="rounded-lg bg-surface px-3 py-2 border border-border-subtle">
                  <p className="text-xs text-secondary">Local Shipping PHP</p>
                  <p className="font-mono text-sm text-primary">
                    PHP{" "}
                    {costs.localShippingPHP.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </>
            )}

            <Toggle
              label="Bought by Forwarder?"
              checked={isForwarderBuy}
              onChange={setIsForwarderBuy}
            />
            {isForwarderBuy && (
              <>
                <Input
                  label="Forwarder Buy Service Rate (CNY to PHP)"
                  type="number"
                  value={forwarderBuyRateUsed || ""}
                  onChange={(e) => {
                    setForwarderBuyRateTouched(true);
                    setForwarderBuyRateInput(Number(e.target.value));
                  }}
                  step="0.01"
                />
                <div className="rounded-lg bg-surface px-3 py-2 border border-border-subtle space-y-1">
                  <p className="text-xs text-secondary">
                    Forwarder Buy Fee (10% of item + 10 CNY)
                  </p>
                  <p className="text-xs text-secondary">
                    CNY {costs.forwarderBuyFeeCNY.toFixed(2)}
                  </p>
                  <p className="font-mono text-sm text-primary">
                    PHP {costs.forwarderBuyFeePHP.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg bg-surface px-3 py-2 border border-border-subtle">
                  <p className="text-xs text-secondary">QC Service Fee</p>
                  <p className="font-mono text-sm text-primary">
                    PHP {costs.qcServiceFeePHP.toFixed(2)}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {showQcSection && (
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-display font-semibold text-base text-primary">
                QC Photos
              </h2>
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
        )}

        {showShippingSection && (
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
              {weightKg > 0 && (
                <div className="rounded-lg bg-surface px-3 py-2 border border-border-subtle">
                  <p className="text-xs text-secondary">Forwarder Fee</p>
                  <p className="font-mono text-sm text-primary">
                    PHP{" "}
                    {costs.forwarderFee.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              )}

              {showLalamoveField && (
                <Input
                  label="Lalamove Fee (PHP)"
                  type="number"
                  value={lalamoveFee || ""}
                  onChange={(e) => setLalamoveFee(Number(e.target.value))}
                  prefix="PHP"
                />
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">
              Sale Info
            </h2>
            <Input
              label="Selling Price (PHP)"
              type="number"
              value={sellingPrice || ""}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              prefix="PHP"
            />
            {sellingPrice > 0 && (
              <MarkupIndicator
                markup={costs.profit}
                min={settings.defaultMarkupMin}
                max={settings.defaultMarkupMax}
              />
            )}
            <Input
              label="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Optional"
            />
          </CardContent>
        </Card>

        <PriceCalculator
          cnyToPhpRate={settings.cnyToPhpRate}
          forwarderBuyServiceRate={settings.forwarderBuyServiceRate ?? 8.6}
          priceCNY={priceCNY}
        />

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Saving..." : existingItem ? "Update Item" : "Save Item"}
        </Button>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-20">
          <LiveProfitCalculator
            pricePHP={costs.pricePHP}
            localShippingPHP={costs.localShippingPHP}
            forwarderFee={costs.forwarderFee}
            forwarderBuyFeePHP={costs.forwarderBuyFeePHP}
            qcServiceFeePHP={costs.qcServiceFeePHP}
            lalamoveFee={lalamoveFee}
            totalCost={costs.totalCost}
            sellingPrice={sellingPrice}
            profit={costs.profit}
            markupPercent={costs.markupPercent}
          />
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
            variant="danger"
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
