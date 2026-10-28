import Link from "next/link";
import { CourseMaterials } from "@/components/courses/CourseMaterials";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { MediaBay } from "@/components/decorative/MediaBay";
import { SectionCutDivider } from "@/components/decorative/SectionCutDivider";
import { LevelProgressLine } from "@/components/decorative/LevelProgressLine";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { TracingBeam } from "@/components/animation/TracingBeam";
import { DecryptedText } from "@/components/animation/DecryptedText";
import { formatCourseDuration } from "@/lib/api/courses";
import {
  asCourses,
  courseGroupSlug,
  getGroupRelatedProductIds,
} from "@/lib/api/courseGroups";
import type { CourseGroup } from "@/lib/api/types";
import { formatSheetRef } from "@/lib/sheet";

interface DiplomaCourseDetailProps {
  group: CourseGroup;
}

/**
 * Diploma programme detail — drawing-set cover sheet.
 * Sub-courses are ungated: listed in order with links to each lesson index.
 * Materials use group.relatedProductIds when set, else the union of sub-courses.
 */
export function DiplomaCourseDetail({ group }: DiplomaCourseDetailProps) {
  const courses = asCourses(group);
  const instructor = courses[0]?.instructor ?? "";
  const materialIds = getGroupRelatedProductIds(group);
  const enrollId = `diploma-${courseGroupSlug(group)}`;

  return (
    <div className="space-y-16 lg:space-y-20">
      <MediaBay
        src={group.image}
        alt={group.title}
        className="aspect-[16/10] lg:aspect-[21/9]"
        fallback="course"
        morph
        priority
        revealOnLoad
        sizes="100vw"
      />

      <div className="hairline-border p-6 lg:p-10 section-intimate">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div className="max-w-xl">
            <p className="label-caps mb-2 text-clay font-medium text-xs sm:text-sm">
              Diploma Programme
            </p>
            <p className="text-base sm:text-lg leading-relaxed text-charcoal/90">
              {group.subtitle}
            </p>
            <p className="text-base sm:text-[1.0625rem] mt-3 leading-relaxed text-charcoal/80">
              {instructor}. Enroll once for the full drawing set — every
              sub-course sheet is included in the bundle.
            </p>
            <LevelProgressLine progress={1} className="mt-6 max-w-[160px]" />
          </div>
          <div className="flex flex-col gap-4 lg:items-end shrink-0">
            {group.bundlePrice && (
              <p className="font-serif font-medium text-2xl sm:text-3xl text-clay whitespace-nowrap">
                {group.bundlePrice}
              </p>
            )}
            <p className="label-caps text-xs sm:text-sm text-charcoal/70">
              {String(courses.length).padStart(2, "0")} sheets in set
            </p>
            {group.bundlePrice && (
              <EnrollButton
                id={enrollId}
                name={group.title}
                price={group.bundlePrice}
                kind="diploma"
                label="Add diploma to cart"
                className="cta-entrance"
              />
            )}
          </div>
        </div>
      </div>

      <ThresholdFrame label={`Sheet index — ${group.title}`}>
        <div className="hairline-border p-6 lg:p-10 mt-4">
          <p className="label-caps mb-6 text-charcoal font-semibold text-xs sm:text-sm tracking-wider">
            Drawing set cover — {String(courses.length).padStart(2, "0")} sheets
          </p>
          <TracingBeam>
            <ul>
              {courses.map((course, i) => {
                const sheetRef = formatSheetRef(i, "D");
                const duration = formatCourseDuration(course);

                return (
                  <li key={course.id}>
                    <Link
                      href={`/courses/${course.slug}`}
                      className={`group grid grid-cols-1 gap-3 py-6 transition-colors duration-200 hover:bg-concrete-dark/40 sm:grid-cols-12 sm:gap-4 ${
                        i > 0 ? "hairline-t" : ""
                      }`}
                    >
                      <span className="col-span-1 font-mono text-sm sm:text-base text-clay font-medium pt-0.5 sm:col-span-1">
                        <DecryptedText text={String(i + 1).padStart(2, "0")} animateOn="hover" />
                      </span>
                      <span className="hidden sm:col-span-2 sm:block font-mono text-xs text-charcoal/60 pt-0.5">
                        <DecryptedText text={sheetRef} animateOn="hover" />
                      </span>
                      <span className="sm:col-span-5">
                        <span className="font-serif text-lg sm:text-xl font-medium text-charcoal group-hover:text-clay transition-colors block">
                          {course.title}
                        </span>
                        <span className="text-xs sm:text-sm text-charcoal-infill mt-1 block">
                          {course.level}
                          <span className="sm:hidden"> · {sheetRef}</span>
                        </span>
                      </span>
                      <span className="text-sm sm:text-base font-medium text-charcoal/70 pt-0.5 sm:col-span-2 sm:text-right">
                        {duration}
                      </span>
                      <span className="action-secondary text-sm sm:text-base font-medium pt-0.5 self-start sm:col-span-2 sm:text-right">
                        Open course details
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </TracingBeam>
        </div>
      </ThresholdFrame>

      {materialIds.length > 0 && (
        <>
          <SectionCutDivider label="MATERIALS" />
          <div>
            <p className="eyebrow mb-2">Specified equipment</p>
            <h2 className="type-heading mb-8">Materials &amp; tools</h2>
            <ThresholdFrame label="Stock list — Diploma">
              <div className="pt-4">
                <CourseMaterials relatedProductIds={materialIds} />
              </div>
            </ThresholdFrame>
          </div>
        </>
      )}

      {group.bundlePrice && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 hairline-t pt-10">
          <div>
            <p className="label-caps mb-2 text-clay font-medium text-xs sm:text-sm">Full programme enrollment</p>
            <p className="text-base sm:text-lg leading-relaxed text-charcoal/90 max-w-md">
              One enrollment unlocks every sheet in this diploma set.
            </p>
          </div>
          <EnrollButton
            id={enrollId}
            name={group.title}
            price={group.bundlePrice}
            kind="diploma"
            label={`Add to cart · ${group.bundlePrice}`}
            className="cta-entrance"
          />
        </div>
      )}
    </div>
  );
}
