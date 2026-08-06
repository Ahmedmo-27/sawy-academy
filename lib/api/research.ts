import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { Research } from "@/lib/api/types";

export type ResearchInput = Pick<
  Research,
  "id" | "title" | "year" | "category" | "venue" | "abstract"
> &
  Partial<Pick<Research, "collaborators">>;

export function listResearch(options?: {
  onProgress?: (progress: number) => void;
}) {
  return apiGet<Research[]>("/api/research", undefined, options);
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
