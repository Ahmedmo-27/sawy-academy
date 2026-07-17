import { apiGet } from "@/lib/api/client";
import type { Research } from "@/lib/api/types";

/** Public research list for the Services collaboration picker. */
export function listResearch() {
  return apiGet<Research[]>("/api/research");
}
