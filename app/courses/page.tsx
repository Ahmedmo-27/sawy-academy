"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { LevelProgressLine } from "@/components/decorative/LevelProgressLine";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { courseGroups } from "@/lib/data/courses";
import { parseLevelProgress } from "@/lib/motion";

function CourseListing({
  courses,
  numbered,
}: {
  courses: (typeof courseGroups)[number]["courses"];
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
            <div className={numbered ? "lg:col-span-7" : "lg:col-span-7"}>
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
                Open drawing set
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
  return (
    <>
      <PageHeader
        eyebrow="Education"
        title="Courses"
        description="Two programme types — a multi-course Architecture Diploma and the leveled Biogeometry course."
      />

      <ThresholdDoorway label="CURRICULUM" />

      <Section rhythm="standard" contained={false}>
        <PageContainer className="space-y-16 lg:space-y-24">
          {courseGroups.map((group, groupIndex) => (
            <div key={group.title}>
              {groupIndex > 0 && (
                <ThresholdDoorway
                  label={
                    group.type === "leveled" ? "LEVEL PROGRESSION" : "DIPLOMA"
                  }
                  className="mb-12"
                />
              )}

              <Reveal variant="structural">
                <div className="mb-8">
                  <p className="eyebrow mb-2">{group.subtitle}</p>
                  <h2 className="type-heading">{group.title}</h2>
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
                    className={`hairline-border p-6 lg:p-10 mt-4 ${
                      group.type === "diploma" ? "section-intimate" : ""
                    }`}
                  >
                    {group.type === "diploma" && group.bundlePrice && (
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10 hairline-b pb-10">
                        <div>
                          <p className="label-caps mb-2">Diploma Programme</p>
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
                          id="diploma-architecture"
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
                        <p className="label-caps mb-2">Three-Level Progression</p>
                        <p className="type-infill max-w-md leading-relaxed">
                          Biogeometry is taken level by level. Each level builds
                          on the previous.
                        </p>
                        <div className="flex gap-2 mt-4 max-w-xs">
                          <LevelProgressLine progress={0.33} className="flex-1" />
                          <LevelProgressLine progress={0.66} className="flex-1" />
                          <LevelProgressLine progress={1} className="flex-1" />
                        </div>
                      </div>
                    )}

                    <CourseListing
                      courses={group.courses}
                      numbered={group.type === "diploma"}
                    />
                  </div>
                </ThresholdFrame>
              </Reveal>
            </div>
          ))}
        </PageContainer>
      </Section>
    </>
  );
}
