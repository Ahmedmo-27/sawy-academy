import Link from "next/link";
import { lessonSlugOf } from "@/lib/api/courses";
import type { Lesson } from "@/lib/api/types";

interface LessonCourseRailProps {
  courseSlug: string;
  courseTitle: string;
  lessons: Lesson[];
  currentLessonId: string;
}

export function LessonCourseRail({
  courseSlug,
  courseTitle,
  lessons,
  currentLessonId,
}: LessonCourseRailProps) {
  const currentIndex = lessons.findIndex(
    (lesson) => lesson.id === currentLessonId
  );
  const position = currentIndex >= 0 ? currentIndex + 1 : 1;
  const positionPercent =
    lessons.length > 0 ? Math.round((position / lessons.length) * 100) : 0;

  return (
    <aside
      className="bg-charcoal p-[1.25rem] text-concrete lg:p-[1.5rem] xl:sticky xl:top-28 xl:max-h-[calc(100svh-8rem)] xl:overflow-y-auto xl:[scrollbar-color:var(--color-charcoal-infill)_transparent] xl:[scrollbar-width:thin]"
      aria-label="Course lesson index"
    >
      <div className="border-b border-concrete/15 pb-[1.5rem]">
        <Link
          href={`/courses/${courseSlug}`}
          className="label-caps !text-concrete/55 transition-colors hover:!text-concrete"
        >
          Course index
        </Link>
        <h2 className="mt-[0.75rem] font-serif text-[1.35rem] leading-[1.2] text-concrete">
          {courseTitle}
        </h2>

        <div className="mt-[1.5rem] flex items-center justify-between gap-[1rem]">
          <p className="label-caps !text-concrete/60">Course position</p>
          <p className="dim-label !text-clay-muted">{positionPercent}%</p>
        </div>
        <div
          className="mt-2 h-1 overflow-hidden bg-concrete/10"
          role="progressbar"
          aria-label="Current position in course"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={positionPercent}
        >
          <div
            className="h-full bg-clay-muted transition-[width] duration-500"
            style={{ width: `${positionPercent}%` }}
          />
        </div>
      </div>

      <ol className="mt-[1.25rem] space-y-[0.75rem]">
        {lessons.map((item, itemIndex) => {
          const active = item.id === currentLessonId;

          return (
            <li key={item.id}>
              <Link
                href={`/courses/${courseSlug}/${lessonSlugOf(item)}`}
                aria-current={active ? "page" : undefined}
                className={`group grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-center gap-[0.875rem] border p-[0.875rem] transition-colors ${
                  active
                    ? "border-clay-muted/60 bg-concrete/12"
                    : "border-concrete/10 bg-concrete/5 hover:border-concrete/25 hover:bg-concrete/10"
                }`}
              >
                <span
                  className={`flex h-[3rem] w-[3rem] items-center justify-center font-sans text-xs tabular-nums ${
                    active
                      ? "bg-clay text-concrete"
                      : "bg-concrete/10 text-concrete/65"
                  }`}
                  aria-hidden="true"
                >
                  {String(itemIndex + 1).padStart(2, "0")}
                </span>

                <span className="min-w-0">
                  <span className="block truncate font-serif text-[0.95rem] leading-[1.25] text-concrete">
                    {item.title}
                  </span>
                  <span className="mt-[0.5rem] grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-[0.75rem]">
                    <span className="label-caps truncate !text-concrete/45">
                      Video · {item.sheetRef}
                    </span>
                    <span className="label-caps whitespace-nowrap !text-concrete/45">
                      {item.duration}
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
