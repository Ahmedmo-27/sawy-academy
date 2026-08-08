import { apiGet } from "@/lib/api/client";

export interface LessonVideoAccess {
  lessonId: string;
  videoId: string;
  embedUrl: string;
  watermarkText: string;
}

export function getLessonVideoAccess(lessonId: string) {
  return apiGet<LessonVideoAccess>(
    `/api/lessons/${encodeURIComponent(lessonId)}/video-access`
  );
}
