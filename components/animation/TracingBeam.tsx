"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface TracingBeamProps {
  children: React.ReactNode;
  className?: string;
}

export function TracingBeam({ children, className = "" }: TracingBeamProps) {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [svgHeight, setSvgHeight] = useState(0);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 400,
    damping: 90,
  });

  const y1 = useTransform(smoothProgress, [0, 1], [40, svgHeight]);
  const y2 = useTransform(smoothProgress, [0, 1], [0, svgHeight - 40]);

  useEffect(() => {
    if (contentRef.current) {
      setSvgHeight(contentRef.current.offsetHeight);
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSvgHeight(entry.contentRect.height);
      }
    });

    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={`relative w-full max-w-full ${className}`}>
      {/* Fixed architectural datum guide on the left */}
      <div className="absolute -left-4 sm:-left-8 top-3 hidden md:block">
        <motion.div
          transition={{ duration: 0.2, delay: 0.5 }}
          className="ml-[19px] h-3 w-3 rounded-none border border-clay bg-concrete p-0.5"
        >
          <div className="h-full w-full bg-clay" />
        </motion.div>
        <svg
          viewBox={`0 0 20 ${svgHeight}`}
          width="20"
          height={svgHeight}
          className="ml-4 block"
          aria-hidden="true"
        >
          {/* Static reference hairline */}
          <line
            x1="10"
            y1="0"
            x2="10"
            y2={svgHeight}
            stroke="var(--color-hairline, #D4D0C8)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {/* Animated tracing laser beam */}
          <motion.line
            x1="10"
            y1="0"
            x2="10"
            y2={y1}
            stroke="var(--color-clay, #8B5A4A)"
            strokeWidth="2"
            strokeLinecap="square"
          />
          <defs>
            <motion.linearGradient
              id="tracing-grad"
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1={y2}
              y2={y1}
            >
              <stop stopColor="var(--color-clay, #8B5A4A)" stopOpacity="0" />
              <stop stopColor="var(--color-clay, #8B5A4A)" />
              <stop offset="0.325" stopColor="#D89982" />
              <stop offset="1" stopColor="#8B5A4A" stopOpacity="0" />
            </motion.linearGradient>
          </defs>
        </svg>
      </div>

      <div ref={contentRef} className="w-full">
        {children}
      </div>
    </div>
  );
}
