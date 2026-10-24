"use client";

import React, { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ArchitecturalTilt3DProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  glare?: boolean;
}

export function ArchitecturalTilt3D({
  children,
  className = "",
  maxTilt = 8,
  scale = 1.018,
  glare = true,
}: ArchitecturalTilt3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    registerGsap();
    const container = containerRef.current;
    const card = cardRef.current;
    const glareEl = glareRef.current;
    if (!container || !card) return;

    gsap.set(container, { perspective: 1100 });
    gsap.set(card, { transformStyle: "preserve-3d", willChange: "transform" });

    const rotateXTo = gsap.quickTo(card, "rotateX", {
      duration: 0.45,
      ease: "power2.out",
    });
    const rotateYTo = gsap.quickTo(card, "rotateY", {
      duration: 0.45,
      ease: "power2.out",
    });
    const scaleTo = gsap.quickTo(card, "scale", {
      duration: 0.45,
      ease: "power2.out",
    });

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      // -0.5 to +0.5
      const nx = px - 0.5;
      const ny = py - 0.5;

      rotateXTo(-ny * maxTilt * 2);
      rotateYTo(nx * maxTilt * 2);
      scaleTo(scale);

      if (glareEl) {
        gsap.to(glareEl, {
          opacity: 0.22,
          x: (px - 0.5) * 80,
          y: (py - 0.5) * 80,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    const onPointerLeave = () => {
      rotateXTo(0);
      rotateYTo(0);
      scaleTo(1);

      if (glareEl) {
        gsap.to(glareEl, {
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    return () => {
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      gsap.killTweensOf(card);
      if (glareEl) gsap.killTweensOf(glareEl);
      gsap.set(card, { clearProps: "all" });
    };
  }, [reduced, maxTilt, scale, glare]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div ref={cardRef} className="h-full w-full">
        {children}
        {glare && !reduced && (
          <div
            ref={glareRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 rounded-[inherit] opacity-0 mix-blend-overlay transition-opacity duration-300"
            style={{
              background:
                "radial-gradient(circle 320px at 50% 50%, rgba(255, 255, 255, 0.85), transparent 75%)",
            }}
          />
        )}
      </div>
    </div>
  );
}
