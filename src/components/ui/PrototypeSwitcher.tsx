// PROTOTYPE ONLY: floating variant switcher for throwaway UI prototypes.
import { useEffect } from "react";
import { useSearchParams } from "react-router";

interface PrototypeSwitcherProps {
  variants: { key: string; name: string }[];
}

export function PrototypeSwitcher({ variants }: PrototypeSwitcherProps) {
  const [params, setParams] = useSearchParams();
  const current = params.get("variant") ?? variants[0].key;
  const index = Math.max(0, variants.findIndex((v) => v.key === current));

  const go = (delta: number) => {
    const next = variants[(index + delta + variants.length) % variants.length];
    const p = new URLSearchParams(params);
    p.set("variant", next.key);
    setParams(p, { replace: true });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 rounded-full bg-white text-black shadow-2xl ring-2 ring-black/80 px-2 py-1.5 font-mono text-xs">
      <button type="button" onClick={() => go(-1)} className="px-2 py-1 rounded-full hover:bg-black/10 cursor-pointer">←</button>
      <span className="px-2 font-semibold">
        PROTOTYPE · {variants[index].key} ({variants[index].name})
      </span>
      <button type="button" onClick={() => go(1)} className="px-2 py-1 rounded-full hover:bg-black/10 cursor-pointer">→</button>
    </div>
  );
}
