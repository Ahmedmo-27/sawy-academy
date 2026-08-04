import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

export type UserInput = Pick<User, "id" | "name" | "email"> & {
  role?: string;
};

/**
 * Assumed PUT /api/users/me payload:
 *   { name: string; email: string; avatarUrl?: string }
 *
 * Assumed success data: User (id, name, email, role?, avatarUrl?, createdAt?)
 */
export type ProfileUpdateInput = {
  name: string;
  email: string;
  avatarUrl?: string;
};

/**
 * Assumed PUT /api/users/me/password payload:
 *   { currentPassword: string; newPassword: string }
 *
 * Note: this is change-password-while-logged-in, not the forgot-password reset flow.
 */
export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

// TODO: Confirm user endpoint and fields when auth/user API is live.
export function listUsers() {
  return apiGet<User[]>("/api/users");
}

export function getUser(id: string) {
  return apiGet<User>(`/api/users/${id}`);
}

export function createUser(input: UserInput) {
  return apiPost<User>("/api/users", input);
}

export function updateUser(id: string, input: UserInput) {
  return apiPut<User>(`/api/users/${id}`, input);
}

export function deleteUser(id: string) {
  return apiDelete<User>(`/api/users/${id}`);
}

// TODO: Confirm GET /api/users/me response shape and auth header attachment.
export function getMe() {
  return apiGet<User>("/api/users/me");
}

// TODO: Confirm PUT /api/users/me accepts avatarUrl and returns the updated User.
export function updateMe(input: ProfileUpdateInput) {
  return apiPut<User>("/api/users/me", input);
}

// TODO: Confirm password-change endpoint path once auth API ships.
export function changePassword(input: ChangePasswordInput) {
  return apiPut<{ ok: boolean }>("/api/users/me/password", input);
}
