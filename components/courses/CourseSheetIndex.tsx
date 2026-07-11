import Link from "next/link";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import type { Lesson } from "@/lib/data/courses";

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
      <p className="label-caps mb-6 text-charcoal-infill/70">
        Sheet index — {String(lessons.length).padStart(2, "0")} drawings
      </p>
      <ul>
        {lessons.map((lesson, i) => (
          <li key={lesson.id}>
            <Link
              href={`/courses/${courseSlug}/${lesson.slug}`}
              className={`group block sm:grid sm:grid-cols-12 sm:gap-4 py-5 transition-colors duration-200 hover:bg-concrete-dark/40 ${
                i > 0 ? "hairline-t" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2 sm:contents">
                <span className="label-caps text-clay sm:col-span-1 sm:pt-0.5">
                  {String(lesson.order).padStart(2, "0")}
                </span>
                <span className="dim-label sm:col-span-2 sm:pt-0.5">
                  {lesson.sheetRef}
                </span>
                <span className="label-caps sm:hidden">{lesson.duration}</span>
              </div>
              <span className="type-title text-base block sm:col-span-7 group-hover:text-charcoal transition-colors leading-snug">
                {lesson.title}
              </span>
              <span className="hidden sm:block sm:col-span-2 label-caps sm:text-right sm:pt-0.5">
                {lesson.duration}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
