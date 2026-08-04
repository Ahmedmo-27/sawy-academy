import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { CourseMaterials } from "@/components/courses/CourseMaterials";
import { CourseSheetIndex } from "@/components/courses/CourseSheetIndex";
import { DiplomaCourseDetail } from "@/components/courses/DiplomaCourseDetail";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { LeveledCourseDetail } from "@/components/courses/LeveledCourseDetail";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { SectionCutDivider } from "@/components/decorative/SectionCutDivider";
import { LevelProgressLine } from "@/components/decorative/LevelProgressLine";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import {
  getAllCourses,
  getCourseBySlug,
  getCourseGroupBySlug,
  courseGroups,
  type Course,
  type CourseGroup,
} from "@/lib/data/courses";
import { parseLevelProgress } from "@/lib/motion";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  const courseParams = getAllCourses().map((course) => ({ slug: course.slug }));
  const groupParams = courseGroups.map((group) => ({ slug: group.slug }));
  return [...groupParams, ...courseParams];
}

export async function generateMetadata({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const group = getCourseGroupBySlug(slug);
  if (group) {
    return {
      title: `${group.title} — Sawy Academy`,
      description: group.subtitle,
    };
  }
  const course = getCourseBySlug(slug);
  if (!course) return { title: "Course" };
  return {
    title: `${course.title} — Sawy Academy`,
    description: course.description,
  };
}

function groupHeaderMeta(group: CourseGroup): {
  eyebrow: string;
  description: string;
} {
  const instructor = group.courses[0]?.instructor;
  const instructorBit = instructor ? `${instructor}. ` : "";

  if (group.type === "diploma") {
    const priceBit = group.bundlePrice ? ` · ${group.bundlePrice}` : "";
    return {
      eyebrow: `Diploma · ${String(group.courses.length).padStart(2, "0")} sheets${priceBit}`,
      description: `${instructorBit}${group.subtitle}`,
    };
  }

  return {
    eyebrow: `Leveled programme · ${String(group.courses.length).padStart(2, "0")} levels`,
    description: `${instructorBit}${group.subtitle}`,
  };
}

function GroupCourseDetail({ group }: { group: CourseGroup }) {
  const meta = groupHeaderMeta(group);

  return (
    <>
      <PageHeader
        eyebrow={meta.eyebrow}
        title={group.title}
        description={meta.description}
      />

      <ThresholdDoorway
        label={group.type === "diploma" ? "DRAWING SET" : "LEVEL SEQUENCE"}
      />

      <Section rhythm="standard" contained={false}>
        <PageContainer>
          {group.type === "diploma" ? (
            <DiplomaCourseDetail group={group} />
          ) : (
            <LeveledCourseDetail group={group} />
          )}
        </PageContainer>
      </Section>
    </>
  );
}

function StandaloneCourseDetail({ course }: { course: Course }) {
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
              category={course.level}
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

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { slug } = await params;

  const group = getCourseGroupBySlug(slug);
  if (group) {
    return <GroupCourseDetail group={group} />;
  }

  const course = getCourseBySlug(slug);
  if (!course) notFound();

  return <StandaloneCourseDetail course={course} />;
}
