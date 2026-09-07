import { apiDelete, apiGet, apiPost } from "@/lib/api/client";
import type { Enrollment } from "@/lib/api/types";

/**
 * GET /api/enrollments?userId=me → Enrollment[]
 *
 * Each row includes server-computed progress (completedLessons / totalLessons)
 * and an optional nextLessonSlug for the Continue link.
 */
export function listMyEnrollments() {
  return apiGet<Enrollment[]>("/api/enrollments", { userId: "me" });
}

export function getMyCourseEnrollment(courseKey: string) {
  return apiGet<Enrollment | null>(
    `/api/enrollments/courses/${encodeURIComponent(courseKey)}`
  );
}

export interface CompleteLessonResponse {
  success: boolean;
  enrollment: Enrollment | null;
}

export function completeLesson(courseKey: string, lessonKey: string) {
  return apiPost<CompleteLessonResponse>(
    `/api/enrollments/courses/${encodeURIComponent(
      courseKey
    )}/lessons/${encodeURIComponent(lessonKey)}/complete`
  );
}

export function uncompleteLesson(courseKey: string, lessonKey: string) {
  return apiDelete<CompleteLessonResponse>(
    `/api/enrollments/courses/${encodeURIComponent(
      courseKey
    )}/lessons/${encodeURIComponent(lessonKey)}/complete`
  );
}
