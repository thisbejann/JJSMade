import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, className, id: externalId, ...props }, ref) => {
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
        <input
          ref={ref}
          id={id}
          type="date"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            "w-full rounded-lg border border-border-default bg-base px-3 py-2 text-sm text-primary",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-150",
            "[color-scheme:dark]",
            error && "border-danger focus:ring-danger/40",
            className
          )}
          {...props}
        />
        {error && <p id={errorId} className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
