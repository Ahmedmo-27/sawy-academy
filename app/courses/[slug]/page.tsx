"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { BioGeometryShape } from "@/components/BioGeometryShape";
import { PageHeader } from "@/components/PageHeader";
import { CourseMaterials } from "@/components/courses/CourseMaterials";
import { CourseSheetIndex } from "@/components/courses/CourseSheetIndex";
import { DiplomaCourseDetail } from "@/components/courses/DiplomaCourseDetail";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { LeveledCourseDetail } from "@/components/courses/LeveledCourseDetail";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { MediaBay } from "@/components/decorative/MediaBay";
import { SectionCutDivider } from "@/components/decorative/SectionCutDivider";
import { LevelProgressLine } from "@/components/decorative/LevelProgressLine";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { ApiClientError } from "@/lib/api/client";
import { getCourse, relatedProductIdsOf } from "@/lib/api/courses";
import {
  asCourses,
  courseGroupSlug,
  listCourseGroups,
} from "@/lib/api/courseGroups";
import type { Course, CourseGroup } from "@/lib/api/types";
import { logger } from "@/lib/logger";
import { parseLevelProgress } from "@/lib/motion";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

function groupHeaderMeta(group: CourseGroup): {
  eyebrow: string;
  description: string;
} {
  const courses = asCourses(group);
  const instructor = courses[0]?.instructor;
  const instructorBit = instructor ? `${instructor}. ` : "";

  if (group.type === "diploma") {
    const priceBit = group.bundlePrice ? ` · ${group.bundlePrice}` : "";
    return {
      eyebrow: `Diploma · ${String(courses.length).padStart(2, "0")} sheets${priceBit}`,
      description: `${instructorBit}${group.subtitle}`,
    };
  }

  return {
    eyebrow: `Leveled programme · ${String(courses.length).padStart(2, "0")} levels`,
    description: `${instructorBit}${group.subtitle}`,
  };
}

function GroupCourseDetail({ group }: { group: CourseGroup }) {
  const meta = groupHeaderMeta(group);
  const isLeveled = group.type === "leveled";

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
        <PageContainer className="relative">
          <BioGeometryShape
            kind={isLeveled ? "bg3" : "spiral"}
            variant="draw"
            size={136}
            stroke="var(--color-clay)"
            opacity={0.3}
            drawEnd={0.45}
            parallax={64}
            parallaxX={12}
            parallaxRotate={5}
            className="fixed -right-8 top-[28%] z-0 md:hidden"
          />
          <BioGeometryShape
            kind="coil"
            variant="draw"
            size={104}
            stroke="var(--color-clay-muted)"
            opacity={0.26}
            drawEnd={0.65}
            parallax={48}
            parallaxX={-10}
            parallaxRotate={-4}
            className="fixed -left-7 bottom-[12%] z-0 md:hidden"
          />
          <BioGeometryShape
            kind={isLeveled ? "bg3" : "spiral"}
            variant="draw"
            size={isLeveled ? 260 : 300}
            stroke="var(--color-clay)"
            opacity={0.5}
            drawEnd={0.5}
            parallax={240}
            parallaxX={36}
            parallaxRotate={10}
            className="fixed right-[max(0.5rem,calc((100vw-72rem)/2-2rem))] top-[20%] z-0 hidden md:block"
          />
          <BioGeometryShape
            kind="coil"
            variant="draw"
            size={200}
            stroke="var(--color-clay-muted)"
            opacity={0.42}
            drawEnd={0.7}
            parallax={160}
            parallaxX={-44}
            parallaxRotate={-8}
            className="fixed left-[max(0.5rem,calc((100vw-72rem)/2-1.5rem))] bottom-[16%] z-0 hidden md:block"
          />
          <div className="relative z-[1]">
            {group.type === "diploma" ? (
              <DiplomaCourseDetail group={group} />
            ) : (
              <LeveledCourseDetail group={group} />
            )}
          </div>
        </PageContainer>
      </Section>
    </>
  );
}

function StandaloneCourseDetail({ course }: { course: Course }) {
  const lessons = course.lessons ?? [];
  const productIds = relatedProductIdsOf(course);

  return (
    <>
      <PageHeader
        eyebrow={`${course.level} · ${course.price}`}
        title={course.title}
        description={`${course.instructor}. ${course.description}`}
      />

      <ThresholdDoorway label="DRAWING SET" />

      <Section rhythm="standard" contained={false}>
        <PageContainer className="relative space-y-16 lg:space-y-20">
          <MediaBay
            src={course.image}
            alt={course.title}
            className="relative z-[1] aspect-[16/10] lg:aspect-[21/9]"
            fallback="course"
            morph
            priority
            revealOnLoad
            sizes="100vw"
          />

          <BioGeometryShape
            kind="spiral"
            variant="draw"
            size={136}
            stroke="var(--color-clay)"
            opacity={0.3}
            drawEnd={0.45}
            parallax={64}
            parallaxX={12}
            parallaxRotate={5}
            className="fixed -right-8 top-[28%] z-0 md:hidden"
          />
          <BioGeometryShape
            kind="c7"
            variant="draw"
            size={112}
            stroke="var(--color-clay-muted)"
            opacity={0.26}
            drawEnd={0.65}
            parallax={48}
            parallaxX={-12}
            parallaxRotate={-4}
            className="fixed -left-7 bottom-[12%] z-0 md:hidden"
          />

          <BioGeometryShape
            kind="spiral"
            variant="draw"
            size={280}
            stroke="var(--color-clay)"
            opacity={0.5}
            drawEnd={0.5}
            parallax={220}
            parallaxX={40}
            parallaxRotate={12}
            className="fixed right-[max(0.5rem,calc((100vw-72rem)/2-2rem))] top-[20%] z-0 hidden md:block"
          />
          <BioGeometryShape
            kind="c7"
            variant="draw"
            size={220}
            stroke="var(--color-clay-muted)"
            opacity={0.45}
            drawEnd={0.7}
            parallax={150}
            parallaxX={-48}
            parallaxRotate={-7}
            className="fixed left-[max(0.5rem,calc((100vw-72rem)/2-1.5rem))] bottom-[16%] z-0 hidden md:block"
          />

          <div className="relative z-[1] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
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
            <div className="relative z-[1] hairline-border p-6 lg:p-10 mt-4">
              <CourseSheetIndex courseSlug={course.slug} lessons={lessons} />
            </div>
          </ThresholdFrame>

          {productIds.length > 0 && (
            <>
              <SectionCutDivider label="MATERIALS" />
              <div className="relative z-[1]">
                <ScaleBar scale="1:50" className="mb-6 max-w-[120px]" />
                <p className="eyebrow mb-2">Specified equipment</p>
                <h2 className="type-heading mb-8">Materials &amp; tools</h2>
                <ThresholdFrame label="Stock list — Course">
                  <div className="pt-4">
                    <CourseMaterials relatedProductIds={productIds} />
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

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = use(params);
  const [group, setGroup] = useState<CourseGroup | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    "loading"
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    logger.info("Course detail page loading", {
      page: `/courses/${slug}`,
      endpoint: "/api/courses/groups",
    });

    listCourseGroups({
      onProgress: (value) => {
        if (!cancelled) setProgress(Math.min(value, 60));
      },
    })
      .then(async (groups) => {
        const matchedGroup = groups.find(
          (item) => courseGroupSlug(item) === slug
        );
        if (matchedGroup) {
          if (cancelled) return;
          setGroup(matchedGroup);
          setCourse(null);
          setStatus("ready");
          logger.info("Course detail page group loaded", {
            page: `/courses/${slug}`,
            groupTitle: matchedGroup.title,
          });
          return;
        }

        try {
          const matchedCourse = await getCourse(slug);
          if (cancelled) return;
          setCourse(matchedCourse);
          setGroup(null);
          setStatus("ready");
          setProgress(100);
          logger.info("Course detail page course loaded", {
            page: `/courses/${slug}`,
            endpoint: `/api/courses/${slug}`,
            courseTitle: matchedCourse.title,
          });
        } catch (error) {
          if (cancelled) return;
          if (error instanceof ApiClientError && error.status === 404) {
            setStatus("missing");
            return;
          }
          logger.error("Course detail page failed to load course", {
            page: `/courses/${slug}`,
            endpoint: `/api/courses/${slug}`,
            error,
          });
          setStatus("missing");
        }
      })
      .catch((error) => {
        logger.error("Course detail page failed to load groups", {
          page: `/courses/${slug}`,
          endpoint: "/api/courses/groups",
          error,
        });
        if (!cancelled) setStatus("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === "missing") notFound();

  if (status === "loading") {
    return (
      <PageContainer className="pt-32 pb-20">
        <SectionLoader
          label="Loading course…"
          stepLabel="Fetching curriculum"
          progress={progress}
          fullScreen
        />
      </PageContainer>
    );
  }

  if (group) {
    return <GroupCourseDetail group={group} />;
  }

  if (course) {
    return <StandaloneCourseDetail course={course} />;
  }

  notFound();
}
