"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easeOut } from "@/lib/motion";

interface CourseProgressTrackProps {
  completed: number;
  total: number;
  className?: string;
}

export function CourseProgressTrack({
  completed,
  total,
  className = "",
}: CourseProgressTrackProps) {
  const prefersReducedMotion = useReducedMotion();
  const ratio = total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <p className="type-infill">
          {completed} of {total} lessons complete
        </p>
        <p className="label-caps tabular-nums text-charcoal-infill">
          {percent}%
        </p>
      </div>
      <div
        className="relative h-[2px] w-full overflow-hidden bg-hairline"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Course progress"
      >
        <motion.div
          className="absolute inset-y-0 left-0 w-full origin-left bg-clay/55"
          initial={{ scaleX: prefersReducedMotion ? ratio : 0 }}
          whileInView={{ scaleX: ratio }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 1.1, ease: easeOut }}
        />
      </div>
    </div>
  );
}
