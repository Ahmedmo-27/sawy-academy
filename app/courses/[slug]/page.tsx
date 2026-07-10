import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { CourseMaterials } from "@/components/courses/CourseMaterials";
import { CourseSheetIndex } from "@/components/courses/CourseSheetIndex";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { SectionCutDivider } from "@/components/decorative/SectionCutDivider";
import { LevelProgressLine } from "@/components/decorative/LevelProgressLine";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { getAllCourses, getCourseBySlug } from "@/lib/data/courses";
import { parseLevelProgress } from "@/lib/motion";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllCourses().map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) return { title: "Course" };
  return {
    title: `${course.title} — Sawy Academy`,
    description: course.description,
  };
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  return (
    <>
      <PageHeader
        eyebrow={`${course.level} · ${course.price}`}
        title={course.title}
        description={`${course.instructor}. ${course.description}`}
      />

      <ThresholdDoorway label="DRAWING SET" />

      <Section rhythm="standard" contained={false}>
        <PageContainer className="space-y-16 lg:space-y-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <ScaleBar scale="1:100" className="mb-4 max-w-[120px]" />
              <p className="label-caps mb-2">{course.level}</p>
              <LevelProgressLine
                progress={parseLevelProgress(course.level)}
                className="max-w-[160px]"
              />
            </div>
            <EnrollButton
              id={course.id}
              name={course.title}
              price={course.price}
              label="Enroll in course"
            />
          </div>

          <ThresholdFrame label={`Bay — ${course.title}`}>
            <div className="hairline-border p-6 lg:p-10 mt-4">
              <CourseSheetIndex
                courseSlug={course.slug}
                lessons={course.lessons}
              />
            </div>
          </ThresholdFrame>

          {course.relatedProductIds.length > 0 && (
            <>
              <SectionCutDivider label="MATERIALS" />
              <div>
                <ScaleBar scale="1:50" className="mb-6 max-w-[120px]" />
                <p className="eyebrow mb-2">Specified equipment</p>
                <h2 className="type-heading mb-8">Materials &amp; tools</h2>
                <ThresholdFrame label="Stock list — Course">
                  <div className="pt-4">
                    <CourseMaterials
                      relatedProductIds={course.relatedProductIds}
                    />
                  </div>
                </ThresholdFrame>
              </div>
            </>
          )}
        </PageContainer>
      </Section>
    </>
  );
}
