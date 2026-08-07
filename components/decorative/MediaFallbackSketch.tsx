/**
 * Construction-line SVG fallbacks for empty MediaBay slots.
 * Same drafting vocabulary as PortraitSilhouette / CourseImagePlaceholder.
 */

export type MediaFallbackKind =
  | "portrait"
  | "course"
  | "research"
  | "service"
  | "plan"
  | "product";

interface MediaFallbackSketchProps {
  kind: MediaFallbackKind;
  className?: string;
  label?: string;
}

export function MediaFallbackSketch({
  kind,
  className = "",
  label,
}: MediaFallbackSketchProps) {
  const caption =
    label ??
    (
      {
        portrait: "PORTRAIT",
        course: "COURSE",
        research: "RESEARCH",
        service: "SERVICE",
        plan: "PLAN",
        product: "PRODUCT",
      } as const
    )[kind];

  return (
    <div
      className={`absolute inset-0 bg-concrete-dark/40 ${className}`}
      aria-hidden="true"
    >
      {kind === "portrait" ? (
        <PortraitLines />
      ) : kind === "plan" ? (
        <PlanLines />
      ) : kind === "research" ? (
        <ResearchLines />
      ) : kind === "service" ? (
        <ServiceLines />
      ) : kind === "product" ? (
        <ProductLines />
      ) : (
        <CourseLines />
      )}
      <span className="dim-label absolute bottom-3 left-3 text-[0.55rem]">
        {caption}
      </span>
    </div>
  );
}

function FrameTicks() {
  return (
    <g
      stroke="var(--color-charcoal-infill)"
      strokeWidth="0.75"
      opacity="0.45"
    >
      <path d="M12 14v8M8 18h8M76 66v8M72 70h8" />
    </g>
  );
}

function CourseLines() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 88 88" fill="none">
      <path
        d="M16 18h56v52H16zM24 27h40M24 35h24M24 43h40M24 51h18"
        stroke="var(--color-construction-muted)"
        strokeWidth="1"
      />
      <path
        d="M56 35v24M48 59h16M52 55l8-8 4 4"
        stroke="var(--color-clay)"
        strokeWidth="1"
      />
      <FrameTicks />
    </svg>
  );
}

function ProductLines() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 88 88" fill="none">
      <rect
        x="22"
        y="18"
        width="44"
        height="52"
        stroke="var(--color-construction-muted)"
        strokeWidth="1"
      />
      <path
        d="M30 30h28M30 40h20M30 50h24"
        stroke="var(--color-construction-muted)"
        strokeWidth="0.85"
      />
      <circle
        cx="56"
        cy="56"
        r="8"
        stroke="var(--color-clay)"
        strokeWidth="1"
      />
      <FrameTicks />
    </svg>
  );
}

function ResearchLines() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 88 88" fill="none">
      <path
        d="M24 16h40v56H24z"
        stroke="var(--color-construction-muted)"
        strokeWidth="1"
      />
      <path
        d="M32 28h24M32 36h18M32 44h22M32 52h14"
        stroke="var(--color-construction-muted)"
        strokeWidth="0.85"
      />
      <path
        d="M28 64h32"
        stroke="var(--color-clay)"
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      <FrameTicks />
    </svg>
  );
}

function ServiceLines() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 88 88" fill="none">
      <path
        d="M18 58 L44 22 L70 58 Z"
        stroke="var(--color-construction-muted)"
        strokeWidth="1"
      />
      <path
        d="M32 58 V46 H56 V58"
        stroke="var(--color-construction-muted)"
        strokeWidth="0.85"
      />
      <circle
        cx="44"
        cy="38"
        r="4"
        stroke="var(--color-clay)"
        strokeWidth="1"
      />
      <FrameTicks />
    </svg>
  );
}

function PlanLines() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 88 88" fill="none">
      <rect
        x="16"
        y="16"
        width="56"
        height="56"
        stroke="var(--color-construction-muted)"
        strokeWidth="1"
      />
      <path
        d="M16 40 H44 V16 M44 72 V48 H72"
        stroke="var(--color-construction-muted)"
        strokeWidth="0.85"
      />
      <path
        d="M28 52h16v12H28z"
        stroke="var(--color-clay)"
        strokeWidth="1"
      />
      <path
        d="M16 72 H72"
        stroke="var(--color-construction)"
        strokeWidth="0.5"
        strokeDasharray="4 3"
        opacity="0.5"
      />
      <FrameTicks />
    </svg>
  );
}

function PortraitLines() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 300 400"
      fill="none"
    >
      <rect
        x="24"
        y="24"
        width="252"
        height="352"
        stroke="var(--color-construction)"
        strokeWidth="0.75"
        opacity="0.5"
      />
      <ellipse
        cx="150"
        cy="128"
        rx="42"
        ry="50"
        stroke="var(--color-construction)"
        strokeWidth="1"
        opacity="0.7"
      />
      <path
        d="M78 320 C78 240 110 200 150 198 C190 200 222 240 222 320"
        stroke="var(--color-construction)"
        strokeWidth="1"
        opacity="0.65"
      />
      <path
        d="M150 198 L150 300"
        stroke="var(--color-construction)"
        strokeWidth="0.5"
        strokeDasharray="3 3"
        opacity="0.4"
      />
    </svg>
  );
}
