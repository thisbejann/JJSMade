import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { PLATFORM_CONFIG, type SellerPlatform } from "../../lib/constants";

export interface SellerFormData {
  name: string;
  platform?: SellerPlatform;
  tdShippingCNY?: number;
  tdInsurancePct?: number;
  contactInfo?: string;
  storeLink?: string;
  notes?: string;
}

interface SellerFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SellerFormData) => void;
  initialData?: SellerFormData;
}

type RateErrors = { shipping?: string; insurance?: string };

function parseRate(raw: string): { value?: number; error?: string } {
  if (raw.trim() === "") return { error: "Required for a TD" };
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return { error: "Must be 0 or higher" };
  return { value };
}

const platformOptions = Object.entries(PLATFORM_CONFIG).map(([val, cfg]) => ({
  value: val,
  label: cfg.label,
}));

export function SellerForm({ open, onClose, onSubmit, initialData }: SellerFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [platform, setPlatform] = useState<SellerPlatform | "">(initialData?.platform ?? "");
  const [shipping, setShipping] = useState(initialData?.tdShippingCNY?.toString() ?? "");
  const [insurance, setInsurance] = useState(initialData?.tdInsurancePct?.toString() ?? "");
  const [rateErrors, setRateErrors] = useState<RateErrors>({});
  const [contactInfo, setContactInfo] = useState(initialData?.contactInfo ?? "");
  const [storeLink, setStoreLink] = useState(initialData?.storeLink ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  const isTd = platform === "td";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    let rates: Pick<SellerFormData, "tdShippingCNY" | "tdInsurancePct"> = {};
    if (isTd) {
      const shippingRate = parseRate(shipping);
      const insuranceRate = parseRate(insurance);
      setRateErrors({ shipping: shippingRate.error, insurance: insuranceRate.error });
      if (shippingRate.error || insuranceRate.error) return;
      rates = { tdShippingCNY: shippingRate.value, tdInsurancePct: insuranceRate.value };
    }
    onSubmit({
      name: name.trim(),
      platform: platform || undefined,
      ...rates,
      contactInfo: contactInfo || undefined,
      storeLink: storeLink || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initialData ? "Edit Seller" : "Add Seller"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Seller Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Passerby" />
        <Select label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value as SellerPlatform)} options={platformOptions} placeholder="Select platform" />
        {isTd && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <Input label="TD Shipping *" type="number" inputMode="decimal" min={0} step="any" prefix="¥"
                value={shipping} onChange={(e) => setShipping(e.target.value)} error={rateErrors.shipping} />
              <Input label="TD Insurance *" type="number" inputMode="decimal" min={0} step="any" suffix="%"
                value={insurance} onChange={(e) => setInsurance(e.target.value)} error={rateErrors.insurance} />
            </div>
            <p className="text-xs text-muted-foreground">
              Fixed rates for this TD. Each new watch copies them in when it's ordered.
            </p>
          </div>
        )}
        <Input label="Contact Info" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="WeChat ID, WhatsApp, etc." />
        <Input label="Store Link" value={storeLink} onChange={(e) => setStoreLink(e.target.value)} placeholder="https://..." />
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-secondary">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..."
            className="w-full rounded-lg border border-border-default bg-base px-3 py-2 text-sm text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none h-20" />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initialData ? "Update" : "Add Seller"}</Button>
        </div>
      </form>
    </Modal>
  );
}
