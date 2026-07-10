interface FloorPlanSketchProps {
  className?: string;
}

export function FloorPlanSketch({ className = "" }: FloorPlanSketchProps) {
  return (
    <svg
      className={`pointer-events-none absolute ${className}`}
      viewBox="0 0 420 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g
        stroke="var(--color-construction)"
        strokeWidth="0.5"
        opacity="0.35"
      >
        <rect x="40" y="30" width="280" height="200" />
        <line x1="180" y1="30" x2="180" y2="150" />
        <line x1="40" y1="150" x2="320" y2="150" />
        <line x1="250" y1="150" x2="250" y2="230" />
        <path d="M180 150 A 20 20 0 0 1 200 130" strokeDasharray="3 2" />
        <path d="M250 180 A 15 15 0 0 0 265 195" strokeDasharray="3 2" />
        <g stroke="var(--color-construction)" strokeWidth="0.35" opacity="0.3">
          <line x1="40" y1="250" x2="320" y2="250" />
          <line x1="40" y1="245" x2="40" y2="255" />
          <line x1="320" y1="245" x2="320" y2="255" />
          <line x1="350" y1="30" x2="350" y2="230" />
        </g>
        {[80, 120, 220, 290].map((x) => (
          <line key={x} x1={x} y1="30" x2={x} y2="34" opacity="0.2" />
        ))}
      </g>
    </svg>
  );
}
