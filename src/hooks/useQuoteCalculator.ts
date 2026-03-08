import { useMemo } from "react";
import {
  DEFAULTS,
  type ItemCategory,
} from "../lib/constants";
import type { AppSettings } from "./useSettings";

type CalculatorMarkupSettings = Pick<
  AppSettings,
  | "calculatorMarkupShoes"
  | "calculatorMarkupClothes"
  | "calculatorMarkupWatchesAccessories"
>;

export function getCalculatorMarkupMap(
  settings: CalculatorMarkupSettings
): Record<ItemCategory, number> {
  return {
    shoes: settings.calculatorMarkupShoes,
    clothes: settings.calculatorMarkupClothes,
    watches_accessories: settings.calculatorMarkupWatchesAccessories,
  };
}

interface UseQuoteCalculatorInput {
  category: ItemCategory;
  totalCost: number;
  settings: CalculatorMarkupSettings;
}

export function useQuoteCalculator({
  category,
  totalCost,
  settings,
}: UseQuoteCalculatorInput) {
  return useMemo(() => {
    const markups = getCalculatorMarkupMap(settings);
    const selectedMarkup =
      markups[category] ??
      (category === "clothes"
        ? DEFAULTS.calculatorMarkupClothes
        : category === "watches_accessories"
          ? DEFAULTS.calculatorMarkupWatchesAccessories
          : DEFAULTS.calculatorMarkupShoes);
    const customerQuote = round(totalCost + selectedMarkup);

    return {
      markups,
      selectedMarkup: round(selectedMarkup),
      customerQuote,
    };
  }, [
    category,
    totalCost,
    settings.calculatorMarkupClothes,
    settings.calculatorMarkupShoes,
    settings.calculatorMarkupWatchesAccessories,
  ]);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
