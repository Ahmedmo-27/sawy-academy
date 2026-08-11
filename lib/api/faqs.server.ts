import "server-only";

import { cache } from "react";
import type { ApiResponse, Faq } from "@/lib/api/types";

const DEFAULT_API_ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://sawy-academy.onrender.com"
    : "http://127.0.0.1:5000";

export class ServerFaqError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ServerFaqError";
  }
}

function getApiOrigin() {
  return (process.env.API_PROXY_TARGET ?? DEFAULT_API_ORIGIN).replace(/\/$/, "");
}

async function fetchFaqApi<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getApiOrigin()}${path}`, { cache: "no-store" });
  } catch {
    throw new ServerFaqError("The FAQ service is unavailable.", 0);
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success || payload.data === null) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : payload?.error?.message ?? "The FAQ request failed.";
    throw new ServerFaqError(message, response.status);
  }
  return payload.data;
}

export const getServerFaqList = cache(async (): Promise<Faq[]> => {
  return fetchFaqApi<Faq[]>("/api/faqs");
});
