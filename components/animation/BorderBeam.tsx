"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { motion } from "framer-motion";

interface BorderBeamProps {
  className?: string;
  size?: number; // length of beam relative to perimeter percentage (default 25%)
  duration?: number; // duration of complete loop in seconds
  borderWidth?: number; // 1px default
  colorFrom?: string; // default warm clay #8B5A4A
  colorTo?: string; // brighter highlight #D4AF37 or #B47360
  reverse?: boolean;
}

export function BorderBeam({
  className = "",
  size = 20,
  duration = 8,
  borderWidth = 1.5,
  colorFrom = "#8B5A4A",
  colorTo = "#D89982",
  reverse = false,
}: BorderBeamProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return null;
  }

  const gradientId = `border-beam-grad-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorFrom} stopOpacity="0.1" />
            <stop offset="50%" stopColor={colorTo} stopOpacity="1" />
            <stop offset="100%" stopColor={colorFrom} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <motion.rect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width={`calc(100% - ${borderWidth}px)`}
          height={`calc(100% - ${borderWidth}px)`}
          rx={0}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={borderWidth}
          pathLength={100}
          strokeDasharray={`${size} ${100 - size}`}
          initial={{ strokeDashoffset: reverse ? -100 : 0 }}
          animate={{ strokeDashoffset: reverse ? 0 : -100 }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration,
          }}
        />
      </svg>
    </div>
  );
}
