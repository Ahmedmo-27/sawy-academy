import { apiUpload, apiUploadWithProgress } from "@/lib/api/client";

export interface UploadResponse {
  url: string;
}

export interface UploadImageOptions {
  onProgress?: (progress: number) => void;
}

// TODO: Confirm R2 upload response shape and multipart field name.
export function uploadImage(file: File, options: UploadImageOptions = {}) {
  const formData = new FormData();
  formData.set("file", file);

  if (options.onProgress) {
    return apiUploadWithProgress<UploadResponse>("/api/upload", formData, {
      onProgress: options.onProgress,
    });
  }

  return apiUpload<UploadResponse>("/api/upload", formData);
}
