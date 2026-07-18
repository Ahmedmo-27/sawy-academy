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
      <p className="label-caps mb-6 text-charcoal-infill">
        Sheet index — {String(lessons.length).padStart(2, "0")} drawings
      </p>
      <ul>
        {lessons.map((lesson, i) => (
          <li key={lesson.id}>
            <Link
              href={`/courses/${courseSlug}/${lesson.slug}`}
              className={`group grid grid-cols-12 gap-4 py-5 transition-colors duration-200 hover:bg-concrete-dark/40 ${
                i > 0 ? "hairline-t" : ""
              }`}
            >
              <span className="col-span-2 sm:col-span-1 label-caps text-clay pt-0.5">
                {String(lesson.order).padStart(2, "0")}
              </span>
              <span className="col-span-3 sm:col-span-2 dim-label pt-0.5">
                {lesson.sheetRef}
              </span>
              <span className="col-span-7 sm:col-span-7 type-title text-base group-hover:text-charcoal transition-colors">
                {lesson.title}
              </span>
              <span className="col-span-12 sm:col-span-2 label-caps sm:text-right pt-0.5">
                {lesson.duration}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
