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
import { ImageUpload } from "../ui/ImageUpload";
import { LiveProfitCalculator } from "./LiveProfitCalculator";
import { MarkupIndicator } from "./MarkupIndicator";
import { ALL_STATUSES, ALL_QC_STATUSES, STATUS_CONFIG, QC_STATUS_CONFIG, CATEGORY_CONFIG, type ItemCategory } from "../../lib/constants";
import { Footprints, Shirt, Watch } from "lucide-react";
import { cn } from "../../lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

const CATEGORY_ICONS = { shoes: Footprints, clothes: Shirt, watches_accessories: Watch };

interface ItemFormProps {
  existingItem?: Doc<"items">;
  onSuccess: (id: string) => void;
}

export function ItemForm({ existingItem, onSuccess }: ItemFormProps) {
  const { settings } = useSettings();
  const createItem = useMutation(api.items.create);
  const updateItem = useMutation(api.items.update);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  // Get existing sellers and batches for autocomplete
  const allItems = useQuery(api.items.list, {});
  const sellers = [...new Set((allItems ?? []).map((i) => i.seller))];
  const batches = [...new Set((allItems ?? []).filter((i) => i.batch).map((i) => i.batch!))];

  const [name, setName] = useState(existingItem?.name ?? "");
  const [category, setCategory] = useState<ItemCategory>(existingItem?.category ?? "shoes");
  const [seller, setSeller] = useState(existingItem?.seller ?? "");
  const [sellerContact, setSellerContact] = useState(existingItem?.sellerContact ?? "");
  const [batch, setBatch] = useState(existingItem?.batch ?? "");
  const [orderDate, setOrderDate] = useState(
    existingItem ? format(new Date(existingItem.orderDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [notes, setNotes] = useState(existingItem?.notes ?? "");
  const [priceCNY, setPriceCNY] = useState(existingItem?.priceCNY ?? 0);
  const [exchangeRate, setExchangeRate] = useState(existingItem?.exchangeRateUsed ?? settings.cnyToPhpRate);
  const [hasLocalShipping, setHasLocalShipping] = useState(existingItem?.hasLocalShipping ?? false);
  const [localShippingCNY, setLocalShippingCNY] = useState(existingItem?.localShippingCNY ?? 0);
  const [qcStatus, setQcStatus] = useState(existingItem?.qcStatus ?? "not_received");
  const [isBranded, setIsBranded] = useState(existingItem?.isBranded ?? true);
  const [forwarderRate, setForwarderRate] = useState(existingItem?.forwarderRatePerKg ?? settings.defaultForwarderRate);
  const [weightKg, setWeightKg] = useState(existingItem?.weightKg ?? 0);
  const [lalamoveFee, setLalamoveFee] = useState(existingItem?.lalamoveFee ?? 0);
  const [sellingPrice, setSellingPrice] = useState(existingItem?.sellingPrice ?? 0);
  const [customerName, setCustomerName] = useState(existingItem?.customerName ?? "");
  const [status, setStatus] = useState<Doc<"items">["status"]>(existingItem?.status ?? "ordered");

  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [photoIds, setPhotoIds] = useState<Id<"_storage">[]>(existingItem?.qcPhotoIds ?? []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const costs = useComputedCosts({
    priceCNY, exchangeRate, hasLocalShipping, localShippingCNY,
    weightKg, forwarderRatePerKg: forwarderRate, lalamoveFee, sellingPrice,
  });

  const handleUpload = useCallback(async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
        const { storageId } = await res.json();
        setPhotoIds((prev) => [...prev, storageId]);
        setPhotos((prev) => [...prev, { id: storageId, url: URL.createObjectURL(file) }]);
      }
    } catch {
      toast.error("Failed to upload photos");
    }
    setUploading(false);
  }, [generateUploadUrl]);

  const handleRemovePhoto = (id: string) => {
    setPhotoIds((prev) => prev.filter((p) => p !== id));
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !seller.trim() || priceCNY <= 0) {
      toast.error("Please fill in required fields");
      return;
    }
    setSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        category,
        seller: seller.trim(),
        sellerContact: sellerContact || undefined,
        batch: batch || undefined,
        priceCNY,
        exchangeRateUsed: exchangeRate,
        hasLocalShipping,
        localShippingCNY: hasLocalShipping ? localShippingCNY : undefined,
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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        {/* Section 1: Item Details */}
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">Item Details</h2>
            <Input label="Item Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan 4 Military Black Size 42" />
            <div>
              <label className="block text-xs font-medium text-secondary mb-2">Category *</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CATEGORY_CONFIG) as ItemCategory[]).map((cat) => {
                  const Icon = CATEGORY_ICONS[cat];
                  return (
                    <button key={cat} type="button" onClick={() => setCategory(cat)}
                      className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer",
                        category === cat ? "border-accent bg-accent-muted text-accent" : "border-border-default text-secondary hover:border-border-strong hover:bg-hover"
                      )}>
                      <Icon size={20} />
                      <span className="text-xs font-medium">{CATEGORY_CONFIG[cat].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Combobox label="Seller *" value={seller} onChange={setSeller} options={sellers} placeholder="Search or type seller name" />
            <Input label="Seller Contact" value={sellerContact} onChange={(e) => setSellerContact(e.target.value)} placeholder="WeChat ID, link, etc." />
            <Combobox label="Batch / Factory" value={batch} onChange={setBatch} options={batches} placeholder="e.g. HP Batch, LJR" />
            <DatePicker label="Order Date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..."
                className="w-full rounded-lg border border-border-default bg-base px-3 py-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none h-20" />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Pricing */}
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">Pricing</h2>
            <Input label="Price in CNY *" type="number" prefix="¥" value={priceCNY || ""} onChange={(e) => setPriceCNY(Number(e.target.value))} step="0.01" />
            <Input label="Exchange Rate (CNY → PHP)" type="number" value={exchangeRate || ""} onChange={(e) => setExchangeRate(Number(e.target.value))} step="0.01"
              suffix={`¥1 = ₱${exchangeRate.toFixed(2)}`} />
            <div className="rounded-lg bg-accent-muted px-3 py-2">
              <p className="text-xs text-secondary">Price in PHP</p>
              <p className="font-mono text-lg font-semibold text-accent">₱{costs.pricePHP.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
            </div>
            <Toggle label="Has Local Shipping?" checked={hasLocalShipping} onChange={setHasLocalShipping} />
            {hasLocalShipping && (
              <>
                <Input label="Local Shipping (CNY)" type="number" prefix="¥" value={localShippingCNY || ""} onChange={(e) => setLocalShippingCNY(Number(e.target.value))} step="0.01" />
                <div className="rounded-lg bg-surface px-3 py-2 border border-border-subtle">
                  <p className="text-xs text-secondary">Local Shipping PHP</p>
                  <p className="font-mono text-sm text-primary">₱{costs.localShippingPHP.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Section 3: QC Photos */}
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">QC Photos</h2>
            <ImageUpload images={photos} onUpload={handleUpload} onRemove={handleRemovePhoto} uploading={uploading} />
            <div>
              <label className="block text-xs font-medium text-secondary mb-2">QC Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_QC_STATUSES.map((qs) => (
                  <button key={qs} type="button" onClick={() => setQcStatus(qs)}
                    className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border",
                      qcStatus === qs ? "border-accent bg-accent-muted text-accent" : "border-border-default text-secondary hover:bg-hover"
                    )}>
                    {QC_STATUS_CONFIG[qs].label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Shipping */}
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">Shipping & Fees</h2>
            <Toggle label="Branded / Sensitive Item?" checked={isBranded} onChange={setIsBranded} />
            <Input label="Forwarder Rate (PHP/kg)" type="number" prefix="₱" value={forwarderRate || ""} onChange={(e) => setForwarderRate(Number(e.target.value))} />
            <Input label="Weight (kg)" type="number" value={weightKg || ""} onChange={(e) => setWeightKg(Number(e.target.value))} step="0.01" />
            {weightKg > 0 && (
              <div className="rounded-lg bg-surface px-3 py-2 border border-border-subtle">
                <p className="text-xs text-secondary">Forwarder Fee</p>
                <p className="font-mono text-sm text-primary">₱{costs.forwarderFee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
              </div>
            )}
            <Input label="Lalamove Fee (PHP)" type="number" prefix="₱" value={lalamoveFee || ""} onChange={(e) => setLalamoveFee(Number(e.target.value))} />
          </CardContent>
        </Card>

        {/* Section 5: Sale */}
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">Sale Info</h2>
            <Input label="Selling Price (PHP)" type="number" prefix="₱" value={sellingPrice || ""} onChange={(e) => setSellingPrice(Number(e.target.value))} />
            {sellingPrice > 0 && (
              <MarkupIndicator markup={costs.profit} min={settings.defaultMarkupMin} max={settings.defaultMarkupMax} />
            )}
            <Input label="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Optional" />
            <Select label="Status" value={status}
              onChange={(e) => setStatus(e.target.value as Doc<"items">["status"])}
              options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s].label }))} />
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Saving..." : existingItem ? "Update Item" : "Save Item"}
        </Button>
      </div>

      {/* Sticky sidebar calculator */}
      <div className="hidden lg:block">
        <div className="sticky top-20">
          <LiveProfitCalculator
            pricePHP={costs.pricePHP}
            localShippingPHP={costs.localShippingPHP}
            forwarderFee={costs.forwarderFee}
            lalamoveFee={lalamoveFee}
            totalCost={costs.totalCost}
            sellingPrice={sellingPrice}
            profit={costs.profit}
            markupPercent={costs.markupPercent}
          />
        </div>
      </div>
    </form>
  );
}
