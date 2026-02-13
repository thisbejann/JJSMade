import { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { PLATFORM_CONFIG } from "../../lib/constants";

interface SellerFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    platform?: string;
    contactInfo?: string;
    storeLink?: string;
    notes?: string;
  }) => void;
  initialData?: {
    name: string;
    platform?: string;
    contactInfo?: string;
    storeLink?: string;
    notes?: string;
  };
}

export function SellerForm({ open, onClose, onSubmit, initialData }: SellerFormProps) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [storeLink, setStoreLink] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPlatform(initialData.platform ?? "");
      setContactInfo(initialData.contactInfo ?? "");
      setStoreLink(initialData.storeLink ?? "");
      setNotes(initialData.notes ?? "");
    } else {
      setName("");
      setPlatform("");
      setContactInfo("");
      setStoreLink("");
      setNotes("");
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      platform: platform || undefined,
      contactInfo: contactInfo || undefined,
      storeLink: storeLink || undefined,
      notes: notes || undefined,
    });
  };

  const platformOptions = Object.entries(PLATFORM_CONFIG).map(([val, cfg]) => ({
    value: val,
    label: cfg.label,
  }));

  return (
    <Modal open={open} onClose={onClose} title={initialData ? "Edit Seller" : "Add Seller"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Seller Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Passerby" />
        <Select label="Platform" value={platform} onChange={(e) => setPlatform(e.target.value)} options={platformOptions} placeholder="Select platform" />
        <Input label="Contact Info" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="WeChat ID, WhatsApp, etc." />
        <Input label="Store Link" value={storeLink} onChange={(e) => setStoreLink(e.target.value)} placeholder="https://..." />
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-secondary">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..."
            className="w-full rounded-lg border border-border-default bg-base px-3 py-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all resize-none h-20" />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initialData ? "Update" : "Add Seller"}</Button>
        </div>
      </form>
    </Modal>
  );
}
