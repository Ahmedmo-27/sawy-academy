"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BioGeometryShape } from "@/components/BioGeometryShape";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { GsapReveal, GsapStagger } from "@/components/animation/GsapReveal";
import { SplitTextReveal } from "@/components/animation/SplitTextReveal";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { CourseTrackNav, type CourseTrack } from "@/components/courses/CourseTrackNav";
import { CurriculumPathwayGrid } from "@/components/courses/CurriculumPathwayGrid";
import { BiogeometryLevelStepper } from "@/components/courses/BiogeometryLevelStepper";
import { MediaBay } from "@/components/decorative/MediaBay";
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
              className={`group grid min-h-11 grid-cols-1 gap-y-4 py-5 transition-colors duration-300 hover:bg-concrete-dark/25 focus-visible:bg-concrete-dark/25 sm:gap-x-4 sm:px-2 lg:grid-cols-12 lg:items-center lg:gap-6 lg:px-3 ${
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
                <h3 className="font-serif font-medium text-2xl sm:text-[2rem] mb-2 text-charcoal transition-colors duration-200 group-hover:text-clay">
                  {course.title}
                </h3>
                <p className="line-clamp-none max-w-[44rem] text-base leading-relaxed sm:text-[1.125rem] sm:line-clamp-3 text-charcoal/90">
                  {course.description}
                </p>
                <span className="action-secondary mt-3.5 inline-flex min-h-10 items-center px-3.5 py-2 text-sm sm:text-base font-medium">
                  View course details →
                </span>
              </div>
              <div
                className={`${
                  numbered
                    ? "sm:col-start-3 lg:col-start-auto"
                    : "sm:col-start-2 lg:col-start-auto"
                } flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-hairline pt-4 sm:border-0 sm:pt-0 lg:col-span-3 lg:flex-col lg:items-end`}
              >
                <span className="label-caps text-sm text-charcoal font-semibold tracking-wider">
                  {course.level}
                </span>
                <LevelProgressLine
                  progress={parseLevelProgress(course.level)}
                  className="w-24 lg:ml-auto lg:w-full lg:max-w-[140px]"
                />
                <span className="basis-full text-base sm:text-[1.0625rem] font-medium text-charcoal/90 lg:basis-auto">
                  {course.instructor}
                </span>
                <span className="font-serif font-medium text-sm sm:text-base text-clay lg:mt-1">
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
  const [activeTrack, setActiveTrack] = useState<CourseTrack>("all");

  // Read URL query parameter ?track= on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const trackParam = params.get("track");
      if (trackParam === "diploma" || trackParam === "biogeometry" || trackParam === "all") {
        setActiveTrack(trackParam);
      }
    }
  }, []);

  const handleSelectTrack = (track: CourseTrack) => {
    setActiveTrack(track);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (track === "all") {
        url.searchParams.delete("track");
      } else {
        url.searchParams.set("track", track);
      }
      window.history.replaceState({}, "", url.toString());

      // If switching to a specific track, scroll gently to the curriculum section
      const targetElement = document.getElementById(track === "all" ? "curriculum-top" : track);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

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

  // Identify groups
  const diplomaGroup = useMemo(
    () => courseGroups.find((g) => g.type === "diploma"),
    [courseGroups]
  );
  const biogeometryGroup = useMemo(
    () =>
      courseGroups.find(
        (g) => g.type === "leveled" || g.title.toLowerCase().includes("biogeometry")
      ),
    [courseGroups]
  );

  const diplomaCourses = useMemo(
    () => (diplomaGroup ? asCourses(diplomaGroup) : []),
    [diplomaGroup]
  );
  const biogeometryCourses = useMemo(
    () => (biogeometryGroup ? asCourses(biogeometryGroup) : []),
    [biogeometryGroup]
  );

  // Groups to display based on track filter
  const visibleGroups = useMemo(() => {
    if (activeTrack === "diploma") {
      return diplomaGroup ? [diplomaGroup] : [];
    }
    if (activeTrack === "biogeometry") {
      return biogeometryGroup ? [biogeometryGroup] : [];
    }
    return courseGroups;
  }, [activeTrack, courseGroups, diplomaGroup, biogeometryGroup]);

  return (
    <>
      <CmsPageHeader pageKey="courses" />

      <ThresholdDoorway label="CURRICULUM" />

      <Section
        id="curriculum-top"
        rhythm="atrium"
        contained={false}
        className={!loading && !loadError && courseGroups.length > 0 ? "pb-4" : undefined}
      >
        <PageContainer className="relative space-y-16 lg:space-y-24">
          {/* Drafting accents stay local to the curriculum */}
          <BioGeometryShape
            kind="coil"
            variant="draw"
            size={280}
            stroke="var(--color-clay)"
            opacity={0.4}
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
            opacity={0.35}
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

          {!loading && !loadError && courseGroups.length > 0 && (
            <div className="relative z-[1]">
              {/* Above-the-fold Track Navigation Tabs */}
              <CourseTrackNav
                activeTrack={activeTrack}
                onSelectTrack={handleSelectTrack}
                diplomaCount={diplomaCourses.length}
                biogeometryCount={biogeometryCourses.length}
              />

              {/* In 'all' mode: Show side-by-side Dual Pathway Grid for prominent discovery */}
              {activeTrack === "all" && (
                <CurriculumPathwayGrid
                  diplomaGroup={diplomaGroup}
                  biogeometryGroup={biogeometryGroup}
                  onSelectTrack={handleSelectTrack}
                />
              )}

              {/* Filter active reset helper */}
              {activeTrack !== "all" && (
                <div className="mb-10 flex items-center justify-between border-b border-hairline pb-4">
                  <p className="type-infill text-sm">
                    Showing <strong className="text-charcoal font-semibold">{activeTrack === "diploma" ? "Architecture Diploma" : "Biogeometry Track"}</strong> courses only.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelectTrack("all")}
                    className="action-secondary inline-flex items-center px-3 py-1.5 text-xs"
                  >
                    ← View All Programmes
                  </button>
                </div>
              )}

              {/* Group Sections */}
              <div className="space-y-20 lg:space-y-28">
                {visibleGroups.map((group, groupIndex) => {
                  const slug = courseGroupSlug(group);
                  const courses = asCourses(group);
                  const isDiploma = group.type === "diploma";
                  const isLeveled = group.type === "leveled";
                  const sectionId = isDiploma ? "diploma" : isLeveled ? "biogeometry" : slug;

                  return (
                    <div
                      key={group._id ?? group.id ?? slug}
                      id={sectionId}
                      className="relative scroll-mt-24"
                    >
                      {/* Section Doorway */}
                      <ThresholdDoorway
                        label={
                          isDiploma
                            ? "DIPLOMA PROGRAMME — ARCHITECTURE"
                            : isLeveled
                            ? "BIOGEOMETRY TRACK — LEVEL PROGRESSION"
                            : group.title.toUpperCase()
                        }
                        className="mb-12"
                      />

                      <GsapReveal type="heading">
                        <div className="relative z-[1] mb-10 space-y-8">
                          <MediaBay
                            src={group.image}
                            alt={group.title}
                            className={`w-full ${
                              groupIndex === 0 && activeTrack === "all"
                                ? "aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
                                : "aspect-[16/10] lg:aspect-[21/9]"
                            }`}
                            fallback="course"
                            morph
                            priority={groupIndex === 0}
                            sizes="100vw"
                          />
                          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
                            <div className="lg:col-span-8">
                              <p className="eyebrow mb-2">{group.subtitle}</p>
                              <SplitTextReveal type="lines">
                                <h2 className="type-heading">{group.title}</h2>
                              </SplitTextReveal>
                              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                                <span className="label-caps text-charcoal">
                                  {courses.length}{" "}
                                  {courses.length === 1 ? "course" : isLeveled ? "levels" : "courses"}
                                </span>
                                <span className="label-caps">
                                  {isDiploma
                                    ? "Diploma programme"
                                    : "Sequential level progression"}
                                </span>
                                <span className="type-infill text-charcoal font-medium">
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
                                Explore programme overview
                              </Link>
                            </div>
                          </div>
                        </div>
                      </GsapReveal>

                      <GsapReveal type="card" delay={0.08}>
                        <ThresholdFrame
                          label={
                            isDiploma
                              ? "Bay 01 — Architecture Diploma Set"
                              : "Bay 02 — Biogeometry Curriculum & Progression"
                          }
                        >
                          <div
                            className={`relative z-[1] mt-4 hairline-border p-4 sm:p-6 lg:p-8 ${
                              isDiploma ? "section-intimate" : ""
                            }`}
                          >
                            {/* Diploma Bundle Package Feature */}
                            {isDiploma && group.bundlePrice && (
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10 hairline-b pb-10">
                                <div className="max-w-xl">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-clay" />
                                    <p className="label-caps text-clay font-medium text-xs sm:text-sm">
                                      Complete Diploma Package
                                    </p>
                                  </div>
                                  <h4 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal mb-2">
                                    Full Architecture Diploma
                                  </h4>
                                  <p className="text-base sm:text-lg leading-relaxed text-charcoal/90">
                                    Enroll in the comprehensive Architecture Diploma to access
                                    all 4 core studio courses. Includes full drawing-set deliverables,
                                    studio access, and personal critique sessions.
                                  </p>
                                  <LevelProgressLine progress={1} className="mt-4 max-w-xs" />
                                </div>
                                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
                                  <p className="font-serif font-medium text-2xl sm:text-3xl text-clay whitespace-nowrap">
                                    {group.bundlePrice}
                                  </p>
                                  <EnrollButton
                                    id={`diploma-${slug}`}
                                    name={group.title}
                                    price={group.bundlePrice}
                                    kind="diploma"
                                    label="Add diploma to cart"
                                    className="action-primary inline-flex min-h-11 items-center disabled:text-clay-muted disabled:cursor-not-allowed"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Biogeometry Level Stepper & Prerequisite Roadmap */}
                            {isLeveled && <BiogeometryLevelStepper />}

                            {/* Course / Level Listing */}
                            <CourseListing
                              courses={courses}
                              numbered={isDiploma}
                              groupImage={group.image}
                            />
                          </div>
                        </ThresholdFrame>
                      </GsapReveal>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </PageContainer>
      </Section>
    </>
  );
}
