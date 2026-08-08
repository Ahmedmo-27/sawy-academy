import Link from "next/link";
import { AsyncState } from "@/components/feedback/AsyncState";
import { CourseProgressTrack } from "@/components/profile/CourseProgressTrack";
import type { DashboardResource } from "@/lib/api/studentDashboard";
import type { Enrollment } from "@/lib/api/types";

interface ContinueLearningCardProps {
  enrollments: DashboardResource<Enrollment[]>;
}

function isCompleted(enrollment: Enrollment) {
  if (enrollment.completed === true) return true;
  return (
    enrollment.totalLessons > 0 &&
    enrollment.completedLessons >= enrollment.totalLessons
  );
}

function continueHref(enrollment: Enrollment) {
  return enrollment.nextLessonSlug
    ? `/courses/${enrollment.courseSlug}/${enrollment.nextLessonSlug}`
    : `/courses/${enrollment.courseSlug}`;
}

export function ContinueLearningCard({
  enrollments,
}: ContinueLearningCardProps) {
  if (!enrollments.data) {
    return (
      <AsyncState
        kind="error"
        eyebrow="Learning unavailable"
        title="Course progress could not be loaded"
        message={enrollments.error ?? "Your enrollment register is unavailable."}
        actionHref="/dashboard/profile#enrollments"
        actionLabel="Open enrollments"
      />
    );
  }

  const next = enrollments.data.find((enrollment) => !isCompleted(enrollment));

  if (!next) {
    return (
      <AsyncState
        eyebrow={enrollments.data.length ? "Drawing sets complete" : "Start learning"}
        title={
          enrollments.data.length
            ? "You are caught up"
            : "No active course yet"
        }
        message={
          enrollments.data.length
            ? "Every course currently on your register is complete. You can review a set or choose another course."
            : "Browse the course catalogue to add your first drawing set."
        }
        actionHref={enrollments.data.length ? "/dashboard/profile#enrollments" : "/courses"}
        actionLabel={enrollments.data.length ? "Review courses" : "Browse courses"}
      />
    );
  }

  return (
    <article className="hairline-border relative overflow-hidden bg-concrete/80 p-6 sm:p-8 lg:p-10">
      <span
        className="absolute left-0 top-0 h-px w-20 bg-clay"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="eyebrow text-clay">Continue learning</p>
            {next.courseCode && (
              <p className="label-caps text-charcoal-infill">
                {next.courseCode}
              </p>
            )}
          </div>
          <h2 className="type-title mt-3 font-serif text-2xl font-light sm:text-3xl">
            {next.courseTitle}
          </h2>
          <CourseProgressTrack
            className="mt-6 max-w-xl"
            completed={next.completedLessons}
            total={next.totalLessons}
          />
        </div>
        <Link
          href={continueHref(next)}
          className="cta-entrance inline-flex min-h-11 shrink-0 items-center self-start lg:self-end"
        >
          Continue course
        </Link>
      </div>
    </article>
  );
}
