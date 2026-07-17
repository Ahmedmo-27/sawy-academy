"use client";

import { useAuthContext } from "@/components/auth/AuthProvider";
import type { AuthUser } from "@/lib/api/auth";

export type { AuthUser };

export function useAuth() {
  const {
    user,
    token,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    signup,
    logout,
    updateSessionUser,
  } = useAuthContext();

  return {
    user: user ?? ({ name: "Guest", role: "guest" } as AuthUser),
    token,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    signup,
    logout,
    updateSessionUser,
  };
}
