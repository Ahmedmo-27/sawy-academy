import Link from "next/link";
import { lessonSlugOf } from "@/lib/api/courses";
import type { Lesson } from "@/lib/api/types";

interface LessonNavProps {
  courseSlug: string;
  prev?: Lesson;
  next?: Lesson;
}

export function LessonNav({ courseSlug, prev, next }: LessonNavProps) {
  return (
    <nav
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 hairline-t pt-8"
      aria-label="Lesson navigation"
    >
      {prev ? (
        <Link
          href={`/courses/${courseSlug}/${lessonSlugOf(prev)}`}
          className="action-secondary"
        >
          ← {prev.sheetRef} · {prev.title}
        </Link>
      ) : (
        <Link href={`/courses/${courseSlug}`} className="action-secondary">
          ← Sheet index
        </Link>
      )}
      {next ? (
        <Link
          href={`/courses/${courseSlug}/${lessonSlugOf(next)}`}
          className="action-primary sm:ml-auto"
        >
          {next.sheetRef} · {next.title} →
        </Link>
      ) : (
        <Link href={`/courses/${courseSlug}`} className="action-primary sm:ml-auto">
          Back to course →
        </Link>
      )}
    </nav>
  );
}
