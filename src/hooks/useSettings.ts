import { useQuery, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { DEFAULTS } from "../lib/constants";

export function useSettings() {
  const settings = useQuery(api.settings.get);
  const initialize = useMutation(api.settings.initialize);
  const updateSettings = useMutation(api.settings.update);

  useEffect(() => {
    if (settings === null) {
      initialize();
    }
  }, [settings, initialize]);

  return {
    settings: settings ?? {
      cnyToPhpRate: DEFAULTS.exchangeRate,
      defaultForwarderRate: DEFAULTS.forwarderRate,
      defaultMarkupMin: DEFAULTS.markupMin,
      defaultMarkupMax: DEFAULTS.markupMax,
      updatedAt: Date.now(),
    },
    isLoading: settings === undefined,
    updateSettings,
  };
}
