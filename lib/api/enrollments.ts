import { apiGet } from "@/lib/api/client";
import type { Enrollment } from "@/lib/api/types";

/**
 * Assumed GET /api/enrollments?userId=me → Enrollment[]
 *
 * Each row includes server-computed progress (completedLessons / totalLessons)
 * and an optional nextLessonSlug for the Continue link.
 */
// TODO: Confirm enrollments endpoint path and progress field names once student API ships.
export function listMyEnrollments() {
  return apiGet<Enrollment[]>("/api/enrollments", { userId: "me" });
}
