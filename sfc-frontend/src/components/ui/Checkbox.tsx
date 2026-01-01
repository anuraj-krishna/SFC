"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string | React.ReactNode;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn("flex flex-col", className)}>
        <label htmlFor={inputId} className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              ref={ref}
              id={inputId}
              className="peer sr-only"
              {...props}
            />
            <div
              className={cn(
                "w-5 h-5 rounded border-2 transition-all duration-200",
                "bg-dark-800/50 border-dark-500",
                "peer-checked:bg-primary-600 peer-checked:border-primary-600",
                "peer-focus:ring-2 peer-focus:ring-primary-500/20 peer-focus:ring-offset-2 peer-focus:ring-offset-dark-950",
                "group-hover:border-primary-500/50",
                error && "border-accent-rose"
              )}
            />
            <Check
              className={cn(
                "absolute inset-0 w-5 h-5 p-0.5 text-white transition-all duration-200",
                "opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100"
              )}
            />
          </div>
          {label && (
            <span className="text-sm text-dark-300 group-hover:text-dark-200 transition-colors">
              {label}
            </span>
          )}
        </label>
        {error && <p className="mt-1.5 text-sm text-accent-rose ml-8">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };

