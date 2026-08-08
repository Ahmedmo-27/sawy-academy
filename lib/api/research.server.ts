import "server-only";

import { cache } from "react";
import type {
  ApiResponse,
  Research,
  ResearchCategory,
  ResearchPage,
  ResearchSort,
} from "@/lib/api/types";

const DEFAULT_API_ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://sawy-academy.onrender.com"
    : "http://localhost:5000";

export class ServerResearchError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ServerResearchError";
  }
}

function getApiOrigin() {
  return (process.env.API_PROXY_TARGET ?? DEFAULT_API_ORIGIN).replace(/\/$/, "");
}

async function fetchResearchApi<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getApiOrigin()}${path}`, { cache: "no-store" });
  } catch {
    throw new ServerResearchError("The research service is unavailable.", 0);
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success || payload.data === null) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : payload?.error?.message ?? "The research request failed.";
    throw new ServerResearchError(message, response.status);
  }
  return payload.data;
}

export interface ServerResearchQuery {
  q?: string;
  category?: ResearchCategory;
  sort?: ResearchSort;
  page?: number;
  limit?: number;
}

export const getServerResearchPage = cache(
  async (query: ServerResearchQuery = {}): Promise<ResearchPage> => {
    const params = new URLSearchParams({ paginated: "true" });
    if (query.q) params.set("q", query.q);
    if (query.category) params.set("category", query.category);
    if (query.sort) params.set("sort", query.sort);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));
    const value = await fetchResearchApi<ResearchPage | Research[]>(
      `/api/research?${params}`
    );
    if (!Array.isArray(value)) return value;
    const page = query.page ?? 1;
    const pageSize = query.limit ?? 20;
    return {
      items: value,
      total: (page - 1) * pageSize + value.length,
      page,
      pageSize,
      hasMore: value.length === pageSize,
    };
  }
);

export const getServerResearch = cache(async (slug: string): Promise<Research> => {
  return fetchResearchApi<Research>(`/api/research/${encodeURIComponent(slug)}`);
});

export const getServerResearchList = cache(async (): Promise<Research[]> => {
  return fetchResearchApi<Research[]>("/api/research?limit=100");
});
