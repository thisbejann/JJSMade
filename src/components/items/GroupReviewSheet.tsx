import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Combobox } from "../ui/Combobox";
import { CustomerPicker } from "./CustomerPicker";
import { useSettings } from "../../hooks/useSettings";
import {
  CATEGORY_CONFIG,
  FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT,
  type ItemCategory,
} from "../../lib/constants";
import { cn } from "../../lib/utils";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const CLOTHES_SIZES = ["S", "M", "L", "XL"] as const;

/** One negotiated Bundle line handed in from the calculator. */
export interface BundleLine {
  id: string;
  category: ItemCategory;
  mode: "regular" | "forwarder";
  priceCNY: number;
  localShippingCNY: number;
  quote: number;
}

interface GroupReviewSheetProps {
  onClose: () => void;
  lines: BundleLine[];
  /** Sum of line quotes — the full price before any discount. */
  bundleQuote: number;
  /** The calculator's Offer Total, pre-filling the editable total. */
  defaultOffer: number;
  /** Called with the new group id after a successful create. */
  onCreated: (groupId: Id<"orderGroups">) => void;
}

interface RowFields {
  name: string;
  seller: string;
  size: string;
}

const BLANK: RowFields = { name: "", seller: "", size: "" };

function needsSize(c: ItemCategory) {
  return c === "shoes" || c === "clothes";
}

function rowComplete(line: BundleLine, r: RowFields) {
  if (!r.name.trim() || !r.seller.trim()) return false;
  if (needsSize(line.category) && !r.size.trim()) return false;
  return true;
}

function peso(n: number): string {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * The finalize step of "Save as Group Order": a full-height overlay on the
 * calculator that collects the one Customer and the per-line fields the
 * calculator never captured (name · seller · size), then seeds the group +
 * items + carried negotiated total in one mutation.
 *
 * Rows are a progressive accordion — one expanded at a time. Completing a row
 * (name + seller + size where required) auto-advances to the next incomplete
 * one, so an 8-item bundle fills top-to-bottom without hunting. A header
 * progress meter and per-row check make incompleteness impossible to miss,
 * which matters because items.create throws on a missing shoe/clothes size.
 *
 * Mounted only while open (the parent gates it inside AnimatePresence), so state
 * initializes fresh on every open and a Cancel/unmount leaves the Bundle
 * untouched — no reset bookkeeping needed.
 */
export function GroupReviewSheet({
  onClose,
  lines,
  bundleQuote,
  defaultOffer,
  onCreated,
}: GroupReviewSheetProps) {
  const { settings } = useSettings();
  const sellers = useQuery(api.items.getUniqueSellers) ?? [];
  const createWithItems = useMutation(api.orderGroups.createWithItems);

  const [rows, setRows] = useState<Record<string, RowFields>>({});
  const [customerId, setCustomerId] = useState<Id<"customers"> | null>(null);
  const [offerStr, setOfferStr] = useState(() => (defaultOffer > 0 ? String(defaultOffer) : ""));
  const [expandedId, setExpandedId] = useState<string | null>(() => lines[0]?.id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll while the overlay is up.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const getRow = (id: string) => rows[id] ?? BLANK;

  function setField(line: BundleLine, field: keyof RowFields, value: string) {
    const updated = { ...getRow(line.id), [field]: value };
    setRows((prev) => ({ ...prev, [line.id]: updated }));
    // Auto-advance: when this (expanded) row just became complete, collapse it
    // and open the next still-incomplete row.
    if (line.id === expandedId && rowComplete(line, updated)) {
      const next = lines.find((l) => l.id !== line.id && !rowComplete(l, rows[l.id] ?? BLANK));
      setExpandedId(next ? next.id : null);
    }
  }

  const readyCount = lines.filter((l) => rowComplete(l, getRow(l.id))).length;
  const allRowsReady = readyCount === lines.length;
  const canCreate = allRowsReady && customerId != null && !submitting;
  const remaining = lines.length - readyCount + (customerId == null ? 1 : 0);

  async function handleCreate() {
    if (!canCreate || customerId == null) return;
    setSubmitting(true);
    setError(null);
    try {
      const items = lines.map((line) => {
        const r = getRow(line.id);
        const isForwarderBuy = line.mode === "forwarder";
        return {
          name: r.name.trim(),
          category: line.category,
          size: needsSize(line.category) ? r.size.trim() : undefined,
          seller: r.seller.trim(),
          priceCNY: line.priceCNY,
          localShippingCNY: line.localShippingCNY,
          sellingPrice: line.quote,
          isForwarderBuy,
          exchangeRateUsed: settings.cnyToPhpRate,
          forwarderRatePerKg: settings.defaultForwarderRate,
          forwarderBuyRateUsed: isForwarderBuy ? settings.forwarderBuyServiceRate : undefined,
          forwarderBuyCommissionPercent: isForwarderBuy
            ? FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT
            : undefined,
        };
      });
      const offerNum = offerStr.trim() === "" ? undefined : Number(offerStr);
      const groupId = await createWithItems({
        customerId,
        items,
        negotiatedTotal: Number.isNaN(offerNum) ? undefined : offerNum,
      });
      onCreated(groupId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the group.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <motion.div
        key="scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={submitting ? undefined : onClose}
        className="fixed inset-0 z-40 bg-black/60"
      />
      <motion.div
        key="sheet"
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 28, opacity: 0 }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
        role="dialog"
        aria-modal="true"
        aria-label="Review group order"
        className="fixed inset-0 z-50 flex flex-col w-full max-w-lg mx-auto bg-elevated ring-1 ring-white/10 overflow-hidden h-dvh sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-3xl"
      >
        {/* Header — title, customer, progress meter */}
        <div className="px-5 pt-5 pb-4 border-b border-border-subtle space-y-3.5 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-primary">Review group order</h2>
                  <p className="text-[11px] text-tertiary">
                    {lines.length} {lines.length === 1 ? "item" : "items"} from this bundle
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  aria-label="Cancel"
                  className="text-tertiary hover:text-primary transition-colors p-1.5 -m-1.5 rounded-lg hover:bg-hover disabled:opacity-40"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
                </button>
              </div>

              <CustomerPicker label="Customer" value={customerId} onChange={setCustomerId} />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-tertiary">Items ready</span>
                  <span className="font-mono text-secondary tabular-nums">
                    {readyCount} / {lines.length}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-accent"
                    animate={{ width: `${lines.length ? (readyCount / lines.length) * 100 : 0}%` }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                  />
                </div>
              </div>
            </div>

            {/* Rows — progressive accordion */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {lines.map((line) => (
                <AccordionRow
                  key={line.id}
                  line={line}
                  fields={getRow(line.id)}
                  complete={rowComplete(line, getRow(line.id))}
                  expanded={expandedId === line.id}
                  sellers={sellers}
                  onToggle={() => setExpandedId(expandedId === line.id ? null : line.id)}
                  onField={(field, value) => setField(line, field, value)}
                />
              ))}
            </div>

            {/* Footer — negotiated total, caveat, create */}
            <div className="px-5 pt-3 pb-5 border-t border-border-subtle space-y-3 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label htmlFor="grs-total" className="block text-[11px] text-tertiary mb-1">
                    Negotiated total
                  </label>
                  <input
                    id="grs-total"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    className="w-36 h-9 rounded-2xl border border-transparent bg-white/[0.06] px-3 text-base font-mono text-primary tabular-nums outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                    placeholder={peso(bundleQuote)}
                    value={offerStr}
                    onChange={(e) => setOfferStr(e.target.value)}
                  />
                </div>
                <p className="flex items-center gap-1 text-[11px] text-warning text-right max-w-[9rem]">
                  <HugeiconsIcon icon={Alert02Icon} size={13} strokeWidth={1.5} className="shrink-0" />
                  <span>excl. forwarder shipping</span>
                </p>
              </div>

              {error && <p className="text-[11px] text-danger">{error}</p>}

              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={!canCreate}
                onClick={handleCreate}
              >
                {submitting
                  ? "Creating…"
                  : canCreate
                    ? "Create group order"
                    : `${remaining} left to finish`}
                {canCreate && !submitting && (
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={2} />
                )}
              </Button>
            </div>
      </motion.div>
    </>
  );
}

function AccordionRow({
  line,
  fields,
  complete,
  expanded,
  sellers,
  onToggle,
  onField,
}: {
  line: BundleLine;
  fields: RowFields;
  complete: boolean;
  expanded: boolean;
  sellers: string[];
  onToggle: () => void;
  onField: (field: keyof RowFields, value: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // The height animation needs overflow-hidden to clip, but that also clips the
  // seller Combobox's popover. Let overflow go visible only once the open
  // animation has settled (and revert before any collapse), so the dropdown can
  // spill past the row without showing content mid-animation.
  const [settled, setSettled] = useState(false);
  const escapeClip = expanded && settled;

  // Bring a freshly-expanded row (e.g. after auto-advance) into view.
  useEffect(() => {
    if (expanded) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [expanded]);

  const summary = complete
    ? `${fields.seller}${fields.size ? ` · ${fields.size}` : ""}`
    : `Tap to add name · seller${needsSize(line.category) ? " · size" : ""}`;

  return (
    <div ref={ref} className={cn("rounded-2xl ring-1 ring-white/5", escapeClip ? "overflow-visible" : "overflow-hidden")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full shrink-0",
            complete ? "bg-success/15 text-success" : "bg-white/5 text-tertiary"
          )}
        >
          {complete ? (
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} strokeWidth={2} />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary truncate">
            {fields.name.trim() || CATEGORY_CONFIG[line.category].label}
          </p>
          <p className="text-[11px] text-tertiary truncate">{summary}</p>
        </div>
        <span className="font-mono text-sm text-secondary tabular-nums shrink-0">{peso(line.quote)}</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-tertiary shrink-0"
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            onAnimationStart={() => setSettled(false)}
            onAnimationComplete={() => setSettled(true)}
            className={escapeClip ? "overflow-visible" : "overflow-hidden"}
          >
            <div className="px-3 pb-3 pt-2 space-y-2.5 border-t border-border-subtle">
              <input
                autoFocus
                value={fields.name}
                onChange={(e) => onField("name", e.target.value)}
                placeholder="Item name"
                className="h-9 w-full rounded-3xl border border-transparent bg-white/[0.06] px-3 text-sm text-primary placeholder:text-tertiary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
              />

              {line.category === "shoes" ? (
                <div className="grid grid-cols-[1fr_5rem] gap-2 items-end">
                  <Combobox
                    value={fields.seller}
                    onChange={(v) => onField("seller", v)}
                    options={sellers}
                    placeholder="Seller"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={fields.size}
                    onChange={(e) => onField("size", e.target.value)}
                    placeholder="EU"
                    className="h-9 w-full rounded-3xl border border-transparent bg-white/[0.06] px-3 text-sm text-primary placeholder:text-tertiary text-center outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              ) : (
                <>
                  <Combobox
                    value={fields.seller}
                    onChange={(v) => onField("seller", v)}
                    options={sellers}
                    placeholder="Seller"
                  />
                  {line.category === "clothes" && (
                    <div className="flex gap-1.5">
                      {CLOTHES_SIZES.map((sz) => {
                        const active = fields.size.toUpperCase() === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => onField("size", sz)}
                            className={cn(
                              "h-9 flex-1 rounded-2xl text-xs font-medium border transition-colors",
                              active
                                ? "border-accent bg-accent-muted text-accent"
                                : "border-border-default text-secondary hover:bg-hover"
                            )}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
