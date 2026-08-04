"use client";

import Link from "next/link";
import { AdminLoader } from "@/components/admin/AdminLoader";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { ProfileEmptyState } from "@/components/profile/ProfileEmptyState";
import { useAdminResource } from "@/hooks/useAdminResource";
import { listMyEnrollments } from "@/lib/api/enrollments";
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
  const { data, isLoading, error, refetch } = useAdminResource(listMyEnrollments);

  if (isLoading) {
    return <AdminLoader label="Loading enrollments" />;
  }

  if (error) {
    return (
      <ThresholdFrame label="ENROLLED COURSES" labelAsHeading>
        <div className="hairline-border bg-concrete p-8">
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
      </ThresholdFrame>
    );
  }

  if (!data?.length) {
    return (
      <ProfileEmptyState
        title="No enrolled courses on this sheet yet"
        message="Browse the drawing sets to begin. Verified enrollments will appear here once payment is confirmed."
        actionHref="/courses"
        actionLabel="Browse courses"
      />
    );
  }

  return (
    <ThresholdFrame label="ENROLLED COURSES" labelAsHeading>
      <ul className="mt-4 space-y-px bg-hairline">
        {data.map((enrollment) => {
          const completed = isCompleted(enrollment);

          return (
            <li
              key={enrollment.id}
              className={`bg-concrete p-6 sm:p-8 ${
                completed ? "opacity-80" : ""
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                    {enrollment.courseCode && (
                      <p className="label-caps text-charcoal-infill">
                        {enrollment.courseCode}
                      </p>
                    )}
                    {completed && (
                      <p className="label-caps text-clay">Completed</p>
                    )}
                  </div>
                  <h3 className="type-title text-xl mt-2">
                    {enrollment.courseTitle}
                  </h3>
                  <p className="type-infill mt-3">
                    {enrollment.completedLessons} of {enrollment.totalLessons}{" "}
                    lessons complete
                  </p>
                </div>

                {!completed && (
                  <Link
                    href={continueHref(enrollment)}
                    className="action-primary shrink-0 self-start"
                  >
                    Continue
                  </Link>
                )}
                {completed && (
                  <Link
                    href={`/courses/${enrollment.courseSlug}`}
                    className="action-secondary shrink-0 self-start"
                  >
                    Review set
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </ThresholdFrame>
  );
}
