"use client";

import Link from "next/link";
import { BioGeometryShape } from "@/components/BioGeometryShape";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { LevelProgressLine } from "@/components/decorative/LevelProgressLine";
import { MediaBay } from "@/components/decorative/MediaBay";
import type { CourseGroup } from "@/lib/api/types";
import { courseGroupSlug } from "@/lib/api/courseGroups";

interface CurriculumPathwayGridProps {
  diplomaGroup?: CourseGroup;
  biogeometryGroup?: CourseGroup;
  onSelectTrack: (track: "diploma" | "biogeometry") => void;
}

export function CurriculumPathwayGrid({
  diplomaGroup,
  biogeometryGroup,
  onSelectTrack,
}: CurriculumPathwayGridProps) {
  const diplomaSlug = diplomaGroup ? courseGroupSlug(diplomaGroup) : "architecture-diploma";
  const biogeometrySlug = biogeometryGroup ? courseGroupSlug(biogeometryGroup) : "biogeometry";

  return (
    <div className="mb-14 sm:mb-16">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <span className="label-caps text-clay">Two Distinct Academic Paths</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal mt-1">
            Curriculum at a Glance
          </h2>
        </div>
        <p className="type-infill text-sm max-w-md">
          Choose between our comprehensive professional studio diploma or our sequential
          three-level biogeometry science track.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Track 01: Architecture Diploma */}
        <div className="relative border border-hairline bg-concrete/60 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-charcoal/30 hover:bg-concrete-dark/20">
          <div className="relative z-[1] space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-hairline pb-4">
              <div>
                <span className="label-caps text-clay">Track 01 · Studio Diploma</span>
                <p className="font-mono text-xs text-charcoal/60 mt-0.5">4 Core Courses · Studio Programme</p>
              </div>
              <span className="font-serif font-medium text-sm sm:text-base text-clay">
                {diplomaGroup?.bundlePrice || "EGP 52,000"}
              </span>
            </div>

            {diplomaGroup?.image && (
              <div className="relative aspect-[16/9] w-full overflow-hidden border border-hairline my-2">
                <MediaBay
                  src={diplomaGroup.image}
                  alt={diplomaGroup.title}
                  className="w-full h-full"
                  fallback="course"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              </div>
            )}

            <div>
              <ScaleBar scale="1:100" className="mb-2 max-w-[90px]" />
              <h3 className="font-serif text-2xl font-medium text-charcoal">
                Architecture Diploma
              </h3>
              <p className="text-base sm:text-[1.0625rem] leading-relaxed mt-2.5 text-charcoal/90">
                A structured professional qualification covering proportion, drawing conventions,
                material studies, and culminated in an integrated design studio with personal critique.
              </p>
            </div>

            <div className="border-t border-hairline/60 pt-4 space-y-2">
              <p className="label-caps text-xs text-charcoal">Key Highlights:</p>
              <ul className="text-sm sm:text-[0.9375rem] text-charcoal/85 space-y-2 list-disc list-inside">
                <li>Complete 4-sheet curriculum: Spatial Composition, Drawing, Materials, Studio</li>
                <li>One-on-one studio critiques & formal drawing-set review</li>
                <li>Available as an all-inclusive bundle or course-by-course</li>
              </ul>
            </div>
          </div>

          <div className="relative z-[1] pt-6 mt-6 border-t border-hairline flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTrack("diploma")}
              className="action-primary inline-flex min-h-11 items-center px-4 text-sm"
            >
              Explore Diploma Courses
            </button>
            <Link
              href={`/courses/${diplomaSlug}`}
              className="action-secondary inline-flex min-h-11 items-center px-4 text-sm"
            >
              Full Details →
            </Link>
          </div>
        </div>

        {/* Track 02: Biogeometry */}
        <div className="relative border border-clay/40 bg-concrete/70 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-clay hover:bg-concrete-dark/30 overflow-hidden">
          {/* Distinctive BioGeometry shape accent in background */}
          <div className="pointer-events-none absolute -right-10 -top-10 opacity-30">
            <BioGeometryShape
              kind="bg3"
              size={220}
              stroke="var(--color-clay)"
              opacity={0.35}
            />
          </div>

          <div className="relative z-[1] space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-hairline pb-4">
              <div>
                <span className="label-caps text-clay font-medium">Track 02 · Harmonization Science</span>
                <p className="font-mono text-xs text-charcoal/60 mt-0.5">3 Sequential Levels · Energy & Form</p>
              </div>
              <span className="font-serif font-medium text-sm sm:text-base text-clay">
                From EGP 14,500
              </span>
            </div>

            {biogeometryGroup?.image && (
              <div className="relative aspect-[16/9] w-full overflow-hidden border border-hairline my-2">
                <MediaBay
                  src={biogeometryGroup.image}
                  alt={biogeometryGroup.title}
                  className="w-full h-full"
                  fallback="course"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[0.7rem] uppercase tracking-wider px-2 py-0.5 border border-clay/30 bg-clay/10 text-clay font-medium">
                  Sequential Prerequisite Progression
                </span>
              </div>
              <h3 className="font-serif text-2xl font-medium text-charcoal">
                Biogeometry
              </h3>
              <p className="text-base sm:text-[1.0625rem] leading-relaxed mt-2.5 text-charcoal/90">
                The qualitative science of form and energy founded by Dr. Ibrahim Karim. Learn how geometric
                shapes, harmonic ratios, and physical resonance balance living environments.
              </p>
            </div>

            <div className="border-t border-hairline/60 pt-4 space-y-2">
              <p className="label-caps text-xs text-charcoal">Sequential Progression:</p>
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-charcoal">Level 01: Principles & Sacred Geometry</span>
                  <LevelProgressLine progress={0.33} className="w-16" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-charcoal">Level 02: Site & Interior Applications</span>
                  <LevelProgressLine progress={0.66} className="w-16" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-charcoal">Level 03: Advanced Harmonization</span>
                  <LevelProgressLine progress={1.0} className="w-16" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-[1] pt-6 mt-6 border-t border-hairline flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTrack("biogeometry")}
              className="action-primary inline-flex min-h-11 items-center px-4 text-sm bg-clay hover:bg-clay-muted text-concrete"
            >
              Explore Biogeometry Track
            </button>
            <Link
              href={`/courses/${biogeometrySlug}`}
              className="action-secondary inline-flex min-h-11 items-center px-4 text-sm"
            >
              Full Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
