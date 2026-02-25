import { useState } from "react";
import { Card, CardContent } from "../ui/Card";
import { Input } from "../ui/Input";

interface PriceCalculatorProps {
  cnyToPhpRate: number;
  forwarderBuyServiceRate: number;
  priceCNY?: number;
}

type CalcMode = "regular" | "forwarder";
type CalcCategory = "shoes_accessories" | "clothes";

const MARKUP: Record<CalcCategory, number> = {
  shoes_accessories: 850,
  clothes: 750,
};

export function PriceCalculator({ cnyToPhpRate, forwarderBuyServiceRate, priceCNY: formPriceCNY = 0 }: PriceCalculatorProps) {
  // 0 means "not overridden" — fall back to the form's priceCNY
  const [calcPriceCNY, setCalcPriceCNY] = useState(0);
  const [calcMode, setCalcMode] = useState<CalcMode>("regular");
  const [calcCategory, setCalcCategory] = useState<CalcCategory>("shoes_accessories");

  const effectivePriceCNY = calcPriceCNY > 0 ? calcPriceCNY : formPriceCNY;
  const markup = MARKUP[calcCategory];

  let result = 0;
  let formulaBreakdown = "";

  if (effectivePriceCNY > 0) {
    if (calcMode === "regular") {
      result = (effectivePriceCNY + 10) * cnyToPhpRate + markup;
      formulaBreakdown = `(${effectivePriceCNY} + 10) × ${cnyToPhpRate.toFixed(2)} + ${markup}`;
    } else {
      result = (effectivePriceCNY + 10 + effectivePriceCNY * 0.1) * forwarderBuyServiceRate + 150 + markup;
      formulaBreakdown = `(${effectivePriceCNY} + 10 + ${(effectivePriceCNY * 0.1).toFixed(2)}) × ${forwarderBuyServiceRate.toFixed(2)} + 150 + ${markup}`;
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <h2 className="font-display font-semibold text-base text-primary">
          Price Calculator
        </h2>

        <Input
          label="Item Price (CNY)"
          type="number"
          value={effectivePriceCNY || ""}
          onChange={(e) => {
            const val = Number(e.target.value);
            // Clearing the field reverts to the form's price
            setCalcPriceCNY(val > 0 ? val : 0);
          }}
          step="0.01"
          prefix="CNY"
          placeholder="0.00"
        />

        <div>
          <label className="block text-xs font-medium text-secondary mb-2">Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {(["regular", "forwarder"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCalcMode(mode)}
                className={[
                  "px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border",
                  calcMode === mode
                    ? "border-accent bg-accent-muted text-accent"
                    : "border-border-default text-secondary hover:border-border-strong hover:bg-hover",
                ].join(" ")}
              >
                {mode === "regular" ? "Regular Order" : "Bought by Forwarder"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-2">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {(["shoes_accessories", "clothes"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCalcCategory(cat)}
                className={[
                  "px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border",
                  calcCategory === cat
                    ? "border-accent bg-accent-muted text-accent"
                    : "border-border-default text-secondary hover:border-border-strong hover:bg-hover",
                ].join(" ")}
              >
                {cat === "shoes_accessories" ? "Shoes / Accessories" : "Clothes"}
                <span className="ml-1 opacity-60">(+{MARKUP[cat]})</span>
              </button>
            ))}
          </div>
        </div>

        {effectivePriceCNY > 0 ? (
          <div className="rounded-lg bg-accent-muted px-3 py-3 space-y-1">
            <p className="text-xs text-secondary font-mono">{formulaBreakdown}</p>
            <p className="font-mono text-lg font-semibold text-accent">
              Charge customer: PHP{" "}
              {result.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
