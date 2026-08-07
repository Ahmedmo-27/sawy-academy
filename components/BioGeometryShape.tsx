"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, isReducedMotion } from "@/lib/gsap/config";

export type BioGeometryKind = "coil" | "spiral" | "c7" | "bg3";
export type BioGeometryVariant = "draw" | "rotate" | "pulse";

export interface BioGeometryShapeProps {
  /** Which BioGeometry motif to render (geometry is scaffolded for refinement). */
  kind?: BioGeometryKind;
  /** Extra motion after / alongside the scroll-draw. */
  variant?: BioGeometryVariant;
  /** Rendered width/height in px (square viewBox). */
  size?: number;
  /** SVG stroke; defaults to clay drafting tone. */
  stroke?: string;
  strokeWidth?: number;
  /** Overall opacity of the accent. */
  opacity?: number;
  className?: string;
  /**
   * Where along the page scroll the stroke finishes drawing (0–1).
   * e.g. 0.55 = fully drawn by ~55% of page height scrolled.
   */
  drawEnd?: number;
  /**
   * Vertical travel (px) scrubbed to page scroll — positive = drifts upward
   * as you scroll down. Set 0 to disable.
   */
  parallax?: number;
  /** Horizontal travel (px) scrubbed with scroll (can be negative). */
  parallaxX?: number;
  /** Subtle rotation (deg) scrubbed with scroll. */
  parallaxRotate?: number;
}

/**
 * Approximate BioGeometry drafting motifs — paths are placeholders for later
 * geometric refinement. Prefer CSS transforms + strokeDashoffset for cost.
 */
const PATHS: Record<BioGeometryKind, string> = {
  coil: [
    "M100 100",
    "m0-8 a8 8 0 1 1 0 16 a8 8 0 1 1 0-16",
    "m0-16 a16 16 0 1 1 0 32 a16 16 0 1 1 0-32",
    "m0-24 a24 24 0 1 1 0 48 a24 24 0 1 1 0-48",
    "m0-32 a32 32 0 1 1 0 64 a32 32 0 1 1 0-64",
    "m0-40 a40 40 0 1 1 0 80 a40 40 0 1 1 0-80",
  ].join(" "),
  spiral:
    "M100 100 C102 88 118 86 124 96 C132 110 114 122 100 118 C82 112 78 90 90 76 C106 56 138 60 148 82 C160 108 140 140 110 144 C72 150 48 118 56 84 C66 42 116 28 152 48 C188 68 204 122 176 158 C148 194 78 198 44 160",
  c7: "M20 110 C40 70 60 150 80 90 C100 30 120 170 140 100 C160 30 180 140 200 100",
  bg3: [
    "M100 28 C118 28 132 42 132 60 C132 78 118 92 100 92 C82 92 68 78 68 60 C68 42 82 28 100 28",
    "M100 72 C122 72 140 90 140 112 C140 134 122 152 100 152 C78 152 60 134 60 112 C60 90 78 72 100 72",
    "M100 128 C126 128 148 150 148 176 C148 202 126 224 100 224 C74 224 52 202 52 176 C52 150 74 128 100 128",
  ].join(" "),
};

const VIEWBOX: Record<BioGeometryKind, string> = {
  coil: "0 0 200 200",
  spiral: "0 0 200 200",
  c7: "0 0 220 200",
  bg3: "0 0 200 250",
};

export function BioGeometryShape({
  kind = "coil",
  variant = "draw",
  size = 220,
  stroke = "var(--color-clay)",
  strokeWidth = 1.35,
  opacity = 0.55,
  className = "",
  drawEnd = 0.55,
  parallax = 120,
  parallaxX = 0,
  parallaxRotate = 6,
}: BioGeometryShapeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      registerGsap();

      const root = rootRef.current;
      const path = pathRef.current;
      if (!root || !path) return;

      const length = path.getTotalLength();

      if (isReducedMotion()) {
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: 0,
          opacity: 1,
        });
        return;
      }

      const svg = root.querySelector("svg");
      const drawProgress = Math.min(Math.max(drawEnd, 0.15), 1);

      // Always draw the stroke as the page scrolls — scrubbed to document progress
      // (works with position:fixed accents; element-based triggers would never advance).
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
        opacity: 1,
      });

      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: () =>
            `+=${Math.max(
              window.innerHeight * 0.8,
              (document.documentElement.scrollHeight - window.innerHeight) *
                drawProgress
            )}`,
          scrub: 1.1,
          invalidateOnRefresh: true,
        },
      });

      // Soft parallax drift alongside the draw
      if (parallax !== 0 || parallaxX !== 0 || parallaxRotate !== 0) {
        gsap.fromTo(
          root,
          {
            y: parallax * 0.25,
            x: -parallaxX * 0.25,
            rotation: -parallaxRotate * 0.4,
            force3D: true,
          },
          {
            y: -parallax,
            x: parallaxX,
            rotation: parallaxRotate,
            ease: "none",
            force3D: true,
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.2,
            },
          }
        );
      }

      if (variant === "rotate" && svg) {
        gsap.to(svg, {
          rotation: 360,
          duration: 48,
          ease: "none",
          repeat: -1,
          transformOrigin: "50% 50%",
        });
      }

      if (variant === "pulse" && svg) {
        gsap.to(svg, {
          scale: 1.05,
          duration: 3.6,
          ease: "power1.inOut",
          yoyo: true,
          repeat: -1,
          transformOrigin: "50% 50%",
        });
      }
    },
    {
      scope: rootRef,
      dependencies: [
        kind,
        variant,
        drawEnd,
        parallax,
        parallaxX,
        parallaxRotate,
      ],
    }
  );

  return (
    <div
      ref={rootRef}
      className={`pointer-events-none select-none will-change-transform ${className}`}
      style={{ width: size, height: size, opacity }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox={VIEWBOX[kind]}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <path
          ref={pathRef}
          d={PATHS[kind]}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {kind === "c7" && (
          <>
            <circle cx="20" cy="110" r="2" fill={stroke} opacity="0.75" />
            <circle cx="200" cy="100" r="2" fill={stroke} opacity="0.75" />
            <line
              x1="80"
              y1="20"
              x2="80"
              y2="180"
              stroke={stroke}
              strokeWidth={0.55}
              opacity="0.45"
              strokeDasharray="2 3"
            />
          </>
        )}
      </svg>
    </div>
  );
}
