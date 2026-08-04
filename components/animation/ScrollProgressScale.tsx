"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const TICKS = 20;

export function ScrollProgressScale() {
  const fillRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    registerGsap();
    const fill = fillRef.current;
    const marker = markerRef.current;
    if (!fill || !marker) return;

    const tween = gsap.to(fill, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
      },
    });

    const markerTween = gsap.to(marker, {
      top: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      markerTween.scrollTrigger?.kill();
      markerTween.kill();
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      className="pointer-events-none fixed left-3 top-24 bottom-8 z-40 hidden lg:flex flex-col items-center w-6"
      aria-hidden="true"
    >
      <span className="label-caps text-charcoal/30 text-[0.5rem] mb-2 -rotate-90 origin-center whitespace-nowrap">
        0m
      </span>
      <div className="relative flex-1 w-px bg-hairline/80">
        {Array.from({ length: TICKS }).map((_, i) => (
          <span
            key={i}
            className="absolute left-0 h-px bg-charcoal/20"
            style={{
              top: `${(i / (TICKS - 1)) * 100}%`,
              width: i % 5 === 0 ? "10px" : "5px",
            }}
          />
        ))}
        <div
          ref={fillRef}
          className="absolute top-0 left-0 w-full bg-clay/50 origin-top"
          style={{ height: "100%", transform: "scaleY(0)" }}
        />
        <div
          ref={markerRef}
          className="absolute left-1/2 -translate-x-1/2 w-2 h-2 border border-clay bg-concrete"
          style={{ top: "0%" }}
        />
      </div>
      <span className="label-caps text-charcoal/30 text-[0.5rem] mt-2 -rotate-90 origin-center whitespace-nowrap">
        scale
      </span>
    </div>
  );
}
