import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, error, className, id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            "w-full rounded-lg border border-border-default bg-base px-3 py-2 text-sm text-primary",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-150",
            "appearance-none cursor-pointer",
            error && "border-danger focus:ring-danger/40",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" className="text-tertiary">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p id={errorId} className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
