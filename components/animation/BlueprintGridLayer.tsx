"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function BlueprintGridLayer() {
  const gridRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    registerGsap();
    const el = gridRef.current;
    if (!el) return;

    const tween = gsap.to(el, {
      y: 120,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <div
      ref={gridRef}
      className="pointer-events-none fixed inset-0 z-0 will-change-transform"
      aria-hidden="true"
      style={{
        opacity: 0.045,
        backgroundImage: `
          linear-gradient(to right, var(--color-clay) 1px, transparent 1px),
          linear-gradient(to bottom, var(--color-clay) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        maskImage: "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
      }}
    />
  );
}
