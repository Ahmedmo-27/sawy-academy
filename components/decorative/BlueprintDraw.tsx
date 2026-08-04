"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easeOut } from "@/lib/motion";

interface BlueprintDrawProps {
  className?: string;
}

export function BlueprintDraw({ className = "" }: BlueprintDrawProps) {
  const prefersReducedMotion = useReducedMotion();

  const drawTransition = (delay = 0) => ({
    duration: prefersReducedMotion ? 0 : 2,
    ease: "easeInOut" as const,
    delay: prefersReducedMotion ? 0 : delay,
  });

  return (
    <motion.svg
      className={`pointer-events-none absolute ${className}`}
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      initial="hidden"
      animate="visible"
    >
      <motion.path
        d="M40 40 H280 V200 H40 Z"
        stroke="var(--color-construction)"
        strokeWidth="0.75"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 0.45 },
        }}
        transition={drawTransition(0)}
      />
      <motion.path
        d="M40 120 H160 V40 H280 V200 H40"
        stroke="var(--color-construction)"
        strokeWidth="0.6"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 0.35 },
        }}
        transition={drawTransition(0.4)}
      />
      <motion.path
        d="M160 40 V200"
        stroke="var(--color-construction)"
        strokeWidth="0.5"
        strokeDasharray="4 4"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 0.3 },
        }}
        transition={drawTransition(0.8)}
      />
      <motion.path
        d="M40 220 H120"
        stroke="#8b5a4a"
        strokeWidth="0.5"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 0.4 },
        }}
        transition={drawTransition(1.2)}
      />
      <motion.path
        d="M200 80 L212 104 L236 104 L218 118 L224 142 L200 130 L176 142 L182 118 L164 104 L188 104 Z"
        stroke="var(--color-construction)"
        strokeWidth="0.5"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 0.35 },
        }}
        transition={drawTransition(1.5)}
      />
      <motion.text
        x="200"
        y="228"
        fill="#8b5a4a"
        fontSize="7"
        fontFamily="sans-serif"
        textAnchor="middle"
        letterSpacing="0.14em"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 0.6, delay: prefersReducedMotion ? 0 : 1.8, ease: easeOut }}
      >
        BLUEPRINT — ELEVATION
      </motion.text>
    </motion.svg>
  );
}
