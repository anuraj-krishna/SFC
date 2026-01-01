"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  variant?: "default" | "gradient" | "success";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  showLabel = false,
  variant = "default",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const variants = {
    default: "bg-gradient-to-r from-primary-600 to-primary-400",
    gradient: "bg-gradient-to-r from-primary-600 via-accent-cyan to-primary-400",
    success: "bg-gradient-to-r from-accent-emerald to-green-400",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-dark-400">Progress</span>
          <span className="text-dark-200 font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("rounded-full bg-dark-700 overflow-hidden", sizes[size])}>
        <motion.div
          className={cn("h-full rounded-full", variants[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

