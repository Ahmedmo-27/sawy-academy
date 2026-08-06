import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "@/lib/api/client";
import type { Course, Lesson, Product } from "@/lib/api/types";
import { toSlug } from "@/lib/slug";

export type CourseInput = Pick<
  Course,
  "id" | "title" | "description" | "level" | "instructor" | "price"
> & {
  relatedProductIds?: string[];
};

export type LessonInput = Pick<
  Lesson,
  "sheetRef" | "title" | "duration" | "order"
> &
  Partial<Pick<Lesson, "id" | "slug" | "summary" | "content" | "videoUrl">>;

/** Business product code from a string id or populated Product. */
export function relatedProductIdOf(value: string | Product): string {
  return typeof value === "string" ? value : value.id;
}

export function relatedProductIdsOf(course: Course): string[] {
  return (course.relatedProductIds ?? []).map(relatedProductIdOf).filter(Boolean);
}

export function lessonSlugOf(lesson: Lesson): string {
  return lesson.slug || toSlug(lesson.title);
}

export function getLessonBySlug(
  course: Course,
  lessonSlug: string
): Lesson | undefined {
  return (course.lessons ?? []).find(
    (lesson) => lessonSlugOf(lesson) === lessonSlug
  );
}

export function formatCourseDuration(course: Course): string {
  const lessons = course.lessons ?? [];
  const totalMinutes = lessons.reduce((sum, lesson) => {
    const match = lesson.duration.match(/(\d+)/);
    return sum + (match ? Number(match[1]) : 0);
  }, 0);
  if (totalMinutes <= 0) {
    return `${String(lessons.length).padStart(2, "0")} sheets`;
  }
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${totalMinutes} min`;
}

export function listCourses(options?: {
  onProgress?: (progress: number) => void;
}) {
  return apiGet<Course[]>("/api/courses", undefined, options);
}

export function getCourse(
  slug: string,
  options?: { onProgress?: (progress: number) => void }
) {
  return apiGet<Course>(`/api/courses/${slug}`, undefined, options);
}

export function createCourse(input: CourseInput) {
  return apiPost<Course>("/api/courses", input);
}

export function updateCourse(slug: string, input: CourseInput) {
  return apiPut<Course>(`/api/courses/${slug}`, input);
}

export function deleteCourse(slug: string) {
  return apiDelete<Course>(`/api/courses/${slug}`);
}

// TODO: Confirm lesson endpoints once the real Lesson controller is added.
export function listLessons(courseSlug: string) {
  return apiGet<Lesson[]>(`/api/courses/${courseSlug}/lessons`);
}

export function createLesson(courseSlug: string, input: LessonInput) {
  return apiPost<Lesson>(`/api/courses/${courseSlug}/lessons`, input);
}

export function updateLesson(
  courseSlug: string,
  lessonId: string,
  input: LessonInput
) {
  return apiPut<Lesson>(
    `/api/courses/${courseSlug}/lessons/${lessonId}`,
    input
  );
}

export function deleteLesson(courseSlug: string, lessonId: string) {
  return apiDelete<Lesson>(`/api/courses/${courseSlug}/lessons/${lessonId}`);
}

export function reorderLessons(courseSlug: string, lessonIds: string[]) {
  return apiPatch<Lesson[]>(`/api/courses/${courseSlug}/lessons/reorder`, {
    lessonIds,
  });
}
