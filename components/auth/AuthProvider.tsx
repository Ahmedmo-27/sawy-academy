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
  getMeRequest,
  loginRequest,
  logoutRequest,
  signupRequest,
  type AuthUser,
  type LoginCredentials,
  type SignupCredentials,
} from "@/lib/api/auth";
import { adoptDeviceId } from "@/lib/device/id";

export type { AuthRole, AuthUser } from "@/lib/api/auth";

interface AuthContextValue {
  user: AuthUser | null;
  /**
   * Cookie-backed sessions no longer expose the JWT to JS.
   * Kept for compatibility: "cookie" when authenticated, otherwise null.
   */
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  signup: (credentials: SignupCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Merge fields into the stored session user after a profile save. */
  updateSessionUser: (partial: Partial<AuthUser>) => void;
}

const LEGACY_TOKEN_KEY = "sawy-academy-auth-token";
const USER_KEY = "sawy-academy-auth-user";
const COOKIE_SESSION_MARKER = "cookie";

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

function persistUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearStoredSession() {
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      localStorage.removeItem(LEGACY_TOKEN_KEY);

      const storedUser = readStoredUser();
      if (!storedUser) {
        // There is no client-side indication of an existing session. Avoid a
        // speculative /auth/me request (and its expected 401) for guests.
        setIsLoading(false);
        return;
      }

      setUser(storedUser);
      setHasSession(true);

      try {
        const result = await getMeRequest();
        setUser(result.user);
        setHasSession(true);
        persistUser(result.user);
        adoptDeviceId(result.deviceId);
      } catch {
        setUser(null);
        setHasSession(false);
        clearStoredSession();
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, []);

  const applySession = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    setHasSession(true);
    persistUser(nextUser);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await loginRequest(credentials);
      applySession(result.user);
      return result.user;
    },
    [applySession]
  );

  const signup = useCallback(
    async (credentials: SignupCredentials) => {
      const result = await signupRequest(credentials);
      applySession(result.user);
      return result.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Clear local state even when the server session is already gone.
    } finally {
      setUser(null);
      setHasSession(false);
      clearStoredSession();
    }
  }, []);

  useEffect(() => {
    function onSessionInvalid() {
      // Session already revoked server-side — clear client state without
      // another logout round-trip (avoids SESSION_REVOKED → logout loops).
      setUser(null);
      setHasSession(false);
      clearStoredSession();
    }

    window.addEventListener("sawy:session-invalid", onSessionInvalid);
    return () => {
      window.removeEventListener("sawy:session-invalid", onSessionInvalid);
    };
  }, []);

  const updateSessionUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      persistUser(next);
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token: hasSession ? COOKIE_SESSION_MARKER : null,
      isLoading,
      isAuthenticated: Boolean(hasSession && user),
      isAdmin: user?.role === "admin",
      login,
      signup,
      logout,
      updateSessionUser,
    }),
    [user, hasSession, isLoading, login, signup, logout, updateSessionUser]
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
