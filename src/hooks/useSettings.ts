import { useQuery, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { DEFAULTS } from "../lib/constants";

export interface AppSettings {
  cnyToPhpRate: number;
  forwarderBuyServiceRate: number;
  defaultForwarderRate: number;
  defaultMarkupMin: number;
  defaultMarkupMax: number;
  calculatorProfitTarget: number;
  calculatorWatchesProfitTarget: number;
  updatedAt: number;
}

export function useSettings() {
  const settings = useQuery(api.settings.get);
  const initialize = useMutation(api.settings.initialize);
  const updateSettings = useMutation(api.settings.update);

  useEffect(() => {
    if (
      settings === null ||
      (settings !== undefined &&
        (settings.calculatorProfitTarget === undefined ||
          settings.calculatorWatchesProfitTarget === undefined))
    ) {
      initialize();
    }
  }, [settings, initialize]);

  const fallbackSettings: AppSettings = {
    cnyToPhpRate: DEFAULTS.exchangeRate,
    forwarderBuyServiceRate: DEFAULTS.forwarderBuyServiceRate,
    defaultForwarderRate: DEFAULTS.forwarderRate,
    defaultMarkupMin: DEFAULTS.markupMin,
    defaultMarkupMax: DEFAULTS.markupMax,
    calculatorProfitTarget: DEFAULTS.calculatorProfitTarget,
    calculatorWatchesProfitTarget: DEFAULTS.calculatorWatchesProfitTarget,
    updatedAt: 0,
  };

  return {
    settings: settings
      ? {
          cnyToPhpRate: settings.cnyToPhpRate,
          forwarderBuyServiceRate:
            settings.forwarderBuyServiceRate ??
            DEFAULTS.forwarderBuyServiceRate,
          defaultForwarderRate: settings.defaultForwarderRate,
          defaultMarkupMin: settings.defaultMarkupMin,
          defaultMarkupMax: settings.defaultMarkupMax,
          calculatorProfitTarget:
            settings.calculatorProfitTarget ?? DEFAULTS.calculatorProfitTarget,
          calculatorWatchesProfitTarget:
            settings.calculatorWatchesProfitTarget ??
            DEFAULTS.calculatorWatchesProfitTarget,
          updatedAt: settings.updatedAt,
        }
      : fallbackSettings,
    isLoading: settings === undefined,
    updateSettings,
  };
}
