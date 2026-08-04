"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMouseParallax } from "@/hooks/useMouseParallax";

interface HeroConstructionProps {
  className?: string;
}

export function HeroConstruction({ className = "" }: HeroConstructionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const parallaxRef = useMouseParallax(0.02);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    registerGsap();
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const paths = svg.querySelectorAll<SVGPathElement | SVGCircleElement>(".hc-draw");
    paths.forEach((path, i) => {
      if (path instanceof SVGPathElement) {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 1.8,
          delay: 0.2 + i * 0.12,
          ease: "power2.inOut",
        });
      }
    });

    const compass = svg.querySelector(".hc-compass");
    if (compass) {
      gsap.to(compass, {
        rotation: 360,
        transformOrigin: "50% 50%",
        duration: 48,
        repeat: -1,
        ease: "none",
      });
    }

    gsap.to(svg, {
      y: 40,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "bottom top",
        scrub: 1.5,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === container) st.kill();
      });
      gsap.killTweensOf(svg);
      if (compass) gsap.killTweensOf(compass);
    };
  }, [reduced]);

  const setRefs = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    (parallaxRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  if (reduced) return null;

  return (
    <div
      ref={setRefs}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        className="absolute right-0 top-16 w-[55%] max-w-xl h-auto opacity-50 hidden md:block will-change-transform"
        viewBox="0 0 480 360"
        fill="none"
      >
        {/* Construction lines */}
        <path className="hc-draw" d="M40 40 H440 V320 H40 Z" stroke="var(--color-construction)" strokeWidth="0.75" />
        <path className="hc-draw" d="M40 180 H240 V40 H440" stroke="var(--color-construction)" strokeWidth="0.6" />
        <path className="hc-draw" d="M240 40 V320" stroke="var(--color-construction)" strokeWidth="0.5" strokeDasharray="6 4" />
        {/* Measurement arrow */}
        <path className="hc-draw" d="M60 340 H200" stroke="#8b5a4a" strokeWidth="0.6" />
        <path className="hc-draw" d="M60 336 L60 344 M200 336 L200 344" stroke="#8b5a4a" strokeWidth="0.6" />
        <path className="hc-draw" d="M125 332 V348" stroke="#8b5a4a" strokeWidth="0.4" />
        {/* Compass / protractor */}
        <g className="hc-compass" style={{ transformOrigin: "360px 100px" }}>
          <circle cx="360" cy="100" r="36" stroke="#8b5a4a" strokeWidth="0.6" />
          <circle cx="360" cy="100" r="28" stroke="var(--color-construction)" strokeWidth="0.4" strokeDasharray="2 4" />
          <path d="M360 64 V136 M324 100 H396" stroke="#8b5a4a" strokeWidth="0.5" />
          <path d="M360 72 L352 100 L360 128 L368 100 Z" fill="#8b5a4a" opacity="0.35" />
        </g>
        <text x="125" y="358" fill="#8b5a4a" fontSize="8" fontFamily="sans-serif" opacity="0.5" letterSpacing="0.12em">
          14.000
        </text>
      </svg>
    </div>
  );
}
