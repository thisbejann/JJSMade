import { useState } from "react";
import { Card, CardContent } from "../ui/Card";
import { Input } from "../ui/Input";
import { useSettings } from "../../hooks/useSettings";
import {
  ALL_CATEGORIES,
  CATEGORY_CONFIG,
  FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT,
} from "../../lib/constants";
import { formatKgValue, formatNetPHP } from "../../lib/formatters";
import { quoteLine, weightClassFor, type ChinaQuoteInput, type QuoteMode } from "../../lib/pricing";
import { Segmented } from "../ui/Segmented";
import { DEFAULT_CLASS_CHOICE, parseEuSize, type ClassChoice } from "../../lib/weightClassPickers";
import { ShippingEstimatePicker } from "./ShippingEstimatePicker";

interface PriceCalculatorProps {
  /** The form's values. The calculator follows them until you pick something else here. */
  priceCNY?: number;
  category: ChinaCategory;
  isForwarderBuy: boolean;
  /** The form's EU size (Shoes only), used when the calculator's EU size is empty. */
  euSize?: string;
}

// Local CN shipping the quote assumes, same default as the Quote Calculator.
const QUOTE_LOCAL_SHIPPING_CNY = 10;

// China route only: a watch is quoted from its Trusted Dealer, so the item form hides this calculator for Watches.
type ChinaCategory = ChinaQuoteInput["category"];
const CATEGORIES = ALL_CATEGORIES.filter((c): c is ChinaCategory => c !== "watches").map((value) => ({
  value,
  label: CATEGORY_CONFIG[value].label,
}));
const MODES: { value: QuoteMode; label: string }[] = [
  { value: "regular", label: "Regular Order" },
  { value: "forwarder", label: "Bought by Forwarder" },
];

export function PriceCalculator({
  priceCNY: formPriceCNY = 0,
  category: formCategory,
  isForwarderBuy,
  euSize: formEuSizeStr = "",
}: PriceCalculatorProps) {
  const { settings } = useSettings();

  // Null / 0 means "not overridden": follow the form.
  const [calcPriceCNY, setCalcPriceCNY] = useState(0);
  const [modeOverride, setModeOverride] = useState<QuoteMode | null>(null);
  const [categoryOverride, setCategoryOverride] = useState<ChinaCategory | null>(null);
  const [classChoice, setClassChoice] = useState<ClassChoice>(DEFAULT_CLASS_CHOICE);
  const [euSizeStr, setEuSizeStr] = useState("");

  const priceCNY = calcPriceCNY > 0 ? calcPriceCNY : formPriceCNY;
  const mode = modeOverride ?? (isForwarderBuy ? "forwarder" : "regular");
  const category = categoryOverride ?? formCategory;

  const rate = mode === "regular" ? settings.cnyToPhpRate : settings.forwarderBuyServiceRate;
  const ratePerKg = settings.defaultForwarderRate;
  const profitTarget = settings.calculatorProfitTarget;
  // Clearing the field reverts to the form's size
  const effectiveEuSizeStr = euSizeStr.trim() || formEuSizeStr.trim();
  const euSize = parseEuSize(effectiveEuSizeStr);

  const line = quoteLine({
    priceCNY,
    localShippingCNY: QUOTE_LOCAL_SHIPPING_CNY,
    mode,
    rate,
    category,
    weightClass: weightClassFor(category, { ...classChoice, euSize }),
    ratePerKg,
    profitTarget,
  });

  const formulaParts = [`(${priceCNY} + ${QUOTE_LOCAL_SHIPPING_CNY}) × ${rate.toFixed(2)}`];
  if (mode === "forwarder") {
    formulaParts.push(
      `+ ${FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT}% commission: ${line.commissionCNY.toFixed(2)} × ${rate.toFixed(2)}`,
      `+ QC fee: ${line.qcFee}`
    );
  }
  if (line.estimatedWeightKg !== null) {
    formulaParts.push(`+ shipping: ${formatKgValue(line.estimatedWeightKg)} kg × ${ratePerKg}`);
  }
  formulaParts.push(`+ profit target: ${profitTarget}`);

  return (
    <Card>
      <CardContent className="space-y-4">
        <h2 className="font-display font-semibold text-base text-primary">Price Calculator</h2>

        <Input
          label="Item Price (CNY)"
          type="number"
          value={priceCNY || ""}
          onChange={(e) => {
            const val = Number(e.target.value);
            // Clearing the field reverts to the form's price
            setCalcPriceCNY(val > 0 ? val : 0);
          }}
          step="0.01"
          prefix="CNY"
          placeholder="0.00"
        />

        <Segmented label="Mode" options={MODES} value={mode} onChange={setModeOverride} />

        <div>
          <label className="block text-xs font-medium text-secondary mb-2">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                aria-pressed={category === cat.value}
                onClick={() => setCategoryOverride(cat.value)}
                className={[
                  "px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border text-center",
                  category === cat.value
                    ? "border-accent bg-accent-muted text-accent"
                    : "border-border-default text-secondary hover:border-border-strong hover:bg-hover",
                ].join(" ")}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <ShippingEstimatePicker
          category={category}
          choice={classChoice}
          onChange={setClassChoice}
          euSizeStr={effectiveEuSizeStr}
          onEuSizeChange={setEuSizeStr}
        />

        {priceCNY > 0 ? (
          <div className="rounded-lg bg-accent-muted px-3 py-3 space-y-2">
            <div className="space-y-0.5">
              {formulaParts.map((part, i) => (
                <p key={i} className="text-[11px] text-secondary font-mono">{part}</p>
              ))}
            </div>
            <p className="font-mono text-lg font-semibold text-accent">
              Charge customer: {formatNetPHP(line.quote)}
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-surface px-3 py-3 border border-border-subtle">
            <p className="text-xs text-tertiary">Enter a CNY price to see the suggested selling price.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
