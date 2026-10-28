"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface BlurTextRevealProps {
  text: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
}

export function BlurTextReveal({
  text,
  delay = 0.05,
  duration = 0.55,
  stagger = 0.035,
  className = "",
  as: Component = "span",
}: BlurTextRevealProps) {
  const prefersReduced = useReducedMotion();
  const words = useMemo(() => text.split(" "), [text]);

  if (prefersReduced) {
    return <Component className={className}>{text}</Component>;
  }

  return (
    <Component className={`inline-block ${className}`}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="inline-block whitespace-nowrap mr-[0.25em]">
          <motion.span
            initial={{ opacity: 0, filter: "blur(8px)", y: 14 }}
            whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration,
              delay: delay + index * stagger,
              ease: [0.22, 1, 0.36, 1], // easeOut
            }}
            className="inline-block will-change-[transform,filter,opacity]"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Component>
  );
}
