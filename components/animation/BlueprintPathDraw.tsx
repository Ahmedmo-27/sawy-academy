"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface BlueprintPathDrawProps {
  className?: string;
  variant?: "section" | "compact";
}

/** Horizontal cut mark — decorations stay centered at every viewport width. */
export function BlueprintPathDraw({
  className = "",
  variant = "section",
}: BlueprintPathDrawProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    registerGsap();
    const svg = svgRef.current;
    if (!svg) return;

    const paths = svg.querySelectorAll<SVGPathElement>(".bp-draw");
    paths.forEach((path, i) => {
      const len = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: len,
        strokeDashoffset: len,
        opacity: variant === "compact" ? 0.35 : 0.5,
      });

      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 1.2,
        delay: i * 0.15,
        ease: "power1.inOut",
        scrollTrigger: {
          trigger: svg,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === svg) st.kill();
      });
    };
  }, [reduced, variant]);

  if (reduced) {
    return (
      <div className={`h-px w-full bg-hairline ${className}`} aria-hidden="true" />
    );
  }

  return (
    <svg
      ref={svgRef}
      className={`mx-auto h-8 w-full max-w-full ${className}`}
      viewBox="0 0 400 32"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* Baseline */}
      <path
        className="bp-draw"
        d="M20 16 H380"
        stroke="#d4d0c8"
        strokeWidth="0.75"
      />
      {/* Symmetric end ticks */}
      <path
        className="bp-draw"
        d="M40 8 V24 M360 8 V24"
        stroke="#8b5a4a"
        strokeWidth="0.5"
        opacity="0.6"
      />
      {variant === "section" && (
        <>
          {/* Center diamond */}
          <path
            className="bp-draw"
            d="M185 16 L200 8 L215 16 L200 24 Z"
            stroke="var(--color-construction)"
            strokeWidth="0.5"
          />
          {/* Mirrored dashed segments */}
          <path
            className="bp-draw"
            d="M55 16 H95"
            stroke="var(--color-construction)"
            strokeWidth="0.5"
            strokeDasharray="3 3"
          />
          <path
            className="bp-draw"
            d="M305 16 H345"
            stroke="var(--color-construction)"
            strokeWidth="0.5"
            strokeDasharray="3 3"
          />
        </>
      )}
    </svg>
  );
}
