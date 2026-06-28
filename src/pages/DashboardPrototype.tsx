import { useSearchParams } from "react-router";
import { PageContainer } from "../components/layout/PageContainer";
import { cn } from "../lib/utils";
import { VariantLedger } from "./dashboard-variants/VariantLedger";
import { VariantConsole } from "./dashboard-variants/VariantConsole";
import { VariantFocus } from "./dashboard-variants/VariantFocus";

const VARIANTS = [
  { id: "ledger", label: "Ledger", hint: "Editorial · borderless", Component: VariantLedger },
  { id: "console", label: "Console", hint: "Terminal · dense", Component: VariantConsole },
  { id: "focus", label: "Focus", hint: "Warm · tonal", Component: VariantFocus },
] as const;

type VariantId = (typeof VARIANTS)[number]["id"];

/**
 * Temporary side-by-comparison harness for the dashboard overhaul. Pick a style
 * from the switcher; the choice is held in the URL (?v=) so a reload keeps it.
 * Once a direction is chosen, the winning variant graduates into Dashboard.tsx
 * and this file plus dashboard-variants/ get deleted.
 */
export default function DashboardPrototype() {
  const [params, setParams] = useSearchParams();
  const active = (params.get("v") as VariantId) ?? "ledger";
  const current = VARIANTS.find((v) => v.id === active) ?? VARIANTS[0];
  const Active = current.Component;

  return (
    <PageContainer>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-2xl bg-surface p-1 ring-1 ring-border-subtle">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              onClick={() => setParams({ v: v.id }, { replace: true })}
              className={cn(
                "cursor-pointer rounded-xl px-3.5 py-1.5 text-sm font-medium transition-colors",
                v.id === active
                  ? "bg-accent text-[#fef3ec]"
                  : "text-secondary hover:text-primary"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-tertiary">{current.hint}</p>
      </div>

      <Active />
    </PageContainer>
  );
}
