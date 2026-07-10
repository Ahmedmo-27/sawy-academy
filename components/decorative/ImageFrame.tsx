"use client";

import { motion } from "framer-motion";
import { hoverTransition } from "@/lib/motion";

interface ImageFrameProps {
  children: React.ReactNode;
  className?: string;
}

const bracketTransition = hoverTransition;

export function ImageFrame({ children, className = "" }: ImageFrameProps) {
  return (
    <motion.div
      className={`relative group w-full ${className}`}
      initial="rest"
      whileHover="hover"
    >
      <motion.div
        className="absolute inset-0 overflow-hidden"
        variants={{
          rest: { scale: 1 },
          hover: { scale: 1.03 },
        }}
        transition={bracketTransition}
      >
        {children}
      </motion.div>

      <motion.span
        className="absolute border-t border-l border-charcoal/70 pointer-events-none z-10"
        variants={{
          rest: { top: 12, left: 12, width: 20, height: 20 },
          hover: { top: 8, left: 8, width: 24, height: 24 },
        }}
        transition={bracketTransition}
        aria-hidden="true"
      />
      <motion.span
        className="absolute border-t border-r border-charcoal/70 pointer-events-none z-10"
        variants={{
          rest: { top: 12, right: 12, width: 20, height: 20 },
          hover: { top: 8, right: 8, width: 24, height: 24 },
        }}
        transition={bracketTransition}
        aria-hidden="true"
      />
      <motion.span
        className="absolute border-b border-l border-charcoal/70 pointer-events-none z-10"
        variants={{
          rest: { bottom: 12, left: 12, width: 20, height: 20 },
          hover: { bottom: 8, left: 8, width: 24, height: 24 },
        }}
        transition={bracketTransition}
        aria-hidden="true"
      />
      <motion.span
        className="absolute border-b border-r border-charcoal/70 pointer-events-none z-10"
        variants={{
          rest: { bottom: 12, right: 12, width: 20, height: 20 },
          hover: { bottom: 8, right: 8, width: 24, height: 24 },
        }}
        transition={bracketTransition}
        aria-hidden="true"
      />
      <span
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-2 bg-charcoal/30 pointer-events-none z-10"
        aria-hidden="true"
      />
      <span
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-2 bg-charcoal/30 pointer-events-none z-10"
        aria-hidden="true"
      />
      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 h-px w-2 bg-charcoal/30 pointer-events-none z-10"
        aria-hidden="true"
      />
      <span
        className="absolute right-0 top-1/2 -translate-y-1/2 h-px w-2 bg-charcoal/30 pointer-events-none z-10"
        aria-hidden="true"
      />
    </motion.div>
  );
}
