// PROTOTYPE, throw away. Question: what should the watch order form look like,
// especially the TD Picker with inline "Create TD"?
// Three variants on /orders/new?variant=A|B|C. Stub data in memory, no Convex writes.
import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { LockIcon, PlusSignIcon, Watch01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "../ui/Card";
import { Input } from "../ui/Input";
import { Toggle } from "../ui/Toggle";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { PrototypeSwitcher } from "../ui/PrototypeSwitcher";
import { cn } from "@/lib/utils";

// ---------- stub domain ----------
type TD = { name: string; shippingCNY: number; insurancePct: number };

const SEED_TDS: TD[] = [
  { name: "Geektime", shippingCNY: 250, insurancePct: 10 },
  { name: "Ivy Watch", shippingCNY: 300, insurancePct: 8 },
  { name: "Trusty Time", shippingCNY: 220, insurancePct: 12 },
];
const RATE = 8.1; // CNY→PHP, from Settings

function useWatchState() {
  const [tds, setTds] = useState<TD[]>(SEED_TDS);
  const [tdName, setTdName] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [priceCNY, setPriceCNY] = useState(2800);
  const [rate, setRate] = useState(RATE);
  const [insured, setInsured] = useState(true);
  const [sellingPrice, setSellingPrice] = useState(29000);

  const td = tds.find((t) => t.name === tdName) ?? null;
  const costs = useMemo(() => {
    const price = priceCNY * rate;
    const shipping = td ? td.shippingCNY * rate : 0;
    const insurance = td && insured ? priceCNY * (td.insurancePct / 100) * rate : 0;
    const total = price + shipping + insurance;
    return { price, shipping, insurance, total, profit: sellingPrice - total };
  }, [priceCNY, rate, td, insured, sellingPrice]);

  const createTd = (t: TD) => {
    setTds((prev) => [...prev, t]);
    setTdName(t.name);
  };

  return {
    tds, td, tdName, setTdName, createTd,
    name, setName, priceCNY, setPriceCNY, rate, setRate,
    insured, setInsured, sellingPrice, setSellingPrice, costs,
  };
}
type S = ReturnType<typeof useWatchState>;

const php = (n: number) => `₱${Math.round(n).toLocaleString()}`;
const cny = (n: number) => `¥${n.toLocaleString()}`;

function StateDump({ s }: { s: S }) {
  return (
    <pre className="mt-6 rounded-2xl bg-black/40 p-3 text-[11px] text-muted-foreground font-mono overflow-x-auto">
      {JSON.stringify(
        {
          item: { category: "watches", seller: s.tdName, priceCNY: s.priceCNY, exchangeRateUsed: s.rate, insured: s.insured,
            tdShippingCNY: s.td?.shippingCNY, tdInsurancePct: s.td?.insurancePct, sellingPrice: s.sellingPrice },
          costs: Object.fromEntries(Object.entries(s.costs).map(([k, v]) => [k, Math.round(v)])),
          tds: s.tds,
        },
        null, 2,
      )}
    </pre>
  );
}

function NewTdFields({ initialName, onSave, onCancel, compact }: {
  initialName: string; onSave: (t: TD) => void; onCancel: () => void; compact?: boolean;
}) {
  const [n, setN] = useState(initialName);
  const [ship, setShip] = useState<number | "">("");
  const [ins, setIns] = useState<number | "">("");
  const ok = n.trim() && ship !== "" && ins !== "";
  return (
    <div className="space-y-3">
      <div className={cn("grid gap-3", compact ? "grid-cols-3" : "grid-cols-1")}>
        <Input label="TD name" value={n} onChange={(e) => setN(e.target.value)} />
        <Input label="Shipping" prefix="¥" type="number" value={ship} onChange={(e) => setShip(e.target.value === "" ? "" : Number(e.target.value))} />
        <Input label="Insurance" suffix="%" type="number" value={ins} onChange={(e) => setIns(e.target.value === "" ? "" : Number(e.target.value))} />
      </div>
      <p className="text-xs text-muted-foreground">These become the TD's fixed rates. Change them later from the TD's settings only.</p>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>Cancel</Button>
        <Button size="sm" type="button" disabled={!ok} onClick={() => onSave({ name: n.trim(), shippingCNY: Number(ship), insurancePct: Number(ins) })}>
          Save TD
        </Button>
      </div>
    </div>
  );
}

function LockedRate({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
      <HugeiconsIcon icon={LockIcon} size={12} className="text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </span>
  );
}

// ---------- Variant A: inline picker, create expands under the field ----------
function VariantA({ s }: { s: S }) {
  const [query, setQuery] = useState(s.tdName ?? "");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const matches = s.tds.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));
  const exact = s.tds.some((t) => t.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-xl font-semibold">New Watch Order</h1>
      {/* Card clips overflow by default, which cut off the TD dropdown. */}
      <Card className="overflow-visible"><CardContent className="space-y-4">
        <Input label="Item Name *" value={s.name} onChange={(e) => s.setName(e.target.value)} placeholder="e.g. Sub 126610LN Clean" />

        <div className="relative space-y-1.5">
          <label className="text-sm text-muted-foreground">Trusted Dealer *</label>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); s.setTdName(null); setOpen(true); setCreating(false); }}
            onFocus={() => setOpen(true)}
            placeholder="Search TDs"
            className="h-9 w-full rounded-3xl bg-input/50 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          />
          {open && !creating && (
            <div className="absolute z-50 left-0 right-0 mt-1 rounded-3xl bg-popover/90 backdrop-blur-2xl ring-1 ring-foreground/10 p-1.5 shadow-lg">
              {matches.map((t) => (
                <button key={t.name} type="button" onClick={() => { s.setTdName(t.name); setQuery(t.name); setOpen(false); }}
                  className="w-full flex justify-between px-3 py-2 rounded-2xl text-sm hover:bg-foreground/5 cursor-pointer">
                  <span>{t.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{cny(t.shippingCNY)} ship · {t.insurancePct}% ins</span>
                </button>
              ))}
              {query.trim() && !exact && (
                <button type="button" onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-sm text-accent hover:bg-accent/10 cursor-pointer">
                  <HugeiconsIcon icon={PlusSignIcon} size={14} /> Create TD "{query.trim()}"
                </button>
              )}
            </div>
          )}
        </div>

        {creating && (
          <div className="rounded-3xl ring-1 ring-accent/40 bg-accent/5 p-4">
            <NewTdFields compact initialName={query.trim()}
              onCancel={() => setCreating(false)}
              onSave={(t) => { s.createTd(t); setQuery(t.name); setCreating(false); setOpen(false); }} />
          </div>
        )}

        {s.td && (
          <div className="flex flex-wrap gap-2">
            <LockedRate label="Shipping" value={cny(s.td.shippingCNY)} />
            <LockedRate label="Insurance" value={`${s.td.insurancePct}%`} />
          </div>
        )}
      </CardContent></Card>

      <Card><CardContent className="space-y-4">
        <h2 className="font-display font-semibold text-base">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Watch Price *" prefix="¥" type="number" value={s.priceCNY || ""} onChange={(e) => s.setPriceCNY(Number(e.target.value))} />
          <Input label="Exchange Rate (CNY to PHP)" type="number" value={s.rate} onChange={(e) => s.setRate(Number(e.target.value))} />
        </div>
        <Toggle label="Insurance" description={s.td ? `${s.td.insurancePct}% of watch price` : "Pick a TD first"} checked={s.insured} onChange={s.setInsured} />
        <Input label="Selling Price" prefix="₱" type="number" value={s.sellingPrice || ""} onChange={(e) => s.setSellingPrice(Number(e.target.value))} />
        <div className="divide-y divide-border rounded-2xl bg-muted/40 text-sm">
          {[["Watch", s.costs.price], ["TD shipping", s.costs.shipping], ["Insurance", s.costs.insurance]].map(([l, v]) => (
            <div key={l as string} className="flex justify-between px-4 py-2"><span className="text-muted-foreground">{l}</span><span className="tabular-nums">{php(v as number)}</span></div>
          ))}
          <div className="flex justify-between px-4 py-2 font-medium"><span>Total cost</span><span className="tabular-nums">{php(s.costs.total)}</span></div>
          <div className="flex justify-between px-4 py-2 font-semibold text-accent"><span>Profit</span><span className="tabular-nums">{php(s.costs.profit)}</span></div>
        </div>
      </CardContent></Card>
      <StateDump s={s} />
    </div>
  );
}

// ---------- Variant B: two-column, dealer + landed-cost receipt on the right, create via modal ----------
function VariantB({ s }: { s: S }) {
  const [modal, setModal] = useState(false);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <h1 className="font-display text-xl font-semibold">New Watch Order</h1>
        <Card><CardContent className="space-y-4">
          <Input label="Item Name *" value={s.name} onChange={(e) => s.setName(e.target.value)} placeholder="e.g. Sub 126610LN Clean" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Watch Price *" prefix="¥" type="number" value={s.priceCNY || ""} onChange={(e) => s.setPriceCNY(Number(e.target.value))} />
            <Input label="Exchange Rate (CNY to PHP)" type="number" value={s.rate} onChange={(e) => s.setRate(Number(e.target.value))} />
          </div>
          <Input label="Selling Price" prefix="₱" type="number" value={s.sellingPrice || ""} onChange={(e) => s.setSellingPrice(Number(e.target.value))} />
        </CardContent></Card>
        <StateDump s={s} />
      </div>

      <aside className="lg:sticky lg:top-6 h-fit space-y-4">
        <Card size="sm"><CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Trusted Dealer</span>
            <Button variant="link" size="xs" type="button" onClick={() => setModal(true)}>+ New TD</Button>
          </div>
          <select value={s.tdName ?? ""} onChange={(e) => s.setTdName(e.target.value || null)}
            className="h-9 w-full rounded-3xl bg-input/50 px-3 text-sm outline-none">
            <option value="">Select a TD…</option>
            {s.tds.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
          {s.td && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <HugeiconsIcon icon={LockIcon} size={11} /> Rates fixed by TD settings
            </p>
          )}
        </CardContent></Card>

        <Card size="sm"><CardContent className="font-mono text-xs space-y-1.5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground pb-2">Landed cost</div>
          <Row l={`Watch  ${cny(s.priceCNY)} × ${s.rate}`} r={php(s.costs.price)} />
          <Row l={`Shipping  ${s.td ? cny(s.td.shippingCNY) : "-"}`} r={php(s.costs.shipping)} />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={s.insured} onChange={(e) => s.setInsured(e.target.checked)} className="accent-[#e07850]" />
              Insurance {s.td ? `${s.td.insurancePct}%` : ""}
            </label>
            <span className={cn("tabular-nums", !s.insured && "line-through text-muted-foreground")}>{php(s.costs.insurance)}</span>
          </div>
          <div className="border-t border-dashed border-border my-2" />
          <Row l="Total" r={php(s.costs.total)} bold />
          <Row l="Sell" r={php(s.sellingPrice)} />
          <div className={cn("flex justify-between text-sm font-semibold pt-1", s.costs.profit >= 0 ? "text-accent" : "text-destructive")}>
            <span>Profit</span><span className="tabular-nums">{php(s.costs.profit)}</span>
          </div>
        </CardContent></Card>
      </aside>

      <Modal open={modal} onClose={() => setModal(false)} title="Register Trusted Dealer">
        <NewTdFields initialName="" onCancel={() => setModal(false)} onSave={(t) => { s.createTd(t); setModal(false); }} />
      </Modal>
    </div>
  );
}
function Row({ l, r, bold }: { l: string; r: string; bold?: boolean }) {
  return <div className={cn("flex justify-between", bold && "font-semibold text-sm")}><span>{l}</span><span className="tabular-nums">{r}</span></div>;
}

// ---------- Variant C: TD-first tiles, then details, sticky cost bar ----------
function VariantC({ s }: { s: S }) {
  const [creating, setCreating] = useState(false);
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-28">
      <section className="space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-mono text-accent">01</span>
          <h2 className="font-display text-lg font-semibold">Which dealer?</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {s.tds.map((t) => {
            const active = t.name === s.tdName;
            return (
              <button key={t.name} type="button" onClick={() => s.setTdName(t.name)}
                className={cn("text-left rounded-3xl p-4 ring-1 transition-all cursor-pointer",
                  active ? "ring-accent bg-accent/10" : "ring-foreground/10 hover:ring-foreground/25 bg-card")}>
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2"><HugeiconsIcon icon={Watch01Icon} size={16} />{t.name}</span>
                  {active && <HugeiconsIcon icon={Tick02Icon} size={16} className="text-accent" />}
                </div>
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground tabular-nums">
                  <span><span className="block text-foreground text-sm">{cny(t.shippingCNY)}</span>ship</span>
                  <span><span className="block text-foreground text-sm">{t.insurancePct}%</span>insurance</span>
                </div>
              </button>
            );
          })}
          {creating ? (
            <div className="sm:col-span-3 rounded-3xl ring-1 ring-accent/40 bg-accent/5 p-4">
              <NewTdFields compact initialName="" onCancel={() => setCreating(false)} onSave={(t) => { s.createTd(t); setCreating(false); }} />
            </div>
          ) : (
            <button type="button" onClick={() => setCreating(true)}
              className="rounded-3xl p-4 border border-dashed border-foreground/20 text-muted-foreground hover:text-accent hover:border-accent/50 flex items-center justify-center gap-2 cursor-pointer">
              <HugeiconsIcon icon={PlusSignIcon} size={16} /> New TD
            </button>
          )}
        </div>
      </section>

      <section className={cn("space-y-3 transition-opacity", !s.td && "opacity-40 pointer-events-none")}>
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-mono text-accent">02</span>
          <h2 className="font-display text-lg font-semibold">The watch</h2>
        </div>
        <Card><CardContent className="space-y-4">
          <Input label="Item Name *" value={s.name} onChange={(e) => s.setName(e.target.value)} placeholder="e.g. Sub 126610LN Clean" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Watch Price *" prefix="¥" type="number" value={s.priceCNY || ""} onChange={(e) => s.setPriceCNY(Number(e.target.value))} />
            <Input label="Rate" type="number" value={s.rate} onChange={(e) => s.setRate(Number(e.target.value))} />
            <Input label="Selling Price" prefix="₱" type="number" value={s.sellingPrice || ""} onChange={(e) => s.setSellingPrice(Number(e.target.value))} />
          </div>
          <Toggle label="Insured against seizure" description="TD replaces the watch if customs seizes it" checked={s.insured} onChange={s.setInsured} />
        </CardContent></Card>
        <StateDump s={s} />
      </section>

      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[min(720px,92vw)] rounded-full bg-card/90 backdrop-blur-xl ring-1 ring-foreground/10 shadow-2xl px-5 py-2.5 flex items-center justify-between text-xs tabular-nums">
        <span className="text-muted-foreground">Watch <b className="text-foreground">{php(s.costs.price)}</b></span>
        <span className="text-muted-foreground">+ Ship <b className="text-foreground">{php(s.costs.shipping)}</b></span>
        <span className="text-muted-foreground">+ Ins <b className="text-foreground">{php(s.costs.insurance)}</b></span>
        <span>= <b>{php(s.costs.total)}</b></span>
        <span className={cn("font-semibold text-sm", s.costs.profit >= 0 ? "text-accent" : "text-destructive")}>{php(s.costs.profit)}</span>
      </div>
    </div>
  );
}

// ---------- switcher ----------
const VARIANTS = [
  { key: "A", name: "Inline picker" },
  { key: "B", name: "Dealer side-panel" },
  { key: "C", name: "TD-first tiles" },
];

export function TdWatchFormPrototype({ variant }: { variant: string }) {
  const s = useWatchState();
  return (
    <>
      {variant === "A" && <VariantA s={s} />}
      {variant === "B" && <VariantB s={s} />}
      {variant === "C" && <VariantC s={s} />}
      <PrototypeSwitcher variants={VARIANTS} />
    </>
  );
}
