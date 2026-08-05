import { apiGet } from "@/lib/api/client";

type ProgressReporter = (progress: number, stepLabel?: string) => void;

export function fetchWithProgress<T>(
  path: string,
  stepLabel: string,
  onProgress: ProgressReporter,
  query?: Record<string, string | number | boolean | undefined | null>
) {
  onProgress(0, stepLabel);
  return apiGet<T>(path, query, {
    onProgress: (progress) => onProgress(progress, stepLabel),
  });
}
