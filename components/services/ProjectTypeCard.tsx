"use client";

import { MediaBay } from "@/components/decorative/MediaBay";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import type { MediaFallbackKind } from "@/components/decorative/MediaFallbackSketch";

interface ProjectTypeCardProps {
  index: string;
  sheetRef: string;
  title: string;
  description: string;
  details: string[];
  selected: boolean;
  onSelect: () => void;
  imageUrl?: string;
  fallback?: MediaFallbackKind;
}

export function ProjectTypeCard({
  index,
  sheetRef,
  title,
  description,
  details,
  selected,
  onSelect,
  imageUrl,
  fallback = "service",
}: ProjectTypeCardProps) {
  const bracket =
    "absolute w-6 h-6 pointer-events-none transition-colors duration-200";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-controls="request-brief"
      className={`group relative w-full overflow-hidden p-6 text-left transition-colors duration-300 sm:p-8 lg:p-10 ${
        selected
          ? "bg-concrete-dark"
          : "bg-concrete hover:bg-concrete-dark/45"
      }`}
    >
      <span
        className={`absolute inset-x-0 top-0 h-0.5 origin-left bg-clay transition-transform duration-500 ${
          selected ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
        aria-hidden="true"
      />
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

      <div className="mb-6 flex items-start justify-between gap-5">
        <div>
          <p className="label-caps mb-2 text-charcoal-infill">{sheetRef}</p>
          <p className="dim-label">
            {selected ? "Selected for briefing" : "Available project sheet"}
          </p>
        </div>
        <span
          className={`font-serif text-5xl font-light leading-none transition-colors ${
            selected ? "text-clay" : "text-charcoal/15 group-hover:text-clay/60"
          }`}
          aria-hidden="true"
        >
          {index}
        </span>
      </div>

      <MediaBay
        src={imageUrl}
        alt={title}
        className="mb-7 aspect-[16/10]"
        fallback={fallback}
        morph
      />

      <ScaleBar scale="1:50" className="mb-6 max-w-[120px]" />
      <h3 className="type-title">{title}</h3>
      <p className="type-infill mt-4 max-w-md leading-relaxed">{description}</p>

      <ul
        className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-y border-hairline py-4"
        aria-label={`${title} areas`}
      >
        {details.map((detail) => (
          <li key={detail} className="label-caps">
            {detail}
          </li>
        ))}
      </ul>

      <span className="action-secondary mt-7 inline-block">
        {selected ? "Project sheet selected" : "Select this path"}
      </span>
    </button>
  );
}
