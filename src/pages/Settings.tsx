import { useState, useEffect } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useSettings } from "../hooks/useSettings";
import toast from "react-hot-toast";

export default function Settings() {
  const { settings, isLoading, updateSettings } = useSettings();

  const [rate, setRate] = useState(settings.cnyToPhpRate);
  const [forwarderRate, setForwarderRate] = useState(settings.defaultForwarderRate);
  const [markupMin, setMarkupMin] = useState(settings.defaultMarkupMin);
  const [markupMax, setMarkupMax] = useState(settings.defaultMarkupMax);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setRate(settings.cnyToPhpRate);
      setForwarderRate(settings.defaultForwarderRate);
      setMarkupMin(settings.defaultMarkupMin);
      setMarkupMax(settings.defaultMarkupMax);
    }
  }, [isLoading, settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        cnyToPhpRate: rate,
        defaultForwarderRate: forwarderRate,
        defaultMarkupMin: markupMin,
        defaultMarkupMax: markupMax,
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  if (isLoading) return <PageContainer><p className="text-secondary">Loading...</p></PageContainer>;

  return (
    <PageContainer>
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">Exchange Rate</h2>
            <Input
              label="CNY → PHP Rate"
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
            <p className="text-xs text-secondary">
              ¥1 = ₱{rate.toFixed(2)} — This rate will be used for new items. Existing items keep the rate they were created with.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">Forwarder Defaults</h2>
            <Input
              label="Default Forwarder Rate (PHP/kg)"
              type="number"
              prefix="₱"
              value={forwarderRate}
              onChange={(e) => setForwarderRate(Number(e.target.value))}
            />
            <p className="text-xs text-secondary">
              This will pre-fill the forwarder rate when adding new items.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-display font-semibold text-base text-primary">Markup Targets</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Minimum Target (PHP)"
                type="number"
                prefix="₱"
                value={markupMin}
                onChange={(e) => setMarkupMin(Number(e.target.value))}
              />
              <Input
                label="Maximum Target (PHP)"
                type="number"
                prefix="₱"
                value={markupMax}
                onChange={(e) => setMarkupMax(Number(e.target.value))}
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
