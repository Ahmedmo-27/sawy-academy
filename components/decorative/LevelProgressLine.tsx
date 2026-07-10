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
    <div className={`relative h-px w-full max-w-[120px] bg-hairline overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-y-0 left-0 w-full bg-clay/50 origin-left"
        initial={{ scaleX: prefersReducedMotion ? 1 : 0 }}
        whileInView={{ scaleX: progress }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 1.2, ease: easeOut }}
      />
    </div>
  );
}
