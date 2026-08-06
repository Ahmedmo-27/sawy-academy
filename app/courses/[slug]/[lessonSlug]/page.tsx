"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { SpecifiedMaterialsStrip } from "@/components/courses/CourseMaterials";
import { LessonNav } from "@/components/courses/LessonNav";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { GridColumns } from "@/components/decorative/GridColumns";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { ApiClientError } from "@/lib/api/client";
import {
  getCourse,
  getLessonBySlug,
  relatedProductIdsOf,
} from "@/lib/api/courses";
import type { Course, Lesson } from "@/lib/api/types";
import { logger } from "@/lib/logger";

interface LessonPageProps {
  params: Promise<{ slug: string; lessonSlug: string }>;
}

export default function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonSlug } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    "loading"
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    logger.info("Lesson page loading", {
      page: `/courses/${slug}/${lessonSlug}`,
      endpoint: `/api/courses/${slug}`,
    });

    getCourse(slug, {
      onProgress: (value) => {
        if (!cancelled) setProgress(value);
      },
    })
      .then((data) => {
        if (cancelled) return;
        const matched = getLessonBySlug(data, lessonSlug);
        if (!matched) {
          setStatus("missing");
          return;
        }
        setCourse(data);
        setLesson(matched);
        setStatus("ready");
        logger.info("Lesson page loaded", {
          page: `/courses/${slug}/${lessonSlug}`,
          lessonTitle: matched.title,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiClientError && error.status === 404) {
          setStatus("missing");
          return;
        }
        logger.error("Lesson page failed to load course", {
          page: `/courses/${slug}/${lessonSlug}`,
          endpoint: `/api/courses/${slug}`,
          error,
        });
        setStatus("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [slug, lessonSlug]);

  if (status === "missing") notFound();

  if (status === "loading" || !course || !lesson) {
    return (
      <PageContainer className="pt-32 pb-20">
        <SectionLoader
          label="Loading lesson…"
          stepLabel="Fetching course sheet"
          progress={progress}
        />
      </PageContainer>
    );
  }

  const lessons = [...(course.lessons ?? [])].sort(
    (a, b) => a.order - b.order
  );
  const index = lessons.findIndex((l) => l.id === lesson.id);
  const prev = index > 0 ? lessons[index - 1] : undefined;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined;
  const productIds = relatedProductIdsOf(course);
  const paragraphs = (lesson.content ?? "").split(/\n\n+/).filter(Boolean);

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
                  {String(lessons.length).padStart(2, "0")}
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
              {lesson.summary && (
                <p className="type-lead mb-10">{lesson.summary}</p>
              )}

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
                    Open video (opens in a new tab)
                  </a>
                </div>
              )}

              {productIds.length > 0 && (
                <div className="mt-12 hairline-t pt-8">
                  <SpecifiedMaterialsStrip relatedProductIds={productIds} />
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
