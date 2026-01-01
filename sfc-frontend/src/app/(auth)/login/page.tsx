"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Button, Input, Checkbox, Card } from "@/components/ui";
import { useAuthStore } from "@/store/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const { login } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(formData.email, formData.password, formData.rememberMe);

    if (result.success) {
      if (result.requiresOnboarding) {
        router.push("/onboarding");
      } else {
        router.push(redirectTo);
      }
    } else {
      setError(result.error || "Invalid email or password");
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
            Welcome Back
          </h1>
          <p className="text-dark-400 mt-2">
            Sign in to continue your fitness journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20"
            >
              <p className="text-sm text-accent-rose">{error}</p>
            </motion.div>
          )}

          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            leftIcon={<Mail className="w-5 h-5" />}
            required
          />

          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            leftIcon={<Lock className="w-5 h-5" />}
            required
          />

          <div className="flex items-center justify-between">
            <Checkbox
              label="Remember me"
              checked={formData.rememberMe}
              onChange={(e) =>
                setFormData({ ...formData, rememberMe: e.target.checked })
              }
            />
            <Link
              href="/forgot-password"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Sign In
          </Button>
        </form>

        <p className="text-center mt-6 text-dark-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            Sign up
          </Link>
        </p>
      </Card>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-8 animate-pulse">
          <div className="h-8 bg-dark-700 rounded w-1/2 mx-auto mb-4" />
          <div className="h-4 bg-dark-700 rounded w-3/4 mx-auto mb-8" />
          <div className="space-y-5">
            <div className="h-12 bg-dark-700 rounded" />
            <div className="h-12 bg-dark-700 rounded" />
            <div className="h-12 bg-dark-700 rounded" />
          </div>
        </Card>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
