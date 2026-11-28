import { cn } from "../../lib/utils";

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; detail?: string }[];
  /** Undefined selects no option. */
  value: T | undefined;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-secondary mb-2">{label}</label>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border text-center",
              value === opt.value
                ? "border-accent bg-accent-muted text-accent"
                : "border-border-default text-secondary hover:border-border-strong hover:bg-hover"
            )}
          >
            {opt.label}
            {opt.detail && <span className="block mt-0.5 font-mono text-[10px] opacity-70">{opt.detail}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
