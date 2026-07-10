/**
 * Line-art portrait silhouette — used when no photographic portrait
 * exists under public/images/. Drawn in the same construction-line
 * language as FloorPlanSketch / HeroConstruction.
 */
interface PortraitSilhouetteProps {
  className?: string;
}

export function PortraitSilhouette({ className = "" }: PortraitSilhouetteProps) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      viewBox="0 0 300 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Line-art portrait of Prof. Mohamed El Sawy"
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
      <line
        x1="24"
        y1="360"
        x2="276"
        y2="360"
        stroke="var(--color-construction)"
        strokeWidth="0.4"
        strokeDasharray="4 3"
        opacity="0.35"
      />
      {/* Head */}
      <ellipse
        cx="150"
        cy="128"
        rx="42"
        ry="50"
        stroke="var(--color-construction)"
        strokeWidth="1"
        opacity="0.7"
      />
      {/* Neck */}
      <path
        d="M132 172 Q150 188 168 172"
        stroke="var(--color-construction)"
        strokeWidth="0.85"
        opacity="0.55"
      />
      {/* Shoulders / torso */}
      <path
        d="M78 320 C78 240 110 200 150 198 C190 200 222 240 222 320"
        stroke="var(--color-construction)"
        strokeWidth="1"
        opacity="0.65"
      />
      {/* Lapel suggestion */}
      <path
        d="M150 198 L150 300"
        stroke="var(--color-construction)"
        strokeWidth="0.5"
        strokeDasharray="3 3"
        opacity="0.4"
      />
      <path
        d="M150 220 L118 300 M150 220 L182 300"
        stroke="var(--color-construction)"
        strokeWidth="0.45"
        opacity="0.35"
      />
      {/* Dimension ticks */}
      <g
        stroke="var(--color-construction)"
        strokeWidth="0.35"
        opacity="0.3"
      >
        <line x1="40" y1="78" x2="48" y2="78" />
        <line x1="40" y1="178" x2="48" y2="178" />
        <line x1="36" y1="78" x2="36" y2="178" />
      </g>
      <text
        x="52"
        y="132"
        className="label-caps"
        fill="var(--color-clay)"
        fontSize="7"
        letterSpacing="1.5"
        opacity="0.7"
      >
        1:20
      </text>
    </svg>
  );
}
