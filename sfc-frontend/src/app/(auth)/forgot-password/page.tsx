"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";
import { authApi } from "@/lib/api";

type Step = "email" | "otp" | "newPassword" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const { error: apiError } = await authApi.forgotPassword({ email });

    if (apiError) {
      setError(apiError.message);
    } else {
      setStep("otp");
    }

    setIsSubmitting(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    setError("");
    setStep("newPassword");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    const { error: apiError } = await authApi.resetPassword({
      email,
      code: otp,
      new_password: password,
    });

    if (apiError) {
      setError(apiError.message);
      // Go back to OTP step if code is invalid
      if (apiError.code === "INVALID_OTP" || apiError.code === "OTP_EXPIRED") {
        setStep("otp");
        setOtp("");
      }
    } else {
      setStep("success");
    }

    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-8">
        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-primary-400" />
                </div>
                <h1 className="text-2xl font-display font-bold text-dark-100">
                  Forgot Password?
                </h1>
                <p className="text-dark-400 mt-2">
                  No worries! Enter your email and we&apos;ll send you a reset code.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20">
                    <p className="text-sm text-accent-rose">{error}</p>
                  </div>
                )}

                <Input
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-5 h-5" />}
                  required
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Send Reset Code
                </Button>
              </form>

              <p className="text-center mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </p>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary-400" />
                </div>
                <h1 className="text-2xl font-display font-bold text-dark-100">
                  Check Your Email
                </h1>
                <p className="text-dark-400 mt-2">
                  Enter the 6-digit code sent to
                </p>
                <p className="text-primary-400 font-medium">{email}</p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20">
                    <p className="text-sm text-accent-rose">{error}</p>
                  </div>
                )}

                <Input
                  type="text"
                  label="Verification Code"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center tracking-widest text-xl"
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Verify Code
                </Button>
              </form>

              <p className="text-center mt-6">
                <button
                  onClick={() => setStep("email")}
                  className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change Email
                </button>
              </p>
            </motion.div>
          )}

          {step === "newPassword" && (
            <motion.div
              key="newPassword"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary-400" />
                </div>
                <h1 className="text-2xl font-display font-bold text-dark-100">
                  Create New Password
                </h1>
                <p className="text-dark-400 mt-2">
                  Your new password must be different from previous passwords.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20">
                    <p className="text-sm text-accent-rose">{error}</p>
                  </div>
                )}

                <Input
                  type="password"
                  label="New Password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-5 h-5" />}
                  helperText="At least 8 characters"
                  required
                />

                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-5 h-5" />}
                  required
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Reset Password
                </Button>
              </form>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-accent-emerald/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-accent-emerald" />
                </div>
                <h1 className="text-2xl font-display font-bold text-dark-100 mb-2">
                  Password Reset!
                </h1>
                <p className="text-dark-400 mb-8">
                  Your password has been successfully reset. You can now sign in with
                  your new password.
                </p>
                <Link href="/login">
                  <Button className="w-full" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

