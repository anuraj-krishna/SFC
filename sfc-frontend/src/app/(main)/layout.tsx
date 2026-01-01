"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Navbar, Footer } from "@/components/layout";
import { useAuthStore } from "@/store/auth";

const protectedRoutes = ["/dashboard", "/profile", "/onboarding"];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, checkAuth, hasCompletedOnboarding } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) return;

    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

    if (isProtectedRoute && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Redirect to onboarding if not completed (except if already on onboarding page)
    if (
      isAuthenticated &&
      !hasCompletedOnboarding &&
      pathname !== "/onboarding" &&
      isProtectedRoute
    ) {
      router.push("/onboarding");
    }
  }, [isAuthenticated, isLoading, hasCompletedOnboarding, pathname, router]);

  if (isLoading && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  );
}

