"use client";

import { BioGeometryShape } from "@/components/BioGeometryShape";

interface LevelStep {
  number: string;
  title: string;
  focus: string;
  prerequisite: string;
}

const STEPS: LevelStep[] = [
  {
    number: "01",
    title: "Level 01 — Foundations & Sacred Geometry",
    focus: "Principles of form, harmonic centers, pendulum basics, and energy balancing in 2D & 3D space.",
    prerequisite: "Open to all students · Foundational gateway",
  },
  {
    number: "02",
    title: "Level 02 — Site & Interior Applications",
    focus: "Harmonic site analysis, solar alignments, interior furniture placement, and partition order.",
    prerequisite: "Prerequisite: Level 01 completion",
  },
  {
    number: "03",
    title: "Level 03 — Advanced Harmonization",
    focus: "Complex environmental remediation, bio-signalling, and integrated architectural energy design.",
    prerequisite: "Prerequisite: Level 01 & 02 completion",
  },
];

export function BiogeometryLevelStepper() {
  return (
    <div className="border border-clay/30 bg-concrete-dark/30 p-5 sm:p-7 my-8 relative overflow-hidden">
      <div className="pointer-events-none absolute right-2 bottom-2 opacity-20 hidden md:block">
        <BioGeometryShape kind="coil" size={120} stroke="var(--color-clay)" />
      </div>

      <div className="max-w-2xl mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-clay" />
          <span className="label-caps text-clay font-medium text-xs sm:text-sm">
            Sequential Study Pathway
          </span>
        </div>
        <h4 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal">
          Three-Level Prerequisite Roadmap
        </h4>
        <p className="text-base sm:text-[1.0625rem] leading-relaxed mt-1.5 text-charcoal/90">
          Unlike studio electives, Biogeometry is an integrated qualitative science where each level
          builds directly upon the instruments and calibrations of the previous level.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {STEPS.map((step, index) => (
          <div
            key={step.number}
            className="border border-hairline bg-concrete/90 p-4 sm:p-5 relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b border-hairline/60 pb-2 mb-3">
                <span className="font-mono text-xs font-semibold text-clay">
                  STEP {step.number}
                </span>
                <span className="text-[0.65rem] uppercase tracking-wider text-charcoal/60 px-1.5 py-0.5 border border-hairline">
                  {index === 0 ? "Entry Level" : `Prereq: 0${index}`}
                </span>
              </div>
              <h5 className="font-serif text-base sm:text-lg font-medium text-charcoal mb-2.5">
                {step.title}
              </h5>
              <p className="text-sm sm:text-[0.9375rem] leading-relaxed text-charcoal/90">
                {step.focus}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-hairline/40">
              <span className="font-mono text-xs text-clay font-medium block">
                {step.prerequisite}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
