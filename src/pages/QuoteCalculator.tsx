import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Alert02Icon,
  CancelCircleIcon,
  PlusSignIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useSettings } from "../hooks/useSettings";
import { CATEGORY_CONFIG, type ItemCategory, FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT, FORWARDER_BUY_QC_FEE_PHP } from "../lib/constants";
import { cn } from "../lib/utils";

type CalcMode = "regular" | "forwarder";

type CalcView = "add" | "bundle";

interface BundleItem {
  id: string;
  category: ItemCategory;
  mode: CalcMode;
  priceCNY: number;
  quote: number;
  cost: number;
}

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "shoes", label: CATEGORY_CONFIG.shoes.label },
  { value: "clothes", label: CATEGORY_CONFIG.clothes.label },
  { value: "watches_accessories", label: CATEGORY_CONFIG.watches_accessories.label },
];

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function peso(n: number): string {
  const sign = n < 0 ? "−" : "";
  return `${sign}₱${Math.abs(n).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function QuoteCalculator() {
  const { settings } = useSettings();

  // --- Single-item calculator (unchanged behaviour) ---
  const [priceCNY, setPriceCNY] = useState(0);
  const [localShippingCNY, setLocalShippingCNY] = useState(10);
  const [mode, setMode] = useState<CalcMode>("regular");
  const [category, setCategory] = useState<ItemCategory>("shoes");

  // --- Bundle scratchpad (ephemeral) ---
  const [view, setView] = useState<CalcView>("add");
  const [bundle, setBundle] = useState<BundleItem[]>([]);
  const [offerStr, setOfferStr] = useState("");
  const [offerTouched, setOfferTouched] = useState(false);

  const rate =
    mode === "regular" ? settings.cnyToPhpRate : settings.forwarderBuyServiceRate;

  const commissionPercent = FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT;

  const markupMap: Record<ItemCategory, number> = {
    shoes: settings.calculatorMarkupShoes,
    clothes: settings.calculatorMarkupClothes,
    watches_accessories: settings.calculatorMarkupWatchesAccessories,
  };
  const markup = markupMap[category];

  let baseCost = 0;
  let commissionCost = 0;
  let qcFee = 0;
  let totalCost = 0;
  let customerQuote = 0;
  let formulaParts: string[] = [];

  if (priceCNY > 0) {
    baseCost = (priceCNY + localShippingCNY) * rate;

    if (mode === "forwarder") {
      commissionCost = priceCNY * (commissionPercent / 100) * rate;
      qcFee = FORWARDER_BUY_QC_FEE_PHP;
    }

    totalCost = baseCost + commissionCost + qcFee;
    customerQuote = Math.round((totalCost + markup) * 100) / 100;

    // Build formula breakdown
    if (mode === "regular") {
      formulaParts = [
        `(${priceCNY} + ${localShippingCNY}) × ${rate.toFixed(2)} + ${markup}`,
      ];
    } else {
      formulaParts = [
        `(${priceCNY} + ${localShippingCNY}) × ${rate.toFixed(2)}`,
        `+ ${commissionPercent}% commission: ${(priceCNY * (commissionPercent / 100)).toFixed(2)} × ${rate.toFixed(2)}`,
        `+ QC fee: ${qcFee}`,
        `+ markup: ${markup}`,
      ];
    }
  }

  // --- Bundle math ---
  const bundleQuote = useMemo(
    () => Math.round(bundle.reduce((sum, it) => sum + it.quote, 0) * 100) / 100,
    [bundle]
  );
  const floor = useMemo(
    () => Math.round(bundle.reduce((sum, it) => sum + it.cost, 0) * 100) / 100,
    [bundle]
  );

  const rawOffer = offerTouched ? offerStr : bundleQuote > 0 ? String(bundleQuote) : "";
  const offerEmpty = rawOffer.trim() === "";
  const offer = offerEmpty ? 0 : Number(rawOffer);

  const discount = Math.round((bundleQuote - offer) * 100) / 100;
  const discountPct = bundleQuote > 0 ? (discount / bundleQuote) * 100 : 0;
  const margin = Math.round((offer - floor) * 100) / 100;

  type MarginState = "green" | "yellow" | "red";
  const marginState: MarginState =
    offer >= bundleQuote ? "green" : offer >= floor ? "yellow" : "red";

  function addToBundle() {
    if (priceCNY <= 0) return;
    setBundle((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category,
        mode,
        priceCNY,
        quote: customerQuote,
        cost: Math.round(totalCost * 100) / 100,
      },
    ]);
    setPriceCNY(0); // reset price for the next item; keep mode/category/shipping
  }

  function removeFromBundle(id: string) {
    setBundle((prev) => {
      const next = prev.filter((it) => it.id !== id);
      if (next.length === 0) {
        setOfferTouched(false);
        setOfferStr("");
      }
      return next;
    });
  }

  function clearBundle() {
    setBundle([]);
    setOfferTouched(false);
    setOfferStr("");
  }

  return (
    <PageContainer>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Segmented mode toggle */}
        <div className="relative grid grid-cols-2 gap-1 p-1 bg-elevated rounded-full ring-1 ring-white/5">
          {(["add", "bundle"] as const).map((v) => {
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "relative z-10 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer",
                  active ? "text-accent" : "text-secondary hover:text-primary"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="calc-segment"
                    className="absolute inset-0 -z-10 rounded-full bg-accent-muted"
                    transition={{ duration: 0.25, ease: EASE_OUT }}
                  />
                )}
                {v === "add" ? "Add item" : "Bundle"}
                {v === "bundle" && bundle.length > 0 && (
                  <motion.span
                    key={bundle.length}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                      active ? "bg-accent text-white" : "bg-hover text-secondary"
                    )}
                  >
                    {bundle.length}
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>

        {view === "add" ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-5">
                <Input
                  label="Item Price (CNY)"
                  type="number"
                  value={priceCNY || ""}
                  onChange={(e) => setPriceCNY(Number(e.target.value))}
                  step="0.01"
                  prefix="¥"
                  placeholder="0.00"
                />

                <Input
                  label="Local Shipping (CNY)"
                  type="number"
                  value={localShippingCNY || ""}
                  onChange={(e) => setLocalShippingCNY(Number(e.target.value))}
                  step="0.01"
                  prefix="¥"
                  placeholder="10"
                />

                {/* Mode */}
                <div>
                  <label className="block text-xs font-medium text-secondary mb-2">
                    Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["regular", "forwarder"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={cn(
                          "px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border",
                          mode === m
                            ? "border-accent bg-accent-muted text-accent"
                            : "border-border-default text-secondary hover:border-border-strong hover:bg-hover"
                        )}
                      >
                        {m === "regular" ? "Regular Order" : "Bought by Forwarder"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-tertiary mt-1.5">
                    Rate: PHP{rate.toFixed(2)}/CNY1
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-secondary mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={cn(
                          "px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border text-center",
                          category === cat.value
                            ? "border-accent bg-accent-muted text-accent"
                            : "border-border-default text-secondary hover:border-border-strong hover:bg-hover"
                        )}
                      >
                        {cat.label}
                        <span className="block opacity-60 mt-0.5">+{markupMap[cat.value]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Result */}
            {priceCNY > 0 ? (
              <Card>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    {formulaParts.map((part, i) => (
                      <p key={i} className="text-xs text-secondary font-mono">{part}</p>
                    ))}
                  </div>
                  <div className="border-t border-border-subtle pt-3">
                    <p className="text-xs text-secondary mb-1">Suggested customer price</p>
                    <p className="font-mono text-2xl font-bold text-accent">
                      {peso(customerQuote)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <p className="text-sm text-tertiary text-center py-4">
                    Enter a CNY price to see the suggested selling price.
                  </p>
                </CardContent>
              </Card>
            )}

            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={priceCNY <= 0}
              onClick={addToBundle}
            >
              <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={2} />
              Add to bundle
            </Button>
          </div>
        ) : bundle.length === 0 ? (
          <Card>
            <CardContent>
              <div className="flex flex-col items-center text-center py-8 gap-1">
                <p className="text-sm text-secondary">No items in this bundle yet.</p>
                <p className="text-xs text-tertiary">
                  Price an item on <span className="text-secondary">Add item</span>, then tap{" "}
                  <span className="text-secondary">Add to bundle</span>.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Negotiation panel */}
            <Card>
              <CardContent className="space-y-5">
                {/* Margin signal (hero) */}
                <MarginSignal
                  state={marginState}
                  margin={margin}
                  discountPct={discountPct}
                  empty={offerEmpty}
                />

                {/* Your Offer */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <label className="text-xs font-medium text-secondary">Your offer</label>
                    {offerTouched && offer !== bundleQuote && (
                      <button
                        type="button"
                        onClick={() => {
                          setOfferTouched(false);
                          setOfferStr("");
                        }}
                        className="text-[11px] text-tertiary hover:text-accent transition-colors cursor-pointer"
                      >
                        Reset to quote
                      </button>
                    )}
                  </div>
                  <Input
                    type="number"
                    value={offerTouched ? offerStr : bundleQuote > 0 ? String(bundleQuote) : ""}
                    onChange={(e) => {
                      setOfferTouched(true);
                      setOfferStr(e.target.value);
                    }}
                    step="0.01"
                    prefix="₱"
                    placeholder="0.00"
                  />
                  {discount > 0 && !offerEmpty && (
                    <p className="text-[11px] text-secondary mt-1.5 font-mono">
                      Discount {peso(discount)} ({discountPct.toFixed(1)}% off)
                    </p>
                  )}
                </div>

                {/* Supporting figures */}
                <div className="grid grid-cols-2 gap-3 border-t border-border-subtle pt-4">
                  <Figure label="Bundle quote" value={peso(bundleQuote)} />
                  <Figure label="Break-even floor" value={peso(floor)} muted />
                </div>

                {/* Persistent caveat */}
                <p className="flex items-start gap-1.5 text-[11px] text-warning">
                  <HugeiconsIcon icon={Alert02Icon} size={14} strokeWidth={1.5} className="shrink-0 mt-px" />
                  <span>Excludes forwarder shipping fee. Optimistic for heavy items.</span>
                </p>
              </CardContent>
            </Card>

            {/* Items list */}
            <Card>
              <CardContent className="space-y-1">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-medium text-secondary">
                    Items <span className="text-tertiary tabular-nums">({bundle.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={clearBundle}
                    className="text-[11px] text-tertiary hover:text-danger transition-colors cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {bundle.map((it) => (
                    <motion.div
                      key={it.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border-subtle last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm text-primary truncate">
                            {CATEGORY_CONFIG[it.category].label}
                          </p>
                          <p className="text-[11px] text-tertiary font-mono">
                            ¥{it.priceCNY} · {it.mode === "forwarder" ? "Forwarder" : "Regular"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-secondary tabular-nums">
                            {peso(it.quote)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromBundle(it.id)}
                            aria-label={`Remove ${CATEGORY_CONFIG[it.category].label}`}
                            className="text-tertiary hover:text-danger transition-colors cursor-pointer p-1 -m-1"
                          >
                            <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

const MARGIN_META = {
  green: { icon: CheckmarkCircle02Icon, text: "text-success", bg: "bg-success-muted", label: "Full margin" },
  yellow: { icon: Alert02Icon, text: "text-warning", bg: "bg-warning-muted", label: "Discounted, still profitable" },
  red: { icon: CancelCircleIcon, text: "text-danger", bg: "bg-danger-muted", label: "Below cost" },
} as const;

function MarginSignal({
  state,
  margin,
  discountPct,
  empty,
}: {
  state: "green" | "yellow" | "red";
  margin: number;
  discountPct: number;
  empty: boolean;
}) {
  if (empty) {
    return (
      <div className="rounded-3xl p-5 bg-hover">
        <p className="text-sm text-secondary">Enter your offer to check the margin.</p>
      </div>
    );
  }

  const meta = MARGIN_META[state];
  const sub =
    state === "green"
      ? "At or above your quote price."
      : state === "yellow"
        ? `${discountPct.toFixed(1)}% off, still above cost.`
        : "This offer loses money.";

  return (
    <motion.div
      key={state}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className={cn("rounded-3xl p-5", meta.bg)}
    >
      <div className={cn("flex items-center gap-2", meta.text)}>
        <HugeiconsIcon icon={meta.icon} size={16} strokeWidth={1.5} />
        <span className="text-xs font-semibold uppercase tracking-wide">{meta.label}</span>
      </div>
      <p className={cn("font-mono text-3xl font-bold mt-2 tabular-nums", meta.text)}>
        {peso(margin)}
      </p>
      <p className="text-xs text-secondary mt-1">{sub}</p>
    </motion.div>
  );
}

function Figure({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-tertiary mb-1">{label}</p>
      <p className={cn("font-mono text-base font-semibold tabular-nums", muted ? "text-secondary" : "text-primary")}>
        {value}
      </p>
    </div>
  );
}
