import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import type { Faq } from "@/lib/api/types";

export type FaqInput = Pick<Faq, "question" | "answer"> &
  Partial<Pick<Faq, "id" | "category" | "published" | "order">>;

export function listFaqs(options?: { includeHidden?: boolean }) {
  return apiGet<Faq[]>(
    "/api/faqs",
    options?.includeHidden ? { published: "all" } : undefined
  );
}

export function getFaq(id: string) {
  return apiGet<Faq>(`/api/faqs/${id}`);
}

export function createFaq(input: FaqInput) {
  return apiPost<Faq>("/api/faqs", input);
}

export function updateFaq(id: string, input: FaqInput) {
  return apiPut<Faq>(`/api/faqs/${id}`, input);
}

export function deleteFaq(id: string) {
  return apiDelete<Faq>(`/api/faqs/${id}`);
}

export function reorderFaqs(faqIds: string[]) {
  return apiPatch<Faq[]>("/api/faqs/reorder", { faqIds });
}
