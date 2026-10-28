import Link from "next/link";
import { MediaBay } from "@/components/decorative/MediaBay";
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
      <p className="label-caps mb-6 text-charcoal font-semibold text-xs sm:text-sm tracking-wider">
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
              <span className="font-mono text-sm sm:text-base text-clay font-medium pt-0.5 sm:col-span-1">
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
              <span className="font-mono text-xs text-charcoal/60 pt-0.5 sm:col-span-2">
                {lesson.sheetRef}
              </span>
              <span className="font-serif text-lg sm:text-xl font-medium text-charcoal group-hover:text-clay transition-colors sm:col-span-5">
                {lesson.title}
              </span>
              <span className="text-sm sm:text-base font-medium text-charcoal/70 pt-0.5 sm:col-span-2 sm:text-right">
                {lesson.duration}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
