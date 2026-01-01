"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 focus:ring-primary-500 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98]",
      secondary:
        "bg-dark-800 text-dark-100 border border-dark-600 hover:bg-dark-700 hover:border-primary-500/50 focus:ring-primary-500 hover:scale-[1.02] active:scale-[0.98]",
      ghost:
        "text-dark-300 hover:text-white hover:bg-dark-800/50 focus:ring-primary-500/50",
      danger:
        "bg-gradient-to-r from-accent-rose to-red-500 text-white hover:from-red-500 hover:to-red-400 focus:ring-accent-rose shadow-lg shadow-accent-rose/25 hover:shadow-xl hover:shadow-accent-rose/40 hover:scale-[1.02] active:scale-[0.98]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
      md: "px-5 py-2.5 text-base rounded-xl gap-2",
      lg: "px-7 py-3.5 text-lg rounded-xl gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };

