import type { AuthUser } from "@/lib/api/auth";

/**
 * Destination after a successful login or signup.
 * Admins enter the control room; students land on the public home page.
 */
export function postAuthPath(user: Pick<AuthUser, "role">): string {
  return user.role === "admin" ? "/admin" : "/";
}
