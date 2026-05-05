import { useState, useRef, useEffect, useId, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";
import { Label } from "../ui/label";

interface CustomerPickerProps {
  label?: string;
  value: Id<"customers"> | null;
  onChange: (id: Id<"customers">) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CustomerPicker({ label, value, onChange, placeholder, disabled }: CustomerPickerProps) {
  const customers = useQuery(api.customers.list) ?? [];
  const createCustomer = useMutation(api.customers.create);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const inputId = `${id}-input`;

  const selectedCustomer = customers.find((c) => c._id === value) ?? null;

  useEffect(() => {
    setSearch(selectedCustomer?.name ?? "");
  }, [selectedCustomer?.name]);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const showCreate =
    search.trim().length > 0 &&
    !filtered.some((c) => c.name.toLowerCase() === search.trim().toLowerCase());

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch(selectedCustomer?.name ?? "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, selectedCustomer?.name]);

  const selectCustomer = useCallback(
    (customerId: Id<"customers">, name: string) => {
      onChange(customerId);
      setSearch(name);
      setOpen(false);
    },
    [onChange]
  );

  const handleCreate = useCallback(async () => {
    const name = search.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const newId = await createCustomer({ name });
      selectCustomer(newId, name);
    } finally {
      setCreating(false);
    }
  }, [search, creating, createCustomer, selectCustomer]);

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && (
        <Label htmlFor={inputId} className="text-sm text-muted-foreground">
          {label}
        </Label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          disabled={disabled}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          placeholder={placeholder ?? "Search customer..."}
          className={cn(
            "h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground",
            "outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {open && !disabled && (filtered.length > 0 || showCreate) && (
          <div
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-3xl bg-popover/70 shadow-lg ring-1 ring-foreground/10 z-50 backdrop-blur-2xl p-1.5"
          >
            {filtered.map((customer) => (
              <div
                key={customer._id}
                role="option"
                aria-selected={customer._id === value}
                onClick={() => selectCustomer(customer._id, customer.name)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-2xl transition-colors cursor-pointer",
                  customer._id === value
                    ? "bg-foreground/10 text-foreground"
                    : "text-foreground hover:bg-foreground/5"
                )}
              >
                {customer.name}
              </div>
            ))}
            {showCreate && (
              <div
                role="option"
                aria-selected={false}
                onClick={handleCreate}
                className="w-full text-left px-3 py-2 text-sm rounded-2xl transition-colors cursor-pointer text-accent hover:bg-foreground/5"
              >
                {creating ? "Creating..." : `Create "${search.trim()}"`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
