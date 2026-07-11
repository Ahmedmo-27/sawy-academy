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
  const hatchCount = 9;
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`relative w-full ${className}`}
      aria-hidden="true"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      <div className="flex items-center w-full h-6">
        <motion.div
          className="flex-1 h-px bg-hairline origin-left"
          variants={{
            hidden: { scaleX: 0 },
            visible: { scaleX: 1 },
          }}
          transition={{ duration: 0.8, ease: easeOut }}
        />
        <div className="flex items-end gap-[6px] mx-3 h-full pb-0">
          {Array.from({ length: hatchCount }).map((_, i) => (
            <motion.span
              key={i}
              className="block w-px h-3 bg-charcoal/12 origin-bottom"
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
        {label && (
          <motion.span
            className="label-caps text-charcoal/25 mx-2 max-w-[42vw] truncate sm:max-w-none sm:whitespace-nowrap"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
            transition={{ duration: 0.6, ease: easeOut, delay: 0.5 }}
          >
            {label}
          </motion.span>
        )}
        <div className="flex items-end gap-[6px] mx-3 h-full pb-0">
          {Array.from({ length: hatchCount }).map((_, i) => (
            <motion.span
              key={i}
              className="block w-px h-3 bg-charcoal/12 origin-bottom"
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
        <motion.div
          className="flex-1 h-px bg-hairline origin-right"
          variants={{
            hidden: { scaleX: 0 },
            visible: { scaleX: 1 },
          }}
          transition={{ duration: 0.8, ease: easeOut, delay: 0.1 }}
        />
      </div>
      <motion.svg
        className="w-full h-3 mt-1 opacity-15"
        preserveAspectRatio="none"
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
            <line x1="0" y1="6" x2="20" y2="6" stroke="#d4d0c8" strokeWidth="0.35" />
            <line x1="10" y1="0" x2="10" y2="12" stroke="#d4d0c8" strokeWidth="0.35" />
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
