"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpecifiedMaterialsStrip } from "@/components/courses/CourseMaterials";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { LessonCourseRail } from "@/components/courses/LessonCourseRail";
import { LessonNav } from "@/components/courses/LessonNav";
import { CompleteMarker } from "@/components/decorative/CompleteMarker";
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
import {
  completeLesson,
  getMyCourseEnrollment,
  uncompleteLesson,
} from "@/lib/api/enrollments";
import type { Course, Enrollment, Lesson } from "@/lib/api/types";
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
            label="Add to cart"
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
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isMutatingCompletion, setIsMutatingCompletion] = useState(false);

  useEffect(() => {
    if (!course || !isAuthenticated) {
      setEnrollment(null);
      return;
    }

    let active = true;
    getMyCourseEnrollment(course.id || course.slug)
      .then((data) => {
        if (active && data) {
          setEnrollment(data);
        }
      })
      .catch(() => {
        // silent fail
      });

    return () => {
      active = false;
    };
  }, [course, isAuthenticated]);

  async function toggleLessonCompletion() {
    if (!course || !lesson || isMutatingCompletion) return;
    setIsMutatingCompletion(true);
    try {
      const isComplete =
        (enrollment?.completedLessonIds || []).includes(lesson.id) ||
        (lesson._id &&
          (enrollment?.completedLessonIds || []).includes(String(lesson._id)));

      if (isComplete) {
        const res = await uncompleteLesson(course.slug, lesson.id);
        if (res.enrollment) setEnrollment(res.enrollment);
      } else {
        const res = await completeLesson(course.slug, lesson.id);
        if (res.enrollment) setEnrollment(res.enrollment);
      }
    } catch (err) {
      logger.error("Failed to toggle lesson completion", { error: err });
    } finally {
      setIsMutatingCompletion(false);
    }
  }

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
          const code =
            error.code ||
            (error.status === 401 ? "AUTH_REQUIRED" : "ENROLLMENT_REQUIRED");
          // Never ask an authenticated user to sign in again for a lock.
          const resolvedCode =
            isAuthenticated && code === "AUTH_REQUIRED"
              ? "ENROLLMENT_REQUIRED"
              : code;
          setVideoStatus("locked");
          setVideoError(
            resolvedCode === "ENROLLMENT_REQUIRED"
              ? "Enroll in this course to watch the recording."
              : error.message ||
                  "Sign in and enroll in this course to watch the recording."
          );
          setVideoErrorCode(resolvedCode);
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

  async function refreshVideoManifest() {
    if (!lesson) {
      throw new Error("Lesson is not available");
    }

    const access = await getLessonVideoAccess(lesson.id);
    setVideoAccess(access);
    return access.manifestUrl;
  }

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

  const completedLessonIds = enrollment?.completedLessonIds ?? [];
  const isCurrentLessonComplete =
    completedLessonIds.includes(lesson.id) ||
    (lesson._id ? completedLessonIds.includes(String(lesson._id)) : false);

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
                    manifestUrl={videoAccess.manifestUrl}
                    title={lesson.title}
                    watermarkText={videoAccess.watermarkText}
                    lessonId={lesson.id}
                    onRefreshManifest={refreshVideoManifest}
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

                  {paragraphs.length > 0 ? (
                    <div className="space-y-6">
                      {paragraphs.map((paragraph) => (
                        <p key={paragraph.slice(0, 32)} className="type-body">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : videoStatus === "locked" ? (
                    <div className="hairline-border bg-concrete-dark/30 p-6">
                      <p className="label-caps mb-2 text-charcoal">Drawing notes locked</p>
                      <p className="type-body text-charcoal-muted">
                        Detailed lesson analysis, architectural specifications, and full drawing notes are reserved for enrolled students.
                      </p>
                    </div>
                  ) : null}

                  {lesson.documentAvailable && (
                    <div className="mt-8 hairline-t pt-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hairline-border bg-concrete-dark/30">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-charcoal text-concrete">
                            <svg
                              aria-hidden="true"
                              className="h-6 w-6 stroke-current"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="label-caps mb-1 text-charcoal">
                              Lesson Sheet · PDF Document
                            </p>
                            <p className="type-infill text-charcoal-muted">
                              {lesson.sheetRef ? `${lesson.sheetRef} — ` : ""}
                              {lesson.title} reference drawing and sheet
                              specification.
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {videoStatus === "allowed" ? (
                            <a
                              href={`/api/lessons/${encodeURIComponent(
                                lesson.id
                              )}/document`}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="action-secondary inline-flex min-h-11 items-center gap-2"
                              aria-label={`Download PDF document for ${lesson.title}`}
                            >
                              <svg
                                aria-hidden="true"
                                className="h-4 w-4 stroke-current"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                                />
                              </svg>
                              Download PDF
                            </a>
                          ) : (
                            <span className="label-caps !text-charcoal-muted italic">
                              Enrolled access only
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {productIds.length > 0 && (
                    <div className="mt-12 hairline-t pt-8">
                      <SpecifiedMaterialsStrip
                        relatedProductIds={productIds}
                      />
                    </div>
                  )}

                  {videoStatus === "allowed" && (
                    <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hairline-t pt-6">
                      <button
                        type="button"
                        onClick={toggleLessonCompletion}
                        disabled={isMutatingCompletion}
                        aria-pressed={isCurrentLessonComplete}
                        className={`inline-flex min-h-11 items-center gap-2 px-5 py-2.5 label-caps transition-colors duration-200 cursor-pointer ${
                          isCurrentLessonComplete
                            ? "bg-clay text-concrete border border-clay hover:bg-clay/90"
                            : "border border-charcoal/40 bg-concrete text-charcoal hover:border-charcoal hover:bg-concrete-dark"
                        }`}
                      >
                        <CompleteMarker className={isCurrentLessonComplete ? "text-concrete" : "text-charcoal-infill"} />
                        {isCurrentLessonComplete ? "Lesson Complete" : "Mark as Complete"}
                      </button>

                      {enrollment && enrollment.totalLessons > 0 && (
                        <p className="label-caps text-charcoal-infill">
                          Course Progress · {enrollment.completedLessons} / {enrollment.totalLessons} ({Math.round((enrollment.completedLessons / enrollment.totalLessons) * 100)}%)
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-8">
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
                  completedLessonIds={completedLessonIds}
                />
              </div>
            </div>
          </ThresholdFrame>
        </PageContainer>
      </Section>
    </>
  );
}
