"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", size = "sm", children, className }: BadgeProps) {
  const variants = {
    default: "bg-dark-700 text-dark-200",
    primary: "bg-primary-500/20 text-primary-300",
    success: "bg-accent-emerald/20 text-accent-emerald",
    warning: "bg-accent-gold/20 text-accent-gold",
    danger: "bg-accent-rose/20 text-accent-rose",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

