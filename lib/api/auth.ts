import { apiGet, apiPost } from "@/lib/api/client";
import { adoptDeviceId, getOrCreateDeviceId } from "@/lib/device/id";

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
 * POST /api/auth/login — { email, password, deviceId?, userAgent? }
 * POST /api/auth/signup — { name, email, password, deviceId?, userAgent? }
 * GET  /api/auth/me     — validates the current session (httpOnly cookie + X-Device-Id)
 * POST /api/auth/logout — revokes the current session and clears the cookie
 *
 * Success data shape (wrapped in ApiResponse):
 *   { token?: string, user: { id?, name, email?, role }, deviceId? }
 *
 * The JWT is delivered via an httpOnly `sawy_session` cookie. The body token
 * is optional compatibility payload and is not stored by the client.
 */
export interface AuthSessionResponse {
  token?: string;
  user: AuthUser;
  /** Present when the server generated a device id for this browser. */
  deviceId?: string;
}

/** @deprecated Prefer AuthSessionResponse — kept as an alias for existing imports. */
export type LoginResponse = AuthSessionResponse;

export async function loginRequest(credentials: LoginCredentials) {
  const result = await apiPost<AuthSessionResponse>(
    "/api/auth/login",
    {
      ...credentials,
      deviceId: getOrCreateDeviceId(),
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    },
    { auth: false }
  );
  adoptDeviceId(result.deviceId);
  return result;
}

export async function signupRequest(credentials: SignupCredentials) {
  const result = await apiPost<AuthSessionResponse>(
    "/api/auth/signup",
    {
      ...credentials,
      deviceId: getOrCreateDeviceId(),
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    },
    { auth: false }
  );
  adoptDeviceId(result.deviceId);
  return result;
}

export interface AuthMeResponse {
  user: AuthUser;
  deviceId?: string;
}

export function getMeRequest() {
  return apiGet<AuthMeResponse>("/api/auth/me");
}

export function logoutRequest() {
  return apiPost<{ ok: boolean }>("/api/auth/logout");
}
