import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "@/lib/api/client";
import type { Course, Lesson } from "@/lib/api/types";

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

export function listCourses() {
  return apiGet<Course[]>("/api/courses");
}

export function getCourse(slug: string) {
  return apiGet<Course>(`/api/courses/${slug}`);
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
