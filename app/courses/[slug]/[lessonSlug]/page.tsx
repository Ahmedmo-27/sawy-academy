import { notFound } from "next/navigation";
import { SpecifiedMaterialsStrip } from "@/components/courses/CourseMaterials";
import { LessonNav } from "@/components/courses/LessonNav";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { GridColumns } from "@/components/decorative/GridColumns";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import {
  getAllCourses,
  getCourseBySlug,
  getLessonBySlug,
} from "@/lib/data/courses";

interface LessonPageProps {
  params: Promise<{ slug: string; lessonSlug: string }>;
}

export function generateStaticParams() {
  return getAllCourses().flatMap((course) =>
    course.lessons.map((lesson) => ({
      slug: course.slug,
      lessonSlug: lesson.slug,
    }))
  );
}

export async function generateMetadata({ params }: LessonPageProps) {
  const { slug, lessonSlug } = await params;
  const course = getCourseBySlug(slug);
  const lesson = course ? getLessonBySlug(course, lessonSlug) : undefined;
  if (!lesson || !course) return { title: "Lesson" };
  return {
    title: `${lesson.sheetRef} ${lesson.title} — ${course.title}`,
    description: lesson.summary,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonSlug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  const lesson = getLessonBySlug(course, lessonSlug);
  if (!lesson) notFound();

  const index = course.lessons.findIndex((l) => l.id === lesson.id);
  const prev = index > 0 ? course.lessons[index - 1] : undefined;
  const next =
    index < course.lessons.length - 1
      ? course.lessons[index + 1]
      : undefined;

  const paragraphs = lesson.content.split(/\n\n+/).filter(Boolean);

  return (
    <>
      <header className="relative section-intimate overflow-hidden">
        <GridColumns />
        <PageContainer className="relative z-10 pt-24 lg:pt-32 pb-8 lg:pb-12">
          <p className="eyebrow mb-3">
            {course.title} · Sheet {String(lesson.order).padStart(2, "0")}
          </p>
          <h1 className="type-display max-w-4xl mb-8">{lesson.title}</h1>

          <div className="hairline-border p-6 lg:p-8 max-w-2xl bg-concrete/80">
            <ScaleBar scale="1:50" className="mb-6 max-w-[120px]" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="label-caps mb-2">Sheet</p>
                <p className="dim-label !text-base">{lesson.sheetRef}</p>
              </div>
              <div>
                <p className="label-caps mb-2">Duration</p>
                <p className="type-infill">{lesson.duration}</p>
              </div>
              <div>
                <p className="label-caps mb-2">Level</p>
                <p className="type-infill">{course.level}</p>
              </div>
              <div>
                <p className="label-caps mb-2">Set</p>
                <p className="type-infill">
                  {String(lesson.order).padStart(2, "0")} /{" "}
                  {String(course.lessons.length).padStart(2, "0")}
                </p>
              </div>
            </div>
          </div>
        </PageContainer>
      </header>

      <ThresholdDoorway label={lesson.sheetRef} />

      <Section rhythm="standard" contained={false}>
        <PageContainer>
          <ThresholdFrame label={`Drawing — ${lesson.sheetRef}`}>
            <article className="hairline-border p-6 lg:p-10 mt-4 max-w-3xl">
              <p className="type-lead mb-10">{lesson.summary}</p>

              <div className="space-y-6">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)} className="type-body">
                    {paragraph}
                  </p>
                ))}
              </div>

              {lesson.videoUrl && (
                <div className="mt-10 hairline-t pt-8">
                  <p className="label-caps mb-3">Reference recording</p>
                  <a
                    href={lesson.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-secondary"
                  >
                    Open video
                  </a>
                </div>
              )}

              {course.relatedProductIds.length > 0 && (
                <div className="mt-12 hairline-t pt-8">
                  <SpecifiedMaterialsStrip
                    relatedProductIds={course.relatedProductIds}
                  />
                </div>
              )}

              <div className="mt-12">
                <LessonNav courseSlug={course.slug} prev={prev} next={next} />
              </div>
            </article>
          </ThresholdFrame>
        </PageContainer>
      </Section>
    </>
  );
}
