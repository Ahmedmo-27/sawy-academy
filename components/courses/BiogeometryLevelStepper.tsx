"use client";

import { BioGeometryShape } from "@/components/BioGeometryShape";
import { DecryptedText } from "@/components/animation/DecryptedText";

interface LevelStep {
  number: string;
  title: string;
  focus: string;
  prerequisite: string;
  harmonicFreq: string;
}

const STEPS: LevelStep[] = [
  {
    number: "01",
    title: "Level 01 — Foundations & Sacred Geometry",
    focus: "Principles of form, harmonic centers, pendulum basics, and energy balancing in 2D & 3D space.",
    prerequisite: "Open to all students · Foundational gateway",
    harmonicFreq: "HARMONIC BASE // 7.83Hz",
  },
  {
    number: "02",
    title: "Level 02 — Site & Interior Applications",
    focus: "Harmonic site analysis, solar alignments, interior furniture placement, and partition order.",
    prerequisite: "Prerequisite: Level 01 completion",
    harmonicFreq: "RESONANCE FLUX // 14.1Hz",
  },
  {
    number: "03",
    title: "Level 03 — Advanced Harmonization",
    focus: "Complex environmental remediation, bio-signalling, and integrated architectural energy design.",
    prerequisite: "Prerequisite: Level 01 & 02 completion",
    harmonicFreq: "BG3 SYNTHESIS // 20.3Hz",
  },
];

export function BiogeometryLevelStepper() {
  return (
    <div className="border border-clay/30 bg-concrete-dark/30 p-5 sm:p-7 my-8 relative overflow-hidden">
      {/* BioGeometry Coil Background Accent */}
      <div className="pointer-events-none absolute right-2 bottom-2 opacity-20 hidden md:block">
        <BioGeometryShape kind="coil" size={140} stroke="var(--color-clay)" />
      </div>

      <div className="max-w-2xl mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-clay animate-pulse" />
          <span className="label-caps text-clay font-medium text-xs sm:text-sm">
            Harmonic Progression Pathway
          </span>
        </div>
        <h4 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal">
          Three-Level Prerequisite Roadmap
        </h4>
        <p className="text-base sm:text-[1.0625rem] leading-relaxed mt-1.5 text-charcoal/90">
          Unlike standard electives, Biogeometry is an integrated qualitative science where each level
          builds directly upon the instruments and calibrations of the previous level.
        </p>
      </div>

      {/* SVG Harmonic Wave connecting the levels */}
      <div className="relative mb-4 hidden md:block" aria-hidden="true">
        <svg
          viewBox="0 0 900 36"
          className="w-full h-9 stroke-clay/40 fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 50 18 Q 200 0, 350 18 T 650 18 T 850 18"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          {/* Level Nodes */}
          <circle cx="150" cy="18" r="5" className="fill-concrete stroke-clay stroke-2" />
          <circle cx="450" cy="18" r="5" className="fill-concrete stroke-clay stroke-2" />
          <circle cx="750" cy="18" r="5" className="fill-concrete stroke-clay stroke-2" />
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-[1]">
        {STEPS.map((step, index) => (
          <div
            key={step.number}
            className="group border border-hairline bg-concrete/95 p-5 sm:p-6 relative flex flex-col justify-between transition-all duration-300 hover:border-clay hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between border-b border-hairline/60 pb-2.5 mb-3.5">
                <span className="font-mono text-xs font-semibold text-clay tracking-wider">
                  <DecryptedText text={`STEP ${step.number}`} animateOn="hover" />
                </span>
                <span className="font-mono text-[0.65rem] uppercase tracking-wider text-charcoal/60 px-2 py-0.5 border border-hairline bg-concrete">
                  {index === 0 ? "Entry Level" : `Prereq: 0${index}`}
                </span>
              </div>

              <span className="font-mono text-[9px] text-clay/70 block mb-1">
                {step.harmonicFreq}
              </span>

              <h5 className="font-serif text-base sm:text-lg font-medium text-charcoal group-hover:text-clay transition-colors mb-2.5">
                {step.title}
              </h5>
              <p className="text-sm sm:text-[0.9375rem] leading-relaxed text-charcoal/90">
                {step.focus}
              </p>
            </div>

            <div className="pt-3 mt-4 border-t border-hairline/50">
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
