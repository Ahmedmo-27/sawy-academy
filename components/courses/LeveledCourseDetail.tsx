"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { CompleteMarker } from "@/components/decorative/CompleteMarker";
import { LevelProgressLine } from "@/components/decorative/LevelProgressLine";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { useAuth } from "@/hooks/useAuth";
import {
  formatCourseDuration,
  type Course,
  type CourseGroup,
} from "@/lib/data/courses";
import {
  indexProgressByOrder,
  isLevelCompleted,
  resolveLevelAccess,
  stubTrackProgress,
  type LevelAccessState,
} from "@/lib/courseProgress";
import { formatSheetRef } from "@/lib/sheet";

interface LeveledCourseDetailProps {
  group: CourseGroup;
}

interface LevelRow {
  order: number;
  course: Course;
  sheetRef: string;
}

function LevelAction({
  state,
  course,
  message,
}: {
  state: LevelAccessState;
  course: Course;
  message?: string;
}) {
  if (state === "locked") {
    return (
      <p className="label-caps text-charcoal-infill max-w-[14rem] sm:text-right">
        {message}
      </p>
    );
  }

  if (state === "unlocked_completed") {
    return (
      <Link
        href={`/courses/${course.slug}`}
        className="action-secondary inline-flex items-center gap-2"
      >
        <CompleteMarker className="text-clay" />
        Review
      </Link>
    );
  }

  if (state === "unlocked_in_progress") {
    return (
      <Link href={`/courses/${course.slug}`} className="action-primary">
        Continue
      </Link>
    );
  }

  return (
    <EnrollButton
      id={course.id}
      name={course.title}
      price={course.price}
      category={course.level}
      label="Enroll"
      className="action-primary"
    />
  );
}

function LevelRowView({
  row,
  state,
  message,
  progress,
  isLast,
}: {
  row: LevelRow;
  state: LevelAccessState;
  message?: string;
  progress: number;
  isLast: boolean;
}) {
  const locked = state === "locked";
  const completed = state === "unlocked_completed";
  const duration = formatCourseDuration(row.course);

  return (
    <li className="relative flex gap-4 sm:gap-6">
      {/* Progression rail — ScaleBar language as a vertical sequence */}
      <div className="flex flex-col items-center w-4 shrink-0 pt-1" aria-hidden="true">
        <span
          className={`w-2 h-2 border ${
            completed
              ? "border-clay bg-clay/30"
              : locked
                ? "border-hairline bg-transparent"
                : "border-charcoal bg-concrete"
          }`}
        />
        {!isLast && (
          <span
            className={`flex-1 w-px min-h-[3rem] mt-1 ${
              locked ? "bg-hairline/60" : "bg-hairline"
            }`}
          />
        )}
      </div>

      <div
        className={`flex-1 grid grid-cols-12 gap-4 py-6 ${
          !isLast ? "hairline-b" : ""
        } ${locked ? "opacity-50" : ""}`}
      >
        <div className="col-span-12 sm:col-span-7">
          <p className="dim-label mb-2">{row.sheetRef}</p>
          <h2 className="type-title text-base mb-2">
            {locked ? (
              <span>{row.course.title}</span>
            ) : (
              <Link
                href={`/courses/${row.course.slug}`}
                className="hover:text-clay transition-colors duration-200"
              >
                {row.course.title}
              </Link>
            )}
          </h2>
          <p className="type-infill leading-relaxed max-w-lg">
            {row.course.description}
          </p>
          {(state === "unlocked_in_progress" ||
            state === "unlocked_completed") && (
            <LevelProgressLine
              progress={progress}
              className="mt-4 max-w-[140px]"
            />
          )}
        </div>

        <div className="col-span-12 sm:col-span-5 flex flex-col sm:items-end gap-3">
          <span className="label-caps">{row.course.level}</span>
          <span className="label-caps text-charcoal-infill">{duration}</span>
          {/* Per-level price — mock data prices levels individually */}
          <span className="type-body text-charcoal">{row.course.price}</span>
          {completed && (
            <span className="inline-flex items-center gap-2 label-caps text-clay">
              <CompleteMarker />
              Complete
            </span>
          )}
          <LevelAction
            state={state}
            course={row.course}
            message={message}
          />
        </div>
      </div>
    </li>
  );
}

/**
 * Leveled programme detail — gated vertical progression.
 * Lock state is computed in lib/courseProgress (not hardcoded per level).
 */
export function LeveledCourseDetail({ group }: LeveledCourseDetailProps) {
  const { isAuthenticated } = useAuth();
  const instructor = group.courses[0]?.instructor ?? "";

  const levels: LevelRow[] = useMemo(
    () =>
      group.courses.map((course, i) => ({
        order: i + 1,
        course,
        sheetRef: formatSheetRef(i, "L"),
      })),
    [group.courses]
  );

  const progressByOrder = useMemo(() => {
    const records = stubTrackProgress(
      group.slug,
      group.courses.map((c) => c.id)
    );
    return indexProgressByOrder(
      levels.map((l) => ({
        order: l.order,
        courseId: l.course.id,
        courseSlug: l.course.slug,
      })),
      records
    );
  }, [group.slug, group.courses, levels]);

  return (
    <div className="space-y-16 lg:space-y-20">
      <div className="hairline-border p-6 lg:p-10">
        <ScaleBar scale="1:100" className="mb-4 max-w-[120px]" />
        <p className="label-caps mb-2">Leveled progression</p>
        <p className="type-infill max-w-xl leading-relaxed">{group.subtitle}</p>
        <p className="type-infill mt-4 max-w-xl leading-relaxed text-charcoal-muted">
          {instructor}. Each level unlocks only after the previous level is
          completed.
        </p>
        <div className="flex gap-2 mt-6 max-w-xs">
          {levels.map((level) => (
            <LevelProgressLine
              key={level.course.id}
              progress={level.order / levels.length}
              className="flex-1"
            />
          ))}
        </div>
      </div>

      <ThresholdFrame label={`Level index — ${group.title}`}>
        <div className="hairline-border p-6 lg:p-10 mt-4">
          <ScaleBar scale="1:50" className="mb-6 max-w-[120px]" />
          <p className="label-caps mb-8 text-charcoal-infill">
            Sequence — {String(levels.length).padStart(2, "0")} levels
          </p>
          <ol className="list-none p-0 m-0">
            {levels.map((row, i) => {
              const previousCompleted =
                row.order <= 1 ||
                (isAuthenticated &&
                  isLevelCompleted(progressByOrder, row.order - 1));

              const access = resolveLevelAccess({
                levelOrder: row.order,
                isAuthenticated,
                previousLevelCompleted: previousCompleted,
                current: progressByOrder.get(row.order) ?? null,
              });

              return (
                <LevelRowView
                  key={row.course.id}
                  row={row}
                  state={access.state}
                  message={access.message}
                  progress={access.progress}
                  isLast={i === levels.length - 1}
                />
              );
            })}
          </ol>
        </div>
      </ThresholdFrame>
    </div>
  );
}
