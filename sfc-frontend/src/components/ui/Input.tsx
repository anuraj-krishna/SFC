"use client";

import { forwardRef, type InputHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-dark-200 mb-2">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">
              {leftIcon}
            </div>
          )}
          <input
            type={isPassword && showPassword ? "text" : type}
            className={cn(
              "w-full px-4 py-3 rounded-xl",
              "bg-dark-800/50 border border-dark-600",
              "text-dark-100 placeholder-dark-400",
              "focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
              "transition-all duration-200",
              leftIcon && "pl-11",
              (rightIcon || isPassword) && "pr-11",
              error && "border-accent-rose focus:border-accent-rose focus:ring-accent-rose/20",
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-accent-rose">{error}</p>}
        {helperText && !error && <p className="mt-2 text-sm text-dark-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };

