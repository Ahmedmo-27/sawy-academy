"use client";

import Link from "next/link";
import { useCallback } from "react";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { CourseProgressTrack } from "@/components/profile/CourseProgressTrack";
import { ProfileEmptyState } from "@/components/profile/ProfileEmptyState";
import { ProfileSectionShell } from "@/components/profile/ProfileSectionShell";
import { useAdminResource } from "@/hooks/useAdminResource";
import { fetchWithProgress } from "@/lib/load/withFetchProgress";
import type { Enrollment } from "@/lib/api/types";

function isCompleted(enrollment: Enrollment) {
  if (enrollment.completed === true) return true;
  if (enrollment.totalLessons <= 0) return false;
  return enrollment.completedLessons >= enrollment.totalLessons;
}

function continueHref(enrollment: Enrollment) {
  if (!enrollment.nextLessonSlug) {
    return `/courses/${enrollment.courseSlug}`;
  }
  return `/courses/${enrollment.courseSlug}/${enrollment.nextLessonSlug}`;
}

export function EnrolledCoursesSection() {
  const loader = useCallback(
    (onProgress: (progress: number, stepLabel?: string) => void) =>
      fetchWithProgress<Enrollment[]>(
        "/api/enrollments",
        "Fetching enrollments",
        onProgress,
        { userId: "me" }
      ),
    []
  );
  const { data, isLoading, error, progress, stepLabel, refetch } =
    useAdminResource(loader, "Loading enrollments");

  if (isLoading) {
    return (
      <div id="enrollments" className="scroll-mt-28 lg:scroll-mt-32">
        <AdminLoader
          label="Loading enrollments"
          stepLabel={stepLabel}
          progress={progress}
        />
      </div>
    );
  }

  if (error) {
    return (
      <ProfileSectionShell id="enrollments" label="Enrolled courses">
        <div className="hairline-border bg-concrete p-6 mt-4 sm:p-8">
          <p className="eyebrow text-clay">Unable to load courses</p>
          <p className="type-infill mt-3">{error}</p>
          <button
            type="button"
            className="action-primary mt-6"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      </ProfileSectionShell>
    );
  }

  if (!data?.length) {
    return (
      <div id="enrollments" className="scroll-mt-28 lg:scroll-mt-32">
        <ProfileEmptyState
          title="No enrolled courses on this sheet yet"
          message="Browse the drawing sets to begin. Verified enrollments will appear here once payment is confirmed."
          actionHref="/courses"
          actionLabel="Browse courses"
        />
      </div>
    );
  }

  const inProgress = data.filter((item) => !isCompleted(item)).length;
  const completedCount = data.length - inProgress;

  return (
    <ProfileSectionShell id="enrollments" label="Enrolled courses">
      <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2 hairline-b pb-4">
        <p className="type-infill">
          <span className="font-serif italic text-charcoal">
            {data.length}
          </span>{" "}
          drawing set{data.length === 1 ? "" : "s"} on register
        </p>
        <p className="label-caps text-charcoal-infill">
          {inProgress} in progress · {completedCount} complete
        </p>
      </div>

      <ul className="mt-px space-y-px bg-hairline">
        {data.map((enrollment) => {
          const completed = isCompleted(enrollment);

          return (
            <li
              key={enrollment.id}
              className={`bg-concrete p-6 sm:p-8 ${
                completed ? "opacity-85" : ""
              }`}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                    {enrollment.courseCode && (
                      <p className="label-caps text-charcoal-infill">
                        {enrollment.courseCode}
                      </p>
                    )}
                    {completed ? (
                      <p className="label-caps text-clay">Completed</p>
                    ) : (
                      <p className="label-caps text-charcoal/40">In progress</p>
                    )}
                  </div>
                  <h3 className="type-title mt-2 text-xl sm:text-2xl">
                    {enrollment.courseTitle}
                  </h3>
                  <CourseProgressTrack
                    className="mt-5 max-w-md"
                    completed={enrollment.completedLessons}
                    total={enrollment.totalLessons}
                  />
                </div>

                {!completed ? (
                  <Link
                    href={continueHref(enrollment)}
                    className="cta-entrance shrink-0 self-start lg:self-end"
                  >
                    Continue
                  </Link>
                ) : (
                  <Link
                    href={`/courses/${enrollment.courseSlug}`}
                    className="action-secondary shrink-0 self-start lg:self-end"
                  >
                    Review set
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </ProfileSectionShell>
  );
}
