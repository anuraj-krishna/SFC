"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { Button, Input, Checkbox, Card } from "@/components/ui";
import { useAuthStore } from "@/store/auth";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    privacyConsent: false,
    dataProcessingConsent: false,
    marketingConsent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.privacyConsent) {
      newErrors.privacyConsent = "You must accept the privacy policy";
    }

    if (!formData.dataProcessingConsent) {
      newErrors.dataProcessingConsent = "You must accept data processing terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const result = await signup(formData.email, formData.password, {
      privacy: formData.privacyConsent,
      dataProcessing: formData.dataProcessingConsent,
      marketing: formData.marketingConsent,
    });

    if (result.success) {
      // Redirect to OTP verification page
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } else {
      setErrors({ form: result.error || "Something went wrong" });
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
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display font-bold text-dark-100">
            Create Account
          </h1>
          <p className="text-dark-400 mt-2">
            Start your transformation journey today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.form && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20"
            >
              <p className="text-sm text-accent-rose">{errors.form}</p>
            </motion.div>
          )}

          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            leftIcon={<Mail className="w-5 h-5" />}
            error={errors.email}
            required
          />

          <Input
            type="password"
            label="Password"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            leftIcon={<Lock className="w-5 h-5" />}
            error={errors.password}
            helperText="At least 8 characters"
            required
          />

          <Input
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            leftIcon={<Lock className="w-5 h-5" />}
            error={errors.confirmPassword}
            required
          />

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-dark-300">
                Your data is protected and secure
              </span>
            </div>

            <Checkbox
              label={
                <span>
                  I agree to the{" "}
                  <Link href="/privacy" className="text-primary-400 hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              }
              checked={formData.privacyConsent}
              onChange={(e) =>
                setFormData({ ...formData, privacyConsent: e.target.checked })
              }
              error={errors.privacyConsent}
            />

            <Checkbox
              label="I consent to the processing of my personal data for the service"
              checked={formData.dataProcessingConsent}
              onChange={(e) =>
                setFormData({ ...formData, dataProcessingConsent: e.target.checked })
              }
              error={errors.dataProcessingConsent}
            />

            <Checkbox
              label="I'd like to receive updates and promotional emails (optional)"
              checked={formData.marketingConsent}
              onChange={(e) =>
                setFormData({ ...formData, marketingConsent: e.target.checked })
              }
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Create Account
          </Button>
        </form>

        <p className="text-center mt-6 text-dark-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </motion.div>
  );
}

