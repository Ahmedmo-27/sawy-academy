"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  revealHero,
  revealStructural,
  revealInfill,
  revealGrid,
  revealTransition,
  viewportOnce,
  type RevealVariant,
} from "@/lib/motion";

const variants = {
  hero: revealHero,
  structural: revealStructural,
  infill: revealInfill,
  grid: revealGrid,
};

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  immediate?: boolean;
}

export function Reveal({
  children,
  className = "",
  variant = "structural",
  delay = 0,
  immediate = false,
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const transition = revealTransition(variant, delay / 1000);

  if (immediate) {
    return (
      <motion.div
        className={className}
        initial="hidden"
        animate="visible"
        variants={variants[variant]}
        transition={transition}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={variants[variant]}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
