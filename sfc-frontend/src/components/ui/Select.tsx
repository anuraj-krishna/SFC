"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-dark-200 mb-2">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "w-full px-4 py-3 rounded-xl appearance-none cursor-pointer",
              "bg-dark-800/50 border border-dark-600",
              "text-dark-100",
              "focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
              "transition-all duration-200",
              "pr-10",
              error && "border-accent-rose focus:border-accent-rose focus:ring-accent-rose/20",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-dark-800 text-dark-400">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-dark-800">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
        </div>
        {error && <p className="mt-2 text-sm text-accent-rose">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };

