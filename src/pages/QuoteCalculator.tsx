import { useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useSettings } from "../hooks/useSettings";
import { CATEGORY_CONFIG, type ItemCategory, DEFAULTS, FORWARDER_BUY_DEFAULT_COMMISSION_PERCENT, FORWARDER_BUY_QC_FEE_PHP } from "../lib/constants";
import { cn } from "../lib/utils";

type CalcMode = "regular" | "forwarder";

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "shoes", label: CATEGORY_CONFIG.shoes.label },
  { value: "clothes", label: CATEGORY_CONFIG.clothes.label },
  { value: "watches_accessories", label: CATEGORY_CONFIG.watches_accessories.label },
];

export default function QuoteCalculator() {
  const { settings } = useSettings();

  const [priceCNY, setPriceCNY] = useState(0);
  const [localShippingCNY, setLocalShippingCNY] = useState(10);
  const [mode, setMode] = useState<CalcMode>("regular");
  const [category, setCategory] = useState<ItemCategory>("shoes");

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

  return (
    <PageContainer>
      <div className="max-w-lg mx-auto space-y-6">
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
                  ₱{customerQuote.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
      </div>
    </PageContainer>
  );
}
