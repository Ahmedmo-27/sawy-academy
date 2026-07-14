"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMouseParallax } from "@/hooks/useMouseParallax";

const SHAPES = [
  { type: "rect", x: "8%", y: "18%", w: 48, h: 48, rotate: 12 },
  { type: "circle", cx: "88%", cy: "28%", r: 28 },
  { type: "rect", x: "78%", y: "62%", w: 64, h: 32, rotate: -8 },
  { type: "line", x1: "12%", y1: "72%", x2: "22%", y2: "82%" },
  { type: "cube", x: "42%", y: "78%" },
  { type: "circle", cx: "6%", cy: "48%", r: 18 },
] as const;

function WireCube({ x, y }: { x: string; y: string }) {
  return (
    <g transform={`translate(${x}, ${y})`} opacity="0.35">
      <path
        d="M0 20 L16 10 L32 20 L16 30 Z M0 20 L0 40 L16 50 L16 30 M16 30 L16 50 L32 40 L32 20"
        fill="none"
        stroke="var(--color-clay)"
        strokeWidth="0.6"
      />
    </g>
  );
}

export function FloatingGeometryLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useMouseParallax(0.015);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    registerGsap();
    const el = layerRef.current;
    if (!el) return;

    const tween = gsap.to(el, {
      y: -80,
      rotation: 2,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.8,
      },
    });

    gsap.to(el, {
      rotation: -2,
      duration: 24,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.killTweensOf(el);
    };
  }, [reduced]);

  const setRefs = (node: HTMLDivElement | null) => {
    layerRef.current = node;
    (parallaxRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  if (reduced) return null;

  return (
    <div
      ref={setRefs}
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden will-change-transform"
      aria-hidden="true"
    >
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        {SHAPES.map((shape, i) => {
          if (shape.type === "rect") {
            return (
              <rect
                key={i}
                x={shape.x}
                y={shape.y}
                width={shape.w}
                height={shape.h}
                fill="none"
                stroke="var(--color-clay)"
                strokeWidth="0.5"
                opacity="0.25"
              />
            );
          }
          if (shape.type === "circle") {
            return (
              <circle
                key={i}
                cx={shape.cx}
                cy={shape.cy}
                r={shape.r}
                fill="none"
                stroke="var(--color-clay)"
                strokeWidth="0.5"
                opacity="0.2"
              />
            );
          }
          if (shape.type === "line") {
            return (
              <g key={i} opacity="0.3">
                <line
                  x1={shape.x1}
                  y1={shape.y1}
                  x2={shape.x2}
                  y2={shape.y2}
                  stroke="var(--color-clay)"
                  strokeWidth="0.5"
                />
                <circle cx={shape.x1} cy={shape.y1} r="2" fill="var(--color-clay)" opacity="0.4" />
                <circle cx={shape.x2} cy={shape.y2} r="2" fill="var(--color-clay)" opacity="0.4" />
              </g>
            );
          }
          return <WireCube key={i} x={shape.x} y={shape.y} />;
        })}
      </svg>
    </div>
  );
}
