"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BioGeometryShape } from "@/components/BioGeometryShape";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { GsapReveal, GsapStagger } from "@/components/animation/GsapReveal";
import { SplitTextReveal } from "@/components/animation/SplitTextReveal";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { MediaBay } from "@/components/decorative/MediaBay";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { LevelProgressLine } from "@/components/decorative/LevelProgressLine";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { AsyncState } from "@/components/feedback/AsyncState";
import {
  asCourses,
  courseGroupSlug,
  listCourseGroups,
} from "@/lib/api/courseGroups";
import type { Course, CourseGroup } from "@/lib/api/types";
import { logger } from "@/lib/logger";
import { parseLevelProgress } from "@/lib/motion";

function CourseListing({
  courses,
  numbered,
  groupImage,
}: {
  courses: Course[];
  numbered?: boolean;
  groupImage?: string;
}) {
  if (courses.length === 0) {
    return (
      <AsyncState
        title="Courses are being prepared"
        message="This programme does not have any published courses yet."
      />
    );
  }

  return (
    <div role="list">
      <GsapStagger className="divide-y divide-hairline">
        {courses.map((course, i) => (
          <div key={course.id} role="listitem">
            <Link
              href={`/courses/${course.slug}`}
              aria-label={`View ${course.title} course details`}
              className={`group grid min-h-11 grid-cols-1 gap-y-6 py-8 transition-colors duration-300 hover:bg-concrete-dark/25 focus-visible:bg-concrete-dark/25 sm:gap-x-6 sm:px-4 lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-5 ${
                numbered
                  ? "sm:grid-cols-[auto_7rem_minmax(0,1fr)]"
                  : "sm:grid-cols-[7rem_minmax(0,1fr)]"
              }`}
            >
              {numbered && (
                <div className="sm:col-span-1 sm:row-span-3 sm:pt-1 lg:row-span-1 lg:pt-0">
                  <span className="label-caps text-clay">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              )}
              <div
                className={`${
                  numbered
                    ? "sm:col-start-2 lg:col-start-auto lg:col-span-2"
                    : "sm:col-start-1 lg:col-start-auto lg:col-span-2"
                }`}
              >
                <MediaBay
                  src={course.image || groupImage}
                  alt={course.title}
                  className="aspect-[16/10] w-full sm:aspect-square"
                  fallback="course"
                  morph
                  sizes="(min-width: 1024px) 9rem, (min-width: 640px) 7rem, calc(100vw - 6rem)"
                />
              </div>
              <div
                className={`${
                  numbered
                    ? "sm:col-start-3 lg:col-start-auto lg:col-span-5"
                    : "sm:col-start-2 lg:col-start-auto lg:col-span-6"
                } min-w-0`}
              >
                <ScaleBar scale="1:100" className="mb-3 max-w-[100px]" />
                <h3 className="type-title mb-2 transition-colors duration-200 group-hover:text-clay">
                  {course.title}
                </h3>
                <p className="type-infill line-clamp-none max-w-[42rem] leading-relaxed sm:line-clamp-2">
                  {course.description}
                </p>
                <span className="action-secondary mt-4 inline-flex min-h-11 items-center">
                  View course
                </span>
              </div>
              <div
                className={`${
                  numbered
                    ? "sm:col-start-3 lg:col-start-auto"
                    : "sm:col-start-2 lg:col-start-auto"
                } flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-hairline pt-5 sm:border-0 sm:pt-0 lg:col-span-3 lg:flex-col lg:items-end`}
              >
                <span className="label-caps text-charcoal">
                  {course.level}
                </span>
                <LevelProgressLine
                  progress={parseLevelProgress(course.level)}
                  className="w-24 lg:ml-auto lg:w-full lg:max-w-[140px]"
                />
                <span className="type-infill basis-full lg:basis-auto">
                  {course.instructor}
                </span>
                <span className="type-body text-charcoal lg:mt-1">
                  {course.price}
                </span>
              </div>
            </Link>
          </div>
        ))}
      </GsapStagger>
    </div>
  );
}

export default function CoursesPage() {
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    setProgress(0);
    logger.info("Courses page loading curriculum", {
      page: "/courses",
      endpoint: "/api/courses/groups",
    });
    listCourseGroups({
      onProgress: (value) => {
        if (!cancelled) setProgress(value);
      },
    })
      .then((data) => {
        if (!cancelled) {
          setCourseGroups(data);
          logger.info("Courses page curriculum loaded", {
            page: "/courses",
            groupCount: data.length,
          });
        }
      })
      .catch((error) => {
        logger.error("Courses page failed to load curriculum", {
          page: "/courses",
          endpoint: "/api/courses/groups",
          error,
        });
        if (!cancelled) {
          setCourseGroups([]);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <>
      <CmsPageHeader pageKey="courses" />

      <ThresholdDoorway label="CURRICULUM" />

      <Section rhythm="standard" contained={false}>
        <PageContainer className="relative space-y-14 lg:space-y-20">
          {/* Drafting accents stay local to the curriculum instead of following reading. */}
          <BioGeometryShape
            kind="coil"
            variant="draw"
            size={280}
            stroke="var(--color-clay)"
            opacity={0.5}
            drawEnd={0.5}
            parallax={80}
            parallaxX={40}
            parallaxRotate={12}
            className="pointer-events-none absolute -right-8 top-16 z-0 hidden lg:block"
          />
          <BioGeometryShape
            kind="c7"
            variant="draw"
            size={240}
            stroke="var(--color-clay-muted)"
            opacity={0.45}
            drawEnd={0.7}
            parallax={60}
            parallaxX={-50}
            parallaxRotate={-6}
            className="pointer-events-none absolute -left-8 bottom-16 z-0 hidden lg:block"
          />

          {(loading || loadError || courseGroups.length === 0) && (
            <ThresholdFrame label="Curriculum index" labelAsHeading>
              <div className="relative z-[1] mt-4 hairline-border p-6 lg:p-10">
                {loading && (
                  <SectionLoader
                    label="Loading curriculum…"
                    stepLabel="Fetching course groups"
                    progress={progress}
                  />
                )}
                {!loading && loadError && (
                  <AsyncState
                    kind="error"
                    title="The curriculum could not be loaded"
                    message="Check your connection and try loading the course groups again."
                    onRetry={() => setReloadKey((value) => value + 1)}
                  />
                )}
                {!loading && !loadError && courseGroups.length === 0 && (
                  <AsyncState
                    title="No courses are published"
                    message="The curriculum is currently being prepared. Please check back soon."
                  />
                )}
              </div>
            </ThresholdFrame>
          )}
          {!loading &&
            !loadError &&
            courseGroups.map((group, groupIndex) => {
              const slug = courseGroupSlug(group);
              const courses = asCourses(group);
              return (
                <div
                  key={group._id ?? group.id ?? slug}
                  className="relative"
                >
                  {groupIndex > 0 && (
                    <ThresholdDoorway
                      label={
                        group.type === "leveled"
                          ? "LEVEL PROGRESSION"
                          : "DIPLOMA"
                      }
                      className="mb-12"
                    />
                  )}

                  <GsapReveal type="heading">
                    <div className="relative z-[1] mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
                      <div className="lg:col-span-8">
                        <p className="eyebrow mb-2">{group.subtitle}</p>
                        <SplitTextReveal type="lines">
                          <h2 className="type-heading">{group.title}</h2>
                        </SplitTextReveal>
                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                          <span className="label-caps text-charcoal">
                            {courses.length}{" "}
                            {courses.length === 1 ? "course" : "courses"}
                          </span>
                          <span className="label-caps">
                            {group.type === "diploma"
                              ? "Diploma programme"
                              : "Level progression"}
                          </span>
                          <span className="type-infill text-charcoal">
                            {group.bundlePrice
                              ? group.bundlePrice
                              : courses[0]?.price
                                ? `From ${courses[0].price}`
                                : "Pricing on request"}
                          </span>
                        </div>
                        <Link
                          href={`/courses/${slug}`}
                          className="action-primary mt-5 inline-flex min-h-11 items-center"
                        >
                          Explore programme
                        </Link>
                      </div>
                      <div className="lg:col-span-4">
                        <MediaBay
                          src={group.image}
                          alt={group.title}
                          className="aspect-[16/10]"
                          fallback="course"
                          morph
                          sizes="(min-width: 1024px) 24rem, 100vw"
                        />
                      </div>
                    </div>
                  </GsapReveal>

                  <GsapReveal type="card" delay={0.08}>
                    <ThresholdFrame
                      label={
                        group.type === "diploma"
                          ? "Bay 03 — Diploma Programme"
                          : "Bay 04 — Leveled Course"
                      }
                    >
                      <div
                        className={`relative z-[1] mt-4 hairline-border p-3 sm:p-4 lg:p-6 ${
                          group.type === "diploma" ? "section-intimate" : ""
                        }`}
                      >
                        {group.type === "diploma" && group.bundlePrice && (
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10 hairline-b pb-10">
                            <div>
                              <p className="label-caps mb-2">
                                Diploma Programme
                              </p>
                              <p className="type-infill max-w-md leading-relaxed">
                                Enroll in the full Architecture Diploma to access
                                all core courses. Includes studio access and
                                critique sessions.
                              </p>
                              <LevelProgressLine progress={1} className="mt-4" />
                            </div>
                            <p className="type-display text-clay whitespace-nowrap">
                              {group.bundlePrice}
                            </p>
                            <EnrollButton
                              id={`diploma-${slug}`}
                              name={group.title}
                              price={group.bundlePrice}
                              kind="diploma"
                              label="Enroll in Diploma"
                              className="action-primary inline-flex min-h-11 items-center lg:mt-2 disabled:text-clay-muted disabled:cursor-not-allowed"
                            />
                          </div>
                        )}

                        {group.type === "leveled" && (
                          <div className="mb-10 hairline-b pb-10 section-compressed">
                            <p className="label-caps mb-2">
                              Three-Level Progression
                            </p>
                            <p className="type-infill max-w-md leading-relaxed">
                              Biogeometry is taken level by level. Each level
                              builds on the previous.
                            </p>
                            <div className="flex gap-2 mt-4 max-w-xs">
                              <LevelProgressLine
                                progress={0.33}
                                className="flex-1"
                              />
                              <LevelProgressLine
                                progress={0.66}
                                className="flex-1"
                              />
                              <LevelProgressLine
                                progress={1}
                                className="flex-1"
                              />
                            </div>
                          </div>
                        )}

                        <CourseListing
                          courses={courses}
                          numbered={group.type === "diploma"}
                          groupImage={group.image}
                        />
                      </div>
                    </ThresholdFrame>
                  </GsapReveal>
                </div>
              );
            })}
        </PageContainer>
      </Section>
    </>
  );
}
