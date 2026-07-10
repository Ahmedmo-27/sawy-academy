"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

interface GeometricLatticeProps {
  className?: string;
  opacity?: number;
}

export function GeometricLattice({
  className = "",
  opacity = 0.045,
}: GeometricLatticeProps) {
  const patternId = `girih-lattice-${useId().replace(/:/g, "")}`;
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      animate={
        prefersReducedMotion
          ? undefined
          : { rotate: [0, 360], x: [0, 12, 0] }
      }
      transition={{
        rotate: { duration: 80, repeat: Infinity, ease: "linear" },
        x: { duration: 45, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <svg
        className="h-full w-full"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={patternId}
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <g
              fill="none"
              stroke="var(--color-construction-muted)"
              strokeWidth="0.4"
              opacity={opacity * 2.5}
            >
              <polygon points="40,4 46,18 60,18 49,28 53,42 40,34 27,42 31,28 20,18 34,18" />
              <polygon points="40,76 46,62 60,62 49,52 53,38 40,46 27,38 31,52 20,62 34,62" />
              <polygon points="4,40 18,34 18,20 28,31 42,27 34,40 42,53 28,49 18,60 18,46" />
              <polygon points="76,40 62,46 62,60 52,49 38,53 46,40 38,27 52,31 62,20 62,34" />
              <rect x="28" y="28" width="24" height="24" />
              <line x1="0" y1="40" x2="80" y2="40" />
              <line x1="40" y1="0" x2="40" y2="80" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </motion.div>
  );
}
