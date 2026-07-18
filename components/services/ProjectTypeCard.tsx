"use client";

import { ScaleBar } from "@/components/decorative/ScaleBar";

interface ProjectTypeCardProps {
  sheetRef: string;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

export function ProjectTypeCard({
  sheetRef,
  title,
  description,
  selected,
  onSelect,
}: ProjectTypeCardProps) {
  const bracket =
    "absolute w-6 h-6 pointer-events-none transition-colors duration-200";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative w-full text-left p-8 lg:p-10 transition-colors duration-200 ${
        selected
          ? "bg-concrete-dark"
          : "bg-concrete hover:bg-concrete-dark/50"
      }`}
    >
      <span
        className={`${bracket} top-0 left-0 border-t border-l ${
          selected ? "border-clay" : "border-charcoal/35"
        }`}
        aria-hidden="true"
      />
      <span
        className={`${bracket} top-0 right-0 border-t border-r ${
          selected ? "border-clay" : "border-charcoal/35"
        }`}
        aria-hidden="true"
      />
      <span
        className={`${bracket} bottom-0 left-0 border-b border-l ${
          selected ? "border-clay" : "border-charcoal/35"
        }`}
        aria-hidden="true"
      />
      <span
        className={`${bracket} bottom-0 right-0 border-b border-r ${
          selected ? "border-clay" : "border-charcoal/35"
        }`}
        aria-hidden="true"
      />

      <ScaleBar scale="1:50" className="mb-6 max-w-[120px]" />
      <p className="label-caps mb-2 text-charcoal-infill">{sheetRef}</p>
      <h2 className="type-title">{title}</h2>
      <p className="type-infill mt-4 max-w-md leading-relaxed">{description}</p>
      <p className="action-secondary mt-6 inline-block">
        {selected ? "Project sheet open" : "Open project sheet"}
      </p>
    </button>
  );
}
