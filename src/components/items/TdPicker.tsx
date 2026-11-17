import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { HugeiconsIcon } from "@hugeicons/react";
import { LockIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { TdRates } from "../../../convex/helpers";
import { formatTdRates } from "../../lib/formatters";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/label";

interface TdPickerProps {
  label?: string;
  /** The selected TD's name, as stored in the Item's `seller`. */
  value: string;
  onChange: (name: string) => void;
  /** The rates this watch is costed with, shown locked under the field. */
  rates: TdRates | null;
}

/** The seller field for a watch: searches Trusted Dealers only, and registers a new one inline. */
export function TdPicker({ label = "Trusted Dealer *", value, onChange, rates }: TdPickerProps) {
  const dealers = useQuery(api.sellers.listTrustedDealers) ?? [];
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputId = `${useId()}-td`;

  const [shownValue, setShownValue] = useState(value);
  if (value !== shownValue) {
    setShownValue(value);
    setQuery(value);
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, value]);

  const needle = query.trim().toLowerCase();
  const matches = dealers.filter((td) => td.name.toLowerCase().includes(needle));
  const offerCreate = needle.length > 0 && !dealers.some((td) => td.name.toLowerCase() === needle);

  const select = (name: string) => {
    onChange(name);
    setQuery(name);
    setOpen(false);
    setCreating(false);
  };

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      <Label htmlFor={inputId} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setCreating(false);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            // The picker sits inside the order form; Enter here must not submit the order.
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder="Search Trusted Dealers"
          className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        {open && !creating && (matches.length > 0 || offerCreate) && (
          <div
            role="listbox"
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-3xl bg-popover/90 p-1.5 shadow-lg ring-1 ring-foreground/10 backdrop-blur-2xl"
          >
            {matches.map((td) => (
              <div
                key={td._id}
                role="option"
                aria-selected={td.name === value}
                onClick={() => select(td.name)}
                className={cn(
                  "flex cursor-pointer items-baseline justify-between gap-3 rounded-2xl px-3 py-2 text-sm transition-colors",
                  td.name === value ? "bg-foreground/10" : "hover:bg-foreground/5"
                )}
              >
                <span className="truncate text-foreground">{td.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatTdRates(td)}
                </span>
              </div>
            ))}
            {offerCreate && (
              <div
                role="option"
                aria-selected={false}
                onClick={() => setCreating(true)}
                className="flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-2 text-sm text-accent transition-colors hover:bg-accent/10"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={1.5} />
                Create TD "{query.trim()}"
              </div>
            )}
          </div>
        )}
      </div>

      {creating && (
        <NewTdPanel
          initialName={query.trim()}
          onCancel={() => setCreating(false)}
          onCreated={select}
        />
      )}

      {rates && !creating && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <LockedRate label="Shipping" value={`¥${rates.tdShippingCNY.toLocaleString("en-US")}`} />
          <LockedRate label="Insurance" value={`${rates.tdInsurancePct}%`} />
          <span className="text-xs text-tertiary">Fixed by the TD. Edit in Sellers.</span>
        </div>
      )}
    </div>
  );
}

function NewTdPanel({
  initialName,
  onCancel,
  onCreated,
}: {
  initialName: string;
  onCancel: () => void;
  onCreated: (name: string) => void;
}) {
  const createTd = useMutation(api.sellers.createTrustedDealer);
  const [name, setName] = useState(initialName);
  const [shipping, setShipping] = useState("");
  const [insurance, setInsurance] = useState("");
  const [saving, setSaving] = useState(false);
  const ready = name.trim() !== "" && shipping !== "" && insurance !== "";

  const save = async () => {
    setSaving(true);
    try {
      await createTd({
        name: name.trim(),
        tdShippingCNY: Number(shipping),
        tdInsurancePct: Number(insurance),
      });
      toast.success(`Added ${name.trim()} as a Trusted Dealer`);
      onCreated(name.trim());
    } catch (err) {
      toast.error(err instanceof ConvexError ? String(err.data) : "Failed to create TD");
    }
    setSaving(false);
  };

  return (
    <div
      className="mt-1 space-y-3 rounded-3xl bg-accent/5 p-4 ring-1 ring-accent/40"
      onKeyDown={(e) => {
        if (e.key !== "Enter" || !(e.target instanceof HTMLInputElement)) return;
        e.preventDefault();
        if (ready && !saving) save();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="TD name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Input
          label="Shipping fee"
          prefix="¥"
          type="number"
          min={0}
          step="0.01"
          value={shipping}
          onChange={(e) => setShipping(e.target.value)}
        />
        <Input
          label="Insurance"
          suffix="%"
          type="number"
          min={0}
          step="0.1"
          value={insurance}
          onChange={(e) => setInsurance(e.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        These become the TD's fixed rates. Change them later from the TD's page in Sellers.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" type="button" onClick={save} disabled={!ready || saving}>
          {saving ? "Saving..." : "Save TD"}
        </Button>
      </div>
    </div>
  );
}

function LockedRate({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
      <HugeiconsIcon icon={LockIcon} size={12} className="text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </span>
  );
}
