import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="date"
          className={cn(
            "w-full rounded-lg border border-border-default bg-base px-3 py-2 text-sm text-primary",
            "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-150",
            "[color-scheme:dark]",
            error && "border-danger focus:ring-danger/40",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
