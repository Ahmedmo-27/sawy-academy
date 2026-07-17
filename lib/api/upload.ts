import { apiUpload } from "@/lib/api/client";

export interface UploadResponse {
  url: string;
}

// TODO: Confirm R2 upload response shape and multipart field name.
export function uploadImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  return apiUpload<UploadResponse>("/api/upload", formData);
}
