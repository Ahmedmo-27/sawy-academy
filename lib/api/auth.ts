import { apiPost } from "@/lib/api/client";

export type AuthRole = "admin" | "student" | "guest";

export interface AuthUser {
  id?: string;
  name: string;
  email?: string;
  role: AuthRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

/**
 * Assumed POST /api/auth/login payload:
 *   { email: string, password: string }
 *
 * Assumed POST /api/auth/signup payload:
 *   { name: string, email: string, password: string }
 *
 * Assumed success data shape (wrapped in ApiResponse):
 *   { token: string, user: { id?: string, name: string, email?: string, role: "admin" | "student" } }
 */
export interface AuthSessionResponse {
  token: string;
  user: AuthUser;
}

/** @deprecated Prefer AuthSessionResponse — kept as an alias for existing imports. */
export type LoginResponse = AuthSessionResponse;

export function loginRequest(credentials: LoginCredentials) {
  return apiPost<AuthSessionResponse>("/api/auth/login", credentials);
}

export function signupRequest(credentials: SignupCredentials) {
  return apiPost<AuthSessionResponse>("/api/auth/signup", credentials);
}
