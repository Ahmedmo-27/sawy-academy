"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BioGeometryShape } from "@/components/BioGeometryShape";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { Reveal } from "@/components/Reveal";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { LevelProgressLine } from "@/components/decorative/LevelProgressLine";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { SectionLoader } from "@/components/feedback/SectionLoader";
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
}: {
  courses: Course[];
  numbered?: boolean;
}) {
  return (
    <div>
      {courses.map((course, i) => (
        <Reveal key={course.id} variant="grid" delay={i * 50}>
          <div
            className={`grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 py-8 ${
              i > 0 ? "hairline-t" : ""
            }`}
          >
            {numbered && (
              <div className="lg:col-span-1">
                <span className="label-caps text-clay">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            )}
            <div className="lg:col-span-7">
              <ScaleBar scale="1:100" className="mb-4 max-w-[120px]" />
              <h3 className="type-title mb-2">
                <Link
                  href={`/courses/${course.slug}`}
                  className="hover:text-clay transition-colors duration-200"
                >
                  {course.title}
                </Link>
              </h3>
              <p className="type-infill leading-relaxed">{course.description}</p>
              <Link
                href={`/courses/${course.slug}`}
                className="action-secondary mt-4 inline-block"
              >
                Open course details
              </Link>
            </div>
            <div className="lg:col-span-4 flex flex-col lg:items-end gap-3">
              <span className="label-caps">{course.level}</span>
              <LevelProgressLine
                progress={parseLevelProgress(course.level)}
                className="lg:ml-auto w-full max-w-[140px]"
              />
              <span className="type-infill">{course.instructor}</span>
              <span className="type-body text-charcoal">{course.price}</span>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export default function CoursesPage() {
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
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
        if (!cancelled) setCourseGroups([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <CmsPageHeader pageKey="courses" />

      <ThresholdDoorway label="CURRICULUM" />

      <Section rhythm="standard" contained={false}>
        <PageContainer className="relative space-y-16 lg:space-y-24">
          {/* Fixed drafting accents — stay in view and scrub with scroll */}
          <BioGeometryShape
            kind="coil"
            variant="draw"
            size={280}
            stroke="var(--color-clay)"
            opacity={0.5}
            drawEnd={0.5}
            parallax={220}
            parallaxX={40}
            parallaxRotate={12}
            className="fixed right-[max(0.5rem,calc((100vw-72rem)/2-2rem))] top-[22%] z-0 hidden md:block"
          />
          <BioGeometryShape
            kind="c7"
            variant="draw"
            size={240}
            stroke="var(--color-clay-muted)"
            opacity={0.45}
            drawEnd={0.7}
            parallax={140}
            parallaxX={-50}
            parallaxRotate={-6}
            className="fixed left-[max(0.5rem,calc((100vw-72rem)/2-1.5rem))] bottom-[18%] z-0 hidden md:block"
          />

          {loading && (
            <SectionLoader
              label="Loading curriculum…"
              stepLabel="Fetching course groups"
              progress={progress}
            />
          )}
          {!loading &&
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

                  <Reveal variant="structural">
                    <div className="relative z-[1] mb-8">
                      <p className="eyebrow mb-2">{group.subtitle}</p>
                      <h2 className="type-heading">
                        <Link
                          href={`/courses/${slug}`}
                          className="hover:text-clay transition-colors duration-200"
                        >
                          {group.title}
                        </Link>
                      </h2>
                      <Link
                        href={`/courses/${slug}`}
                        className="action-primary mt-5 inline-block"
                      >
                        Open course details
                      </Link>
                    </div>
                  </Reveal>

                  <Reveal variant="structural" delay={80}>
                    <ThresholdFrame
                      label={
                        group.type === "diploma"
                          ? "Bay 03 — Diploma Programme"
                          : "Bay 04 — Leveled Course"
                      }
                    >
                      <div
                        className={`relative z-[1] hairline-border p-6 lg:p-10 mt-4 ${
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
                              className="action-primary lg:mt-2 disabled:text-clay-muted disabled:cursor-not-allowed"
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
                        />
                      </div>
                    </ThresholdFrame>
                  </Reveal>
                </div>
              );
            })}
        </PageContainer>
      </Section>
    </>
  );
}
