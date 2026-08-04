import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { SiteSettings } from "@/lib/api/types";

export function getSiteSettings() {
  return apiGet<SiteSettings>("/api/settings");
}

export function updateSiteSettings(input: Partial<SiteSettings>) {
  return apiPut<SiteSettings>("/api/settings", input);
}

export function resetSiteSettings() {
  return apiPost<SiteSettings>("/api/settings/reset");
}
