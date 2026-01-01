"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: "text-lg" },
    md: { icon: 40, text: "text-xl" },
    lg: { icon: 56, text: "text-2xl" },
    xl: { icon: 72, text: "text-3xl" },
  };

  const iconSize = sizes[size].icon;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {/* Main logo icon */}
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Background glow */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333ea" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer ring */}
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="url(#logoGradient)"
            strokeWidth="2"
            fill="none"
            className="opacity-60"
          />

          {/* Inner hexagon shape */}
          <path
            d="M32 8L52 20V44L32 56L12 44V20L32 8Z"
            fill="url(#logoGradient)"
            filter="url(#glow)"
          />

          {/* S letter stylized */}
          <path
            d="M38 22C38 22 36 20 32 20C28 20 26 22 26 25C26 28 28 29 32 30C36 31 38 32 38 35C38 38 36 40 32 40C28 40 26 38 26 38"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Fitness dumbbell accent */}
          <rect x="22" y="44" width="6" height="3" rx="1" fill="white" opacity="0.8" />
          <rect x="36" y="44" width="6" height="3" rx="1" fill="white" opacity="0.8" />
          <rect x="27" y="45" width="10" height="1" fill="white" opacity="0.8" />
        </svg>

        {/* Animated pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary-500"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {showText && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col"
        >
          <span
            className={cn(
              "font-display font-bold tracking-tight gradient-text",
              sizes[size].text
            )}
          >
            SFC
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-dark-400 -mt-1">
            Fitness
          </span>
        </motion.div>
      )}
    </div>
  );
}

