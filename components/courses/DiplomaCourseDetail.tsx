import Link from "next/link";
import { CourseMaterials } from "@/components/courses/CourseMaterials";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { SectionCutDivider } from "@/components/decorative/SectionCutDivider";
import { LevelProgressLine } from "@/components/decorative/LevelProgressLine";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import {
  formatCourseDuration,
  getGroupRelatedProductIds,
  type CourseGroup,
} from "@/lib/data/courses";
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
  const instructor = group.courses[0]?.instructor ?? "";
  const materialIds = getGroupRelatedProductIds(group);
  const enrollId = `diploma-${group.slug}`;

  return (
    <div className="space-y-16 lg:space-y-20">
      <div className="hairline-border p-6 lg:p-10 section-intimate">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div className="max-w-xl">
            <ScaleBar scale="1:100" className="mb-4 max-w-[120px]" />
            <p className="label-caps mb-2">Diploma Programme</p>
            <p className="type-infill leading-relaxed">{group.subtitle}</p>
            <p className="type-infill mt-4 leading-relaxed text-charcoal-muted">
              {instructor}. Enroll once for the full drawing set — every
              sub-course sheet is included in the bundle.
            </p>
            <LevelProgressLine progress={1} className="mt-6 max-w-[160px]" />
          </div>
          <div className="flex flex-col gap-4 lg:items-end shrink-0">
            {group.bundlePrice && (
              <p className="type-display text-clay whitespace-nowrap">
                {group.bundlePrice}
              </p>
            )}
            <p className="label-caps">
              {String(group.courses.length).padStart(2, "0")} sheets in set
            </p>
            {group.bundlePrice && (
              <EnrollButton
                id={enrollId}
                name={group.title}
                price={group.bundlePrice}
                kind="diploma"
                label="Enroll in diploma"
                className="cta-entrance"
              />
            )}
          </div>
        </div>
      </div>

      <ThresholdFrame label={`Sheet index — ${group.title}`}>
        <div className="hairline-border p-6 lg:p-10 mt-4">
          <ScaleBar scale="1:100" className="mb-6 max-w-[120px]" />
          <p className="label-caps mb-6 text-charcoal-infill">
            Drawing set cover — {String(group.courses.length).padStart(2, "0")}{" "}
            sheets
          </p>
          <ul>
            {group.courses.map((course, i) => {
              const sheetRef = formatSheetRef(i, "D");
              const duration = formatCourseDuration(course);

              return (
                <li key={course.id}>
                  <Link
                    href={`/courses/${course.slug}`}
                    className={`group grid grid-cols-12 gap-4 py-6 transition-colors duration-200 hover:bg-concrete-dark/40 ${
                      i > 0 ? "hairline-t" : ""
                    }`}
                  >
                    <span className="col-span-2 sm:col-span-1 label-caps text-clay pt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="col-span-3 sm:col-span-2 dim-label pt-0.5">
                      {sheetRef}
                    </span>
                    <span className="col-span-7 sm:col-span-5">
                      <span className="type-title text-base block group-hover:text-charcoal transition-colors">
                        {course.title}
                      </span>
                      <span className="label-caps mt-1 block text-charcoal-infill">
                        {course.level}
                      </span>
                    </span>
                    <span className="col-span-6 sm:col-span-2 label-caps sm:text-right pt-0.5">
                      {duration}
                    </span>
                    <span className="col-span-6 sm:col-span-2 action-secondary sm:text-right pt-0.5 self-start">
                      Open course details
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </ThresholdFrame>

      {materialIds.length > 0 && (
        <>
          <SectionCutDivider label="MATERIALS" />
          <div>
            <ScaleBar scale="1:50" className="mb-6 max-w-[120px]" />
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
            <p className="label-caps mb-2">Full programme enrollment</p>
            <p className="type-infill max-w-md">
              One enrollment unlocks every sheet in this diploma set.
            </p>
          </div>
          <EnrollButton
            id={enrollId}
            name={group.title}
            price={group.bundlePrice}
            kind="diploma"
            label={`Enroll · ${group.bundlePrice}`}
            className="cta-entrance"
          />
        </div>
      )}
    </div>
  );
}
