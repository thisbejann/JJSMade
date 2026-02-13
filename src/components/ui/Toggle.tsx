import { cn } from "../../lib/utils";

interface ToggleProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 cursor-pointer"
    >
      <div
        className={cn(
          "relative w-10 h-5.5 rounded-full transition-colors duration-200",
          checked ? "bg-accent" : "bg-hover border border-border-default"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-primary shadow-sm transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </div>
      {(label || description) && (
        <div className="text-left">
          {label && <p className="text-sm font-medium text-primary">{label}</p>}
          {description && (
            <p className="text-xs text-secondary">{description}</p>
          )}
        </div>
      )}
    </button>
  );
}
