"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { Button, Input, Checkbox, Card, Logo } from "@/components/ui";
import { useAuthStore } from "@/store/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, checkAuth, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user?.role === "admin") {
      router.push("/admin");
    }
  }, [isAuthenticated, user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(formData.email, formData.password, formData.rememberMe);

    if (result.success) {
      // Re-check auth to get updated user info
      await checkAuth();
    } else {
      setError(result.error || "Invalid credentials");
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-mesh opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-primary-400" />
              <span className="text-sm text-dark-400">Admin Portal</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-dark-100">
              Admin Sign In
            </h1>
            <p className="text-dark-400 mt-2">
              Access the administration dashboard
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
              placeholder="admin@sfcfitness.com"
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

            <Checkbox
              label="Remember me"
              checked={formData.rememberMe}
              onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
            />

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

          <p className="text-center mt-6 text-sm text-dark-500">
            This portal is for authorized administrators only.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

