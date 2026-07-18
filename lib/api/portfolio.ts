import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import type { Project } from "@/lib/api/types";

export type ProjectInput = Pick<
  Project,
  "id" | "title" | "category" | "year" | "image"
> &
  Partial<Pick<Project, "aspect">>;

export function listProjects() {
  return apiGet<Project[]>("/api/portfolio", { limit: 500 });
}

export function getProject(slug: string) {
  return apiGet<Project>(`/api/portfolio/${slug}`);
}

export function createProject(input: ProjectInput) {
  return apiPost<Project>("/api/portfolio", input);
}

export function updateProject(slug: string, input: ProjectInput) {
  return apiPut<Project>(`/api/portfolio/${slug}`, input);
}

export function deleteProject(slug: string) {
  return apiDelete<Project>(`/api/portfolio/${slug}`);
}

export function reorderProjects(projectIds: string[]) {
  return apiPatch<Project[]>("/api/portfolio/reorder", { projectIds });
}
