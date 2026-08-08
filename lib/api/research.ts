import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type {
  Research,
  ResearchCategory,
  ResearchPage,
  ResearchSort,
} from "@/lib/api/types";

export type ResearchInput = Pick<
  Research,
  "id" | "title" | "year" | "category" | "venue" | "abstract"
> &
  Partial<
    Pick<
      Research,
      | "collaborators"
      | "authors"
      | "publicationDate"
      | "doi"
      | "citation"
      | "pdfUrl"
      | "externalUrl"
      | "keywords"
      | "image"
      | "figures"
    >
  >;

export interface ResearchQuery {
  q?: string;
  category?: ResearchCategory;
  sort?: ResearchSort;
  page?: number;
  limit?: number;
}

function normalizeResearchPage(
  value: ResearchPage | Research[],
  query: ResearchQuery
): ResearchPage {
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

export function listResearch(options?: {
  onProgress?: (progress: number) => void;
}) {
  return apiGet<Research[]>("/api/research", undefined, options);
}

export function listResearchPage(
  query: ResearchQuery = {},
  options?: { onProgress?: (progress: number) => void }
) {
  return apiGet<ResearchPage | Research[]>(
    "/api/research",
    { ...query, paginated: true },
    options
  ).then((value) => normalizeResearchPage(value, query));
}

export function getResearch(
  slug: string,
  options?: { onProgress?: (progress: number) => void }
) {
  return apiGet<Research>(`/api/research/${slug}`, undefined, options);
}

export function createResearch(input: ResearchInput) {
  return apiPost<Research>("/api/research", input);
}

export function updateResearch(slug: string, input: ResearchInput) {
  return apiPut<Research>(`/api/research/${slug}`, input);
}

export function deleteResearch(slug: string) {
  return apiDelete<Research>(`/api/research/${slug}`);
}
