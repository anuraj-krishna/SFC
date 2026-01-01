"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 noise pointer-events-none" />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary-600/30 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent-cyan/20 blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/">
            <Logo size="lg" />
          </Link>

          <div className="max-w-md">
            <h1 className="text-4xl font-display font-bold text-dark-100 mb-4">
              Transform Your Body,{" "}
              <span className="gradient-text">Elevate Your Mind</span>
            </h1>
            <p className="text-lg text-dark-400">
              Join thousands of fitness enthusiasts achieving their goals with
              personalized programs and expert guidance.
            </p>

            {/* Feature highlights */}
            <div className="mt-8 space-y-4">
              {[
                "Personalized workout programs",
                "Expert video guidance",
                "Progress tracking & analytics",
                "Community support",
              ].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                  </div>
                  <span className="text-dark-300">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-sm text-dark-500">
            © {new Date().getFullYear()} SFC Fitness. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Link href="/">
              <Logo size="lg" />
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

