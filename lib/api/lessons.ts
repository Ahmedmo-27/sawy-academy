import { apiGet, apiPost, apiUploadWithProgress } from "@/lib/api/client";

export interface LessonVideoAccess {
  lessonId: string;
  manifestUrl: string;
  expiresAt: string;
  watermarkText: string;
}

export interface LessonVideoUpload {
  lessonId: string;
  assetId: string;
  jobId: string;
  status: "queued";
  generation: number;
}

export type LessonVideoRetry = Omit<LessonVideoUpload, "generation">;

export type LessonVideoProcessingStatus =
  | "none"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export interface LessonVideoProcessing {
  lessonId: string;
  assetId: string | null;
  generation: number | null;
  status: LessonVideoProcessingStatus | "uploading" | "superseded";
  processingStatus: LessonVideoProcessingStatus;
  attempts: number;
  maxAttempts: number;
  availableAt: string | null;
  error: { code?: string; message?: string; at?: string } | null;
  renditions: Array<{
    name: string;
    width: number;
    height: number;
    bandwidth: number;
  }>;
  readyAt: string | null;
}

interface LessonVideoAccessResponse {
  lessonId: string;
  signedUrl: string;
  expiresAt: string;
  watermarkText: string;
}

export async function getLessonVideoAccess(lessonId: string) {
  const access = await apiGet<LessonVideoAccessResponse>(
    `/api/lessons/${encodeURIComponent(lessonId)}/video-access`
  );
  return {
    lessonId: access.lessonId,
    manifestUrl: access.signedUrl,
    expiresAt: access.expiresAt,
    watermarkText: access.watermarkText,
  } satisfies LessonVideoAccess;
}

export async function uploadLessonVideo(
  courseSlug: string,
  lessonId: string,
  file: File,
  onProgress?: (
    progress: number,
    phase?: import("@/lib/api/client").UploadProgressPhase
  ) => void
) {
  const intent = await apiPost<{ token: string; uploadUrl: string }>(
    `/api/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(
      lessonId
    )}/video/intent`
  );
  const formData = new FormData();
  formData.set("video", file);

  return apiUploadWithProgress<LessonVideoUpload>(intent.uploadUrl, formData, {
    onProgress,
    bearerToken: intent.token,
    uploadGrant: true,
  });
}

export interface LessonDocumentUpload {
  lessonId: string;
  assetId: string;
  generation: number;
  filename: string;
  status: "ready";
  documentAvailable: true;
}

export async function uploadLessonDocument(
  courseSlug: string,
  lessonId: string,
  file: File,
  onProgress?: (
    progress: number,
    phase?: import("@/lib/api/client").UploadProgressPhase
  ) => void
) {
  const intent = await apiPost<{ token: string; uploadUrl: string }>(
    `/api/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(
      lessonId
    )}/document/intent`
  );
  const formData = new FormData();
  formData.set("document", file);

  return apiUploadWithProgress<LessonDocumentUpload>(
    intent.uploadUrl,
    formData,
    {
      onProgress,
      bearerToken: intent.token,
      uploadGrant: true,
    }
  );
}

export function getLessonVideoProcessingStatus(
  courseSlug: string,
  lessonId: string
) {
  return apiGet<LessonVideoProcessing>(
    `/api/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(
      lessonId
    )}/video/status`
  );
}

export function retryLessonVideoProcessing(
  courseSlug: string,
  lessonId: string
) {
  return apiPost<LessonVideoRetry>(
    `/api/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(
      lessonId
    )}/video/retry`
  );
}

export async function pollLessonVideoProcessing(
  courseSlug: string,
  lessonId: string,
  options: {
    signal?: AbortSignal;
    intervalMs?: number;
    onStatus?: (status: LessonVideoProcessing) => void;
  } = {}
) {
  const intervalMs = options.intervalMs ?? 2_500;

  while (!options.signal?.aborted) {
    const status = await getLessonVideoProcessingStatus(courseSlug, lessonId);
    if (options.signal?.aborted) break;
    options.onStatus?.(status);
    if (status.processingStatus === "ready" || status.processingStatus === "failed") {
      return status;
    }

    await new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(timeout);
        reject(new DOMException("Polling cancelled", "AbortError"));
      };
      const timeout = setTimeout(() => {
        options.signal?.removeEventListener("abort", onAbort);
        resolve();
      }, intervalMs);
      options.signal?.addEventListener("abort", onAbort, { once: true });
    });
  }

  throw new DOMException("Polling cancelled", "AbortError");
}
