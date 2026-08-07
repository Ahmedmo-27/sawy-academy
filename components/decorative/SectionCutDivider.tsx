"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { easeOut, viewportOnce } from "@/lib/motion";

interface SectionCutDividerProps {
  className?: string;
  label?: string;
}

export function SectionCutDivider({
  className = "",
  label,
}: SectionCutDividerProps) {
  const patternId = `section-lattice-${useId().replace(/:/g, "")}`;
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`relative w-full ${className}`}
      aria-hidden="true"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      {/* Centered label with equal flex rails on both sides */}
      <div className="relative flex w-full items-center justify-center">
        <motion.div
          className="h-px min-w-0 flex-1 origin-left bg-hairline"
          variants={{
            hidden: { scaleX: 0 },
            visible: { scaleX: 1 },
          }}
          transition={{ duration: 0.8, ease: easeOut }}
        />

        <div className="mx-3 flex shrink-0 items-center sm:mx-4">
          <HatchMarks
            count={5}
            className="sm:hidden"
            prefersReducedMotion={!!prefersReducedMotion}
          />
          <HatchMarks
            count={9}
            className="hidden sm:flex"
            prefersReducedMotion={!!prefersReducedMotion}
          />

          {label ? (
            <motion.span
              className="label-caps mx-3 whitespace-nowrap text-charcoal/25 sm:mx-4"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 },
              }}
              transition={{ duration: 0.6, ease: easeOut, delay: 0.5 }}
            >
              {label}
            </motion.span>
          ) : null}

          <HatchMarks
            count={5}
            className="sm:hidden"
            prefersReducedMotion={!!prefersReducedMotion}
          />
          <HatchMarks
            count={9}
            className="hidden sm:flex"
            prefersReducedMotion={!!prefersReducedMotion}
          />
        </div>

        <motion.div
          className="h-px min-w-0 flex-1 origin-right bg-hairline"
          variants={{
            hidden: { scaleX: 0 },
            visible: { scaleX: 1 },
          }}
          transition={{ duration: 0.8, ease: easeOut, delay: 0.1 }}
        />
      </div>

      <motion.svg
        className="mx-auto mt-1 h-3 w-full max-w-full opacity-15"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 400 12"
        xmlns="http://www.w3.org/2000/svg"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 0.15 },
        }}
        transition={{ duration: 0.8, ease: easeOut, delay: 0.6 }}
      >
        <defs>
          <pattern
            id={patternId}
            width="20"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="6"
              x2="20"
              y2="6"
              stroke="#d4d0c8"
              strokeWidth="0.35"
            />
            <line
              x1="10"
              y1="0"
              x2="10"
              y2="12"
              stroke="#d4d0c8"
              strokeWidth="0.35"
            />
            <polygon
              points="10,2 12,6 10,10 8,6"
              fill="none"
              stroke="#d4d0c8"
              strokeWidth="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="12" fill={`url(#${patternId})`} />
      </motion.svg>
    </motion.div>
  );
}

function HatchMarks({
  count,
  className = "",
  prefersReducedMotion,
}: {
  count: number;
  className?: string;
  prefersReducedMotion: boolean;
}) {
  return (
    <div className={`flex h-6 items-end gap-[5px] sm:gap-[6px] ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="block h-3 w-px origin-bottom bg-charcoal/12"
          variants={{
            hidden: { scaleY: 0, opacity: 0 },
            visible: { scaleY: 1, opacity: 1 },
          }}
          transition={{
            duration: 0.5,
            ease: easeOut,
            delay: prefersReducedMotion ? 0 : 0.3 + i * 0.04,
          }}
        />
      ))}
    </div>
  );
}
