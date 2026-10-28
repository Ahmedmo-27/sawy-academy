"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easeOut } from "@/lib/motion";

interface LevelProgressLineProps {
  progress?: number;
  className?: string;
}

export function LevelProgressLine({
  progress = 1,
  className = "",
}: LevelProgressLineProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`relative py-1 w-full max-w-[140px] select-none ${className}`}
      aria-hidden="true"
    >
      {/* Dimension ticks */}
      <div className="flex justify-between items-center mb-0.5 px-0.5">
        <span className="font-mono text-[8px] text-charcoal/40 leading-none">0.0</span>
        <span className="font-mono text-[8px] text-clay/60 leading-none">50%</span>
        <span className="font-mono text-[8px] text-charcoal/40 leading-none">1.0</span>
      </div>

      <div className="relative h-1 w-full bg-hairline/60 border border-hairline/40 overflow-hidden">
        {/* Animated fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-clay origin-left"
          initial={{ scaleX: prefersReducedMotion ? progress : 0 }}
          whileInView={{ scaleX: progress }}
          viewport={{ once: true, margin: "-20px" }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 1.1, ease: easeOut }
          }
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}
