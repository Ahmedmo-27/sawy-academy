"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLoader } from "@/components/admin/AdminLoader";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Redirects unauthenticated visitors to /login.
 * Generalized from AdminAuthGuard — any authenticated role may pass.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <AdminLoader label="Checking access" />;
  }

  return <>{children}</>;
}
