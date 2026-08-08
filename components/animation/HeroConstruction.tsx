"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMouseParallax } from "@/hooks/useMouseParallax";

interface HeroConstructionProps {
  className?: string;
  variant?: "ambient" | "feature";
}

export function HeroConstruction({
  className = "",
  variant = "ambient",
}: HeroConstructionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const parallaxRef = useMouseParallax(variant === "feature" ? 0.035 : 0.024);
  const reduced = useReducedMotion();

  useEffect(() => {
    registerGsap();
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const paths = Array.from(
      svg.querySelectorAll<SVGPathElement>(".hc-draw")
    );
    const compass = svg.querySelector(".hc-compass");

    if (reduced) {
      gsap.set(paths, { strokeDasharray: "none", strokeDashoffset: 0 });
      gsap.set(svg, { clearProps: "transform" });
      if (compass) gsap.set(compass, { clearProps: "transform" });
      container.dataset.drawState = "static";
      return () => {
        delete container.dataset.drawState;
      };
    }

    paths.forEach((path) => {
      const len = path.getTotalLength();
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    });

    container.dataset.drawState = "drawing";
    const timeline = gsap.timeline({
      onComplete: () => {
        container.dataset.drawState = "complete";
      },
    });
    timeline
      .fromTo(
        svg,
        { scale: variant === "feature" ? 0.975 : 0.99 },
        {
          scale: 1,
          duration: 2.1,
          transformOrigin: "50% 50%",
          ease: "power2.out",
        },
        0
      )
      .to(
        paths,
        {
          strokeDashoffset: 0,
          duration: 1.45,
          stagger: { amount: 0.65 },
          ease: "power2.inOut",
        },
        0.12
      )
      .set(
        paths,
        { clearProps: "strokeDasharray,strokeDashoffset" },
        ">+0.18"
      );

    if (compass) {
      gsap.to(compass, {
        rotation: 360,
        svgOrigin: "360 100",
        duration: 48,
        repeat: -1,
        ease: "none",
      });
    }

    gsap.to(svg, {
      y: variant === "feature" ? 28 : 40,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "bottom top",
        scrub: 1.5,
      },
    });

    return () => {
      delete container.dataset.drawState;
      timeline.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === container) st.kill();
      });
      gsap.killTweensOf(svg);
      if (compass) gsap.killTweensOf(compass);
    };
  }, [reduced, variant]);

  const setRefs = (node: HTMLDivElement | null) => {
    (parallaxRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none overflow-hidden ${
        variant === "feature"
          ? "relative h-full min-h-[18rem] w-full"
          : "absolute inset-0"
      } ${className}`}
      aria-hidden="true"
    >
      {variant === "feature" && (
        <>
          <span className="label-caps absolute left-4 top-4 z-10 text-clay sm:left-6 sm:top-6">
            Studio drawing / 01
          </span>
          <span className="dim-label absolute bottom-4 right-4 z-10 sm:bottom-6 sm:right-6">
            Scale 1:200
          </span>
        </>
      )}
      <div ref={setRefs} className="absolute inset-0 will-change-transform">
        <svg
          ref={svgRef}
          className={
            variant === "feature"
              ? "absolute inset-0 h-full w-full p-5 opacity-90 will-change-transform sm:p-8"
              : "absolute right-[-8%] top-10 h-auto w-[85%] max-w-sm opacity-35 will-change-transform sm:right-0 sm:top-16 sm:w-[55%] sm:max-w-xl sm:opacity-50"
          }
          viewBox="0 0 480 360"
          fill="none"
        >
          {/* Construction lines */}
          <path className="hc-draw" d="M40 40 H440 V320 H40 Z" stroke="var(--color-construction)" strokeWidth="0.75" />
          <path className="hc-draw" d="M40 180 H240 V40 H440" stroke="var(--color-construction)" strokeWidth="0.6" />
          <path className="hc-draw" d="M240 40 V320" stroke="var(--color-construction)" strokeWidth="0.5" />
          <path className="hc-draw" d="M72 72 H208 V148 H72 Z M272 180 H408 V288 H272 Z" stroke="var(--color-clay)" strokeWidth="0.65" opacity="0.75" />
          <path className="hc-draw" d="M72 148 L140 72 L208 148 M272 288 L340 180 L408 288" stroke="var(--color-construction-muted)" strokeWidth="0.45" />
          <path className="hc-draw" d="M40 180 L240 320 M240 180 L40 320" stroke="var(--color-construction)" strokeWidth="0.4" />
          {/* Measurement arrow */}
          <path className="hc-draw" d="M60 340 H200" stroke="var(--color-clay)" strokeWidth="0.6" />
          <path className="hc-draw" d="M60 336 L60 344 M200 336 L200 344" stroke="var(--color-clay)" strokeWidth="0.6" />
          <path className="hc-draw" d="M125 332 V348" stroke="var(--color-clay)" strokeWidth="0.4" />
          {/* Compass / protractor */}
          <g className="hc-compass">
            <circle cx="360" cy="100" r="36" stroke="var(--color-clay)" strokeWidth="0.6" />
            <circle cx="360" cy="100" r="28" stroke="var(--color-construction)" strokeWidth="0.4" strokeDasharray="2 4" />
            <path d="M360 64 V136 M324 100 H396" stroke="var(--color-clay)" strokeWidth="0.5" />
            <path d="M360 72 L352 100 L360 128 L368 100 Z" fill="var(--color-clay)" opacity="0.35" />
          </g>
          <text x="125" y="358" fill="var(--color-clay)" fontSize="8" fontFamily="sans-serif" opacity="0.5" letterSpacing="0.12em">
            14.000
          </text>
        </svg>
      </div>
    </div>
  );
}
