"use client";

import type { KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { DecryptedText } from "@/components/animation/DecryptedText";

export type CourseTrack = "all" | "diploma" | "biogeometry";

interface CourseTrackNavProps {
  activeTrack: CourseTrack;
  onSelectTrack: (track: CourseTrack) => void;
  diplomaCount?: number;
  biogeometryCount?: number;
}

interface TrackTab {
  id: CourseTrack;
  label: string;
  badge: string;
  tagline: string;
}

export function CourseTrackNav({
  activeTrack,
  onSelectTrack,
  diplomaCount = 4,
  biogeometryCount = 3,
}: CourseTrackNavProps) {
  const tabs: TrackTab[] = [
    {
      id: "all",
      label: "All Curricula",
      badge: `${diplomaCount + biogeometryCount} courses`,
      tagline: "Overview & both academic disciplines",
    },
    {
      id: "diploma",
      label: "Architecture Diploma",
      badge: `${diplomaCount} studio courses`,
      tagline: "Professional studio qualification",
    },
    {
      id: "biogeometry",
      label: "Biogeometry Track",
      badge: `${biogeometryCount} progressive levels`,
      tagline: "Harmonic energy & form science",
    },
  ];

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTrack);
    if (currentIndex === -1) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % tabs.length;
      onSelectTrack(tabs[nextIndex].id);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      onSelectTrack(tabs[prevIndex].id);
    }
  };

  return (
    <div
      className="border-y border-hairline py-4 my-8"
      role="navigation"
      aria-label="Curriculum disciplines"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <span className="label-caps text-clay">Academic Pathways</span>
          <p className="type-infill text-sm mt-0.5">
            Select a specific track to focus your study, or browse all offerings.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-charcoal/60 uppercase tracking-widest">
          <span>Track Mode</span>
          <span className="w-1.5 h-1.5 rounded-full bg-clay" />
          <span className="text-charcoal font-semibold">{activeTrack}</span>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Filter curriculum tracks"
        onKeyDown={handleKeyDown}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
      >
        {tabs.map((tab, idx) => {
          const isActive = activeTrack === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`track-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`track-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectTrack(tab.id)}
              className={`group text-left px-4 py-3.5 border transition-all duration-200 relative ${
                isActive
                  ? "border-clay bg-concrete-dark/40 shadow-sm"
                  : "border-hairline bg-concrete/60 hover:bg-concrete-dark/25 hover:border-charcoal/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono text-xs text-clay font-medium tracking-wider">
                  <DecryptedText text={`0${idx + 1}`} animateOn="hover" />
                </span>
                <span
                  className={`text-[0.7rem] uppercase tracking-wider px-2 py-0.5 border ${
                    isActive
                      ? "border-clay/40 bg-clay/10 text-clay font-medium"
                      : "border-hairline text-charcoal/60"
                  }`}
                >
                  {tab.badge}
                </span>
              </div>
              <h3
                className={`font-serif text-base sm:text-lg font-medium transition-colors ${
                  isActive ? "text-clay" : "text-charcoal group-hover:text-clay"
                }`}
              >
                {tab.label}
              </h3>
              <p className="text-xs text-charcoal-infill line-clamp-1 mt-0.5">
                {tab.tagline}
              </p>

              {isActive && (
                <motion.div
                  layoutId="trackNavActiveIndicator"
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 35,
                  }}
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-clay"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
