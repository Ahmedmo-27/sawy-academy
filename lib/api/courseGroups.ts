import { ApiClientError, apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { Course, CourseGroup } from "@/lib/api/types";

export type CourseGroupInput = {
  title: string;
  subtitle: string;
  type: CourseGroup["type"];
  bundlePrice?: string;
  courses?: string[];
};

function normalizeGroupId(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value === "object" && value !== null && "toString" in value) {
    const asString = String(value);
    return asString === "[object Object]" ? "" : asString.trim();
  }
  return "";
}

export function listCourseGroups() {
  return apiGet<CourseGroup[]>("/api/courses/groups");
}

// Backend currently exposes list-only (`GET /api/courses/groups`).
// Resolve a single group from that register until a per-id route exists.
export async function getCourseGroup(id: string) {
  const target = normalizeGroupId(id);
  const groups = await listCourseGroups();
  const found = groups.find((group) => {
    const candidates = [group._id, group.id].map(normalizeGroupId);
    return candidates.includes(target);
  });

  if (!found) {
    throw new ApiClientError("Course group not found", 404);
  }

  return found;
}

export function createCourseGroup(input: CourseGroupInput) {
  return apiPost<CourseGroup>("/api/courses/groups", input);
}

export function updateCourseGroup(id: string, input: CourseGroupInput) {
  return apiPut<CourseGroup>(`/api/courses/groups/${id}`, input);
}

export function deleteCourseGroup(id: string) {
  return apiDelete<CourseGroup>(`/api/courses/groups/${id}`);
}

function courseMatchKeys(course: Course | string) {
  if (typeof course === "string") {
    return [course];
  }

  return [course._id, course.id, course.slug].filter(Boolean) as string[];
}

export function findGroupForCourse(
  groups: CourseGroup[],
  course: Course | string
) {
  const keys = new Set(
    typeof course === "string" ? [course] : courseMatchKeys(course)
  );

  return (
    groups.find((group) =>
      (group.courses ?? []).some((item) =>
        courseMatchKeys(item).some((key) => keys.has(key))
      )
    ) ?? null
  );
}

export async function assignCourseToGroup(
  courseKey: string,
  nextGroupId: string | undefined,
  courseMongoId?: string
) {
  const groups = await listCourseGroups();
  const membershipId = courseMongoId ?? courseKey;

  await Promise.all(
    groups.map(async (group) => {
      const groupId = group._id ?? group.id;
      if (!groupId) return;

      const currentIds = (group.courses ?? []).map((item) =>
        typeof item === "string" ? item : item._id ?? item.id
      );
      const withoutCourse = currentIds.filter(
        (id) => id !== membershipId && id !== courseKey
      );

      const shouldInclude = Boolean(nextGroupId) && groupId === nextGroupId;
      const nextCourses = shouldInclude
        ? [...withoutCourse, membershipId]
        : withoutCourse;

      const unchanged =
        nextCourses.length === currentIds.length &&
        nextCourses.every((id, index) => id === currentIds[index]);

      if (unchanged) return;

      await updateCourseGroup(groupId, {
        title: group.title,
        subtitle: group.subtitle,
        type: group.type,
        bundlePrice: group.bundlePrice,
        courses: nextCourses,
      });
    })
  );
}
