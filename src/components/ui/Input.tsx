import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary text-sm font-mono">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-lg border border-border-default bg-base px-3 py-2 text-sm text-primary placeholder:text-tertiary",
              "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-150",
              prefix && "pl-12",
              suffix && "pr-8",
              error && "border-danger focus:ring-danger/40",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary text-sm">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
