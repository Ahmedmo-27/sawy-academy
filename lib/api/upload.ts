import { apiUpload, apiUploadWithProgress } from "@/lib/api/client";

export interface UploadResponse {
  url: string;
  storage?: "local" | "r2-public" | "r2-private";
  objectKey?: string;
  fallback?: string;
}

export type UploadPurpose =
  | "website-asset"
  | "local"
  | "payment"
  | "service-reference";

export interface UploadImageOptions {
  onProgress?: (progress: number) => void;
  /** website-asset → public R2; payment/service-reference → private R2; local → /uploads. */
  purpose?: UploadPurpose;
  /** website-assets page folder (home, courses, services, …). */
  page?: string;
  /** Optional ObjectId subfolder under the page. */
  entityId?: string;
  /** Required for guest service-reference uploads (design request name). */
  guestName?: string;
}

export function uploadImage(file: File, options: UploadImageOptions = {}) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("purpose", options.purpose ?? "website-asset");
  if (options.page) {
    formData.set("page", options.page);
  }
  if (options.entityId) {
    formData.set("entityId", options.entityId);
  }
  if (options.guestName) {
    formData.set("guestName", options.guestName);
  }

  if (options.onProgress) {
    return apiUploadWithProgress<UploadResponse>("/api/upload", formData, {
      onProgress: options.onProgress,
    });
  }

  return apiUpload<UploadResponse>("/api/upload", formData);
}
