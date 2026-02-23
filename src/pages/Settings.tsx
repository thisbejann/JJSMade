import { useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useSettings } from "../hooks/useSettings";
import toast from "react-hot-toast";

export default function Settings() {
  const { settings, isLoading, updateSettings } = useSettings();

  const [rateOverride, setRateOverride] = useState<number | undefined>(
    undefined
  );
  const [forwarderBuyServiceRateOverride, setForwarderBuyServiceRateOverride] =
    useState<number | undefined>(undefined);
  const [forwarderRateOverride, setForwarderRateOverride] = useState<
    number | undefined
  >(undefined);
  const [markupMinOverride, setMarkupMinOverride] = useState<
    number | undefined
  >(undefined);
  const [markupMaxOverride, setMarkupMaxOverride] = useState<
    number | undefined
  >(undefined);
  const [saving, setSaving] = useState(false);

  const rate = rateOverride ?? settings.cnyToPhpRate;
  const forwarderBuyServiceRate =
    forwarderBuyServiceRateOverride ??
    settings.forwarderBuyServiceRate ??
    8.6;
  const forwarderRate = forwarderRateOverride ?? settings.defaultForwarderRate;
  const markupMin = markupMinOverride ?? settings.defaultMarkupMin;
  const markupMax = markupMaxOverride ?? settings.defaultMarkupMax;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        cnyToPhpRate: rate,
        forwarderBuyServiceRate,
        defaultForwarderRate: forwarderRate,
        defaultMarkupMin: markupMin,
        defaultMarkupMax: markupMax,
      });
      setRateOverride(undefined);
      setForwarderBuyServiceRateOverride(undefined);
      setForwarderRateOverride(undefined);
      setMarkupMinOverride(undefined);
      setMarkupMaxOverride(undefined);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-secondary">Loading...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">
              Exchange Rate
            </h2>
            <Input
              label="CNY to PHP Rate"
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRateOverride(Number(e.target.value))}
            />
            <p className="text-xs text-secondary">
              CNY 1 = PHP {rate.toFixed(2)}. This rate is used for new items.
              Existing items keep their original snapshot rate.
            </p>

            <Input
              label="Forwarder Buy Service Rate (CNY to PHP)"
              type="number"
              step="0.01"
              value={forwarderBuyServiceRate}
              onChange={(e) =>
                setForwarderBuyServiceRateOverride(Number(e.target.value))
              }
            />
            <p className="text-xs text-secondary">
              Used only for forwarder-buy service charges (10% commission + 10
              CNY fee). Existing items keep their original snapshot rate.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">
              Forwarder Defaults
            </h2>
            <Input
              label="Default Forwarder Rate (PHP/kg)"
              type="number"
              prefix="PHP"
              value={forwarderRate}
              onChange={(e) => setForwarderRateOverride(Number(e.target.value))}
            />
            <p className="text-xs text-secondary">
              This pre-fills the forwarder rate when adding new items.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">
              Markup Targets
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Minimum Target (PHP)"
                type="number"
                prefix="PHP"
                value={markupMin}
                onChange={(e) => setMarkupMinOverride(Number(e.target.value))}
              />
              <Input
                label="Maximum Target (PHP)"
                type="number"
                prefix="PHP"
                value={markupMax}
                onChange={(e) => setMarkupMaxOverride(Number(e.target.value))}
              />
            </div>
            <p className="text-xs text-secondary">
              Used for the markup indicator when setting selling prices.
            </p>
          </CardContent>
        </Card>

        <Button onClick={handleSave} size="lg" className="w-full" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </PageContainer>
  );
}
