"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpecifiedMaterialsStrip } from "@/components/courses/CourseMaterials";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { LessonCourseRail } from "@/components/courses/LessonCourseRail";
import { LessonNav } from "@/components/courses/LessonNav";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { GridColumns } from "@/components/decorative/GridColumns";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { AsyncState } from "@/components/feedback/AsyncState";
import { useAuth } from "@/hooks/useAuth";
import { ApiClientError } from "@/lib/api/client";
import {
  getCourse,
  getLessonBySlug,
  relatedProductIdsOf,
} from "@/lib/api/courses";
import {
  getLessonVideoAccess,
  type LessonVideoAccess,
} from "@/lib/api/lessons";
import type { Course, Lesson } from "@/lib/api/types";
import { logger } from "@/lib/logger";

interface LessonPageProps {
  params: Promise<{ slug: string; lessonSlug: string }>;
}

type VideoStatus = "idle" | "loading" | "allowed" | "locked" | "error";

function LockedVideoState({
  course,
  message,
  code,
  returnPath,
}: {
  course: Course;
  message: string;
  code?: string;
  returnPath: string;
}) {
  return (
    <section className="hairline-border bg-concrete/80 p-6 lg:p-8">
      <p className="label-caps mb-3 text-charcoal-infill">Recording locked</p>
      <p className="type-body max-w-xl">{message}</p>
      <div className="mt-6">
        {code === "AUTH_REQUIRED" ? (
          <Link
            href={`/login?redirect=${encodeURIComponent(returnPath)}`}
            className="action-primary inline-flex min-h-11 items-center"
          >
            Sign in to continue
          </Link>
        ) : code === "ENROLLMENT_REQUIRED" ? (
          <EnrollButton
            id={course.id}
            name={course.title}
            price={course.price}
            category={course.level}
            label="Enroll"
            className="action-primary"
          />
        ) : (
          <Link
            href={`/courses/${course.slug}`}
            className="action-secondary inline-flex min-h-11 items-center"
          >
            View course requirements
          </Link>
        )}
      </div>
    </section>
  );
}

export default function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonSlug } = use(params);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">(
    "loading"
  );
  const [progress, setProgress] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>("idle");
  const [videoAccess, setVideoAccess] = useState<LessonVideoAccess | null>(null);
  const [videoError, setVideoError] = useState("");
  const [videoErrorCode, setVideoErrorCode] = useState<string>();

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
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [slug, lessonSlug, reloadKey]);

  useEffect(() => {
    if (!lesson || isAuthLoading) return;

    if (!isAuthenticated) {
      setVideoAccess(null);
      setVideoStatus("locked");
      setVideoError("Sign in and enroll in this course to watch the recording.");
      setVideoErrorCode("AUTH_REQUIRED");
      return;
    }

    let cancelled = false;
    setVideoStatus("loading");
    setVideoAccess(null);
    setVideoError("");
    setVideoErrorCode(undefined);

    getLessonVideoAccess(lesson.id)
      .then((access) => {
        if (cancelled) return;
        setVideoAccess(access);
        setVideoStatus("allowed");
      })
      .catch((error) => {
        if (cancelled) return;
        if (
          error instanceof ApiClientError &&
          (error.status === 401 || error.status === 403)
        ) {
          setVideoStatus("locked");
          setVideoError(error.message);
          setVideoErrorCode(
            error.status === 401 ? "AUTH_REQUIRED" : error.code
          );
          return;
        }

        setVideoStatus("error");
        setVideoError(
          error instanceof Error
            ? error.message
            : "The lesson recording could not be loaded."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [lesson, isAuthenticated, isAuthLoading]);

  if (status === "missing") notFound();

  if (status === "error") {
    return (
      <PageContainer className="pt-32 pb-20">
        <AsyncState
          kind="error"
          title="The lesson could not be loaded"
          message="Check your connection and try loading this lesson again."
          onRetry={() => {
            setStatus("loading");
            setReloadKey((value) => value + 1);
          }}
          actionHref={`/courses/${slug}`}
          actionLabel="Course details"
        />
      </PageContainer>
    );
  }

  if (status === "loading" || !course || !lesson) {
    return (
      <PageContainer className="pt-32 pb-20">
        <SectionLoader
          label="Loading lesson…"
          stepLabel="Fetching course sheet"
          progress={progress}
          fullScreen
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
  const lessonDate = lesson.createdAt
    ? new Intl.DateTimeFormat("en", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(lesson.createdAt))
    : "—";

  return (
    <>
      <header className="relative overflow-hidden border-b border-hairline">
        <GridColumns />
        <PageContainer className="relative z-10 pt-24 pb-6 lg:pt-28 lg:pb-8">
          <div className="grid items-end gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <p className="eyebrow mb-3">
                {course.title} · Sheet {String(lesson.order).padStart(2, "0")}
              </p>
              <h1 className="type-heading max-w-4xl">{lesson.title}</h1>
            </div>

            <div className="hairline-border bg-concrete/80 p-4 lg:col-span-5 lg:p-5">
              <ScaleBar scale="1:50" className="mb-4 max-w-[100px]" />
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="label-caps mb-2">Sheet</p>
                <p className="dim-label">{lesson.sheetRef}</p>
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
                <p className="label-caps mb-2">Date</p>
                <p className="type-infill">{lessonDate}</p>
              </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </header>

      <Section rhythm="intimate" contained={false}>
        <PageContainer>
          <ThresholdFrame label={`Drawing — ${lesson.sheetRef}`}>
            <div className="mt-4 min-w-0">
              <div className="hairline-border bg-concrete-dark p-2 sm:p-3 lg:p-4">
                {videoStatus === "allowed" && videoAccess ? (
                  <VideoPlayer
                    embedUrl={videoAccess.embedUrl}
                    title={lesson.title}
                    watermarkText={videoAccess.watermarkText}
                  />
                ) : videoStatus === "locked" ? (
                  <div className="flex aspect-video items-center justify-center bg-charcoal p-[1rem] sm:p-[2rem]">
                    <div className="w-full max-w-xl">
                      <LockedVideoState
                        course={course}
                        message={videoError}
                        code={videoErrorCode}
                        returnPath={`/courses/${slug}/${lessonSlug}`}
                      />
                    </div>
                  </div>
                ) : videoStatus === "error" ? (
                  <div className="flex aspect-video items-center justify-center bg-charcoal p-[1rem] sm:p-[2rem]">
                    <div className="w-full max-w-xl bg-concrete">
                      <AsyncState
                        kind="error"
                        title="Recording unavailable"
                        message={videoError}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex aspect-video items-center justify-center bg-charcoal p-8 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <p className="label-caps !text-concrete/70">
                      Checking recording access…
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
                <article className="hairline-border p-6 lg:p-10">
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

                  {productIds.length > 0 && (
                    <div className="mt-12 hairline-t pt-8">
                      <SpecifiedMaterialsStrip
                        relatedProductIds={productIds}
                      />
                    </div>
                  )}

                  <div className="mt-12">
                    <LessonNav
                      courseSlug={course.slug}
                      prev={prev}
                      next={next}
                    />
                  </div>
                </article>

                <LessonCourseRail
                  courseSlug={course.slug}
                  courseTitle={course.title}
                  lessons={lessons}
                  currentLessonId={lesson.id}
                />
              </div>
            </div>
          </ThresholdFrame>
        </PageContainer>
      </Section>
    </>
  );
}
