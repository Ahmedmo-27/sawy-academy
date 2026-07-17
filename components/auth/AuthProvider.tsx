"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loginRequest,
  signupRequest,
  type AuthUser,
  type LoginCredentials,
  type SignupCredentials,
} from "@/lib/api/auth";

export type { AuthRole, AuthUser } from "@/lib/api/auth";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  signup: (credentials: SignupCredentials) => Promise<AuthUser>;
  logout: () => void;
  /** Merge fields into the stored session user after a profile save. */
  updateSessionUser: (partial: Partial<AuthUser>) => void;
}

const TOKEN_KEY = "sawy-academy-auth-token";
const USER_KEY = "sawy-academy-auth-user";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function persistSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Swap localStorage for httpOnly session cookies once backend auth lands.
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = readStoredUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const applySession = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    persistSession(nextToken, nextUser);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await loginRequest(credentials);
      applySession(result.token, result.user);
      return result.user;
    },
    [applySession]
  );

  const signup = useCallback(
    async (credentials: SignupCredentials) => {
      const result = await signupRequest(credentials);
      applySession(result.token, result.user);
      return result.user;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // TODO: Call POST /api/auth/logout when the endpoint exists.
  }, []);

  const updateSessionUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === "admin",
      login,
      signup,
      logout,
      updateSessionUser,
    }),
    [user, token, isLoading, login, signup, logout, updateSessionUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
