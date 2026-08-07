import Link from "next/link";
import { MediaBay } from "@/components/decorative/MediaBay";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { lessonSlugOf } from "@/lib/api/courses";
import type { Lesson } from "@/lib/api/types";

interface CourseSheetIndexProps {
  courseSlug: string;
  lessons: Lesson[];
}

export function CourseSheetIndex({
  courseSlug,
  lessons,
}: CourseSheetIndexProps) {
  return (
    <div>
      <ScaleBar scale="1:100" className="mb-6 max-w-[120px]" />
      <p className="label-caps mb-6 text-charcoal-infill">
        Sheet index — {String(lessons.length).padStart(2, "0")} drawings
      </p>
      <ul>
        {lessons.map((lesson, i) => (
          <li key={lesson.id}>
            <Link
              href={`/courses/${courseSlug}/${lessonSlugOf(lesson)}`}
              className={`group grid grid-cols-1 gap-3 py-6 transition-colors duration-200 hover:bg-concrete-dark/40 sm:grid-cols-12 sm:items-center sm:gap-4 sm:py-5 ${
                i > 0 ? "hairline-t" : ""
              }`}
            >
              <span className="label-caps text-clay pt-0.5 sm:col-span-1">
                {String(lesson.order).padStart(2, "0")}
              </span>
              <span className="sm:col-span-2">
                <MediaBay
                  src={lesson.previewImage}
                  alt={lesson.title}
                  className="aspect-square max-w-[5.5rem] sm:max-w-[4.5rem]"
                  fallback="course"
                  fallbackLabel={lesson.sheetRef}
                />
              </span>
              <span className="dim-label pt-0.5 sm:col-span-2">
                {lesson.sheetRef}
              </span>
              <span className="type-title text-base group-hover:text-charcoal transition-colors sm:col-span-5">
                {lesson.title}
              </span>
              <span className="label-caps pt-0.5 sm:col-span-2 sm:text-right">
                {lesson.duration}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
