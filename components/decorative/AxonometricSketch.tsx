interface AxonometricSketchProps {
  className?: string;
}

export function AxonometricSketch({ className = "" }: AxonometricSketchProps) {
  return (
    <svg
      className={`pointer-events-none absolute ${className}`}
      viewBox="0 0 300 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g
        stroke="var(--color-construction)"
        strokeWidth="0.5"
        opacity="0.35"
      >
        <path d="M60 180 L150 130 L240 180 L240 100 L150 50 L60 100 Z" />
        <path d="M60 100 L150 50 L240 100" />
        <path d="M60 100 L60 180" />
        <path d="M150 50 L150 130" strokeDasharray="4 3" />
        <path d="M240 100 L240 180" />
        <path d="M150 130 L200 105 L200 155 L150 180 Z" opacity="0.5" />
        <line x1="20" y1="200" x2="280" y2="200" strokeDasharray="2 4" opacity="0.25" />
      </g>
    </svg>
  );
}
