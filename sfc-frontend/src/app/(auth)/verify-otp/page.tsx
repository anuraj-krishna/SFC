"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, RefreshCw, Mail, CheckCircle } from "lucide-react";
import { Button, Card, Checkbox } from "@/components/ui";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/api";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const { verifyOtp } = useAuthStore();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedValue = value.slice(0, 6).split("");
      const newOtp = [...otp];
      pastedValue.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedValue.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
    setError("");
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");

    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await verifyOtp(email, code, rememberMe);

    if (result.success) {
      if (result.requiresOnboarding) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } else {
      setError(result.error || "Invalid verification code");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }

    setIsSubmitting(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError("");
    setResendSuccess(false);

    const { error } = await authApi.resendOtp({ email });

    if (error) {
      setError(error.message);
    } else {
      setResendSuccess(true);
      setResendCooldown(60);
      setTimeout(() => setResendSuccess(false), 5000);
    }

    setIsResending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-2xl font-display font-bold text-dark-100">
            Check Your Email
          </h1>
          <p className="text-dark-400 mt-2">
            We&apos;ve sent a 6-digit verification code to
          </p>
          <p className="text-primary-400 font-medium">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20"
            >
              <p className="text-sm text-accent-rose">{error}</p>
            </motion.div>
          )}

          {resendSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5 text-accent-emerald" />
              <p className="text-sm text-accent-emerald">
                Verification code resent successfully!
              </p>
            </motion.div>
          )}

          {/* OTP Input */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold rounded-xl bg-dark-800/50 border border-dark-600 text-dark-100 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            ))}
          </div>

          <Checkbox
            label="Remember me on this device"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="justify-center"
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Verify Email
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-dark-400 mb-2">Didn&apos;t receive the code?</p>
          <button
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`} />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-8 animate-pulse">
          <div className="h-16 w-16 rounded-full bg-dark-700 mx-auto mb-4" />
          <div className="h-8 bg-dark-700 rounded w-3/4 mx-auto mb-2" />
          <div className="h-4 bg-dark-700 rounded w-1/2 mx-auto" />
        </Card>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}

