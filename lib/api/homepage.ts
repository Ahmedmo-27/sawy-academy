import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import type { HomePageConfig, HomeSection } from "@/lib/api/types";

export function getHomePage() {
  return apiGet<HomePageConfig>("/api/homepage");
}

export function updateHomePage(sections: HomeSection[]) {
  return apiPut<HomePageConfig>("/api/homepage", { sections });
}

export function reorderHomeSections(sectionIds: string[]) {
  return apiPatch<HomePageConfig>("/api/homepage/reorder", { sectionIds });
}

export function createHomeSection(
  input: Pick<HomeSection, "type" | "content" | "enabled">
) {
  return apiPost<HomePageConfig>("/api/homepage/sections", input);
}

export function updateHomeSection(
  id: string,
  input: Partial<Pick<HomeSection, "type" | "enabled" | "content" | "order">>
) {
  return apiPut<HomePageConfig>(`/api/homepage/sections/${id}`, input);
}

export function deleteHomeSection(id: string) {
  return apiDelete<HomePageConfig>(`/api/homepage/sections/${id}`);
}

export function resetHomePage() {
  return apiPost<HomePageConfig>("/api/homepage/reset");
}
