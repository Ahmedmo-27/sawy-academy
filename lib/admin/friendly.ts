import { ApiClientError } from "@/lib/api/client";

/** Plain-language errors for non-technical admin users. */
export function toFriendlyAdminError(
  err: unknown,
  action = "complete this action"
) {
  if (err instanceof ApiClientError) {
    if (err.status === 404) {
      return "We couldn't find that item. It may have been removed — go back to the list and open it again.";
    }

    if (err.status === 401 || err.status === 403) {
      return "You don't have permission to do that. Please sign in again.";
    }

    if (err.status >= 500) {
      return "The server had a problem. Please wait a moment and try again.";
    }

    if (err.message && !/not found|failed|error|endpoint|api/i.test(err.message)) {
      return err.message;
    }
  }

  if (err instanceof TypeError) {
    return "We couldn't reach the server. Check your internet connection and try again.";
  }

  return `We couldn't ${action}. Please try again.`;
}

export function cacheAdminRecord(
  kind: string,
  key: string,
  record: Record<string, unknown>
) {
  try {
    sessionStorage.setItem(
      `sawy-admin:${kind}:${key}`,
      JSON.stringify(record)
    );
  } catch {
    // Ignore storage failures (private mode, quota).
  }
}

export function readCachedAdminRecord(kind: string, key: string) {
  try {
    const raw = sessionStorage.getItem(`sawy-admin:${kind}:${key}`);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
