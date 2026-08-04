"use client";

import { useEffect, useState } from "react";
import { GeometricLattice } from "@/components/decorative/GeometricLattice";

export function SplashLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const minDisplay = prefersReducedMotion ? 0 : 1400;
    const fadeMs = prefersReducedMotion ? 0 : 600;
    const start = Date.now();

    const finish = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, minDisplay - elapsed);
      window.setTimeout(() => {
        setFadeOut(true);
        window.setTimeout(() => setVisible(false), fadeMs);
      }, remaining);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish);
      return () => window.removeEventListener("load", finish);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-concrete transition-opacity duration-600 motion-reduce:transition-none ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-live="polite"
      aria-busy={!fadeOut}
      aria-label="Loading Sawy Academy"
    >
      <GeometricLattice opacity={0.14} />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6">
        {/* Animated 8-point star */}
        <svg
          viewBox="0 0 120 120"
          className="w-24 h-24 loader-star"
          aria-hidden="true"
        >
          <polygon
            className="loader-star-stroke"
            points="60,8 68,32 92,32 74,48 80,72 60,58 40,72 46,48 28,32 52,32"
            fill="none"
            stroke="#8b5a4a"
            strokeWidth="1"
          />
          <polygon
            className="loader-star-stroke loader-star-stroke-delay"
            points="60,20 66,38 84,38 70,50 74,68 60,58 46,68 50,50 36,38 54,38"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="0.6"
            opacity="0.5"
          />
          <circle
            className="loader-star-stroke loader-star-stroke-delay-2"
            cx="60"
            cy="60"
            r="8"
            fill="none"
            stroke="#8b5a4a"
            strokeWidth="0.6"
          />
        </svg>

        <div className="text-center">
          <p className="font-sans text-sm font-medium uppercase tracking-[0.32em] text-charcoal mb-2">
            SAWY
          </p>
          <p className="font-serif text-lg font-light text-charcoal-muted mb-6">
            Academy
          </p>
          <p className="label-caps text-clay loader-pulse">Loading</p>
        </div>

        {/* Corner registration marks */}
        <div className="absolute inset-8 pointer-events-none" aria-hidden="true">
          <span className="absolute top-0 left-0 w-6 h-6 border-t border-l border-charcoal/40" />
          <span className="absolute top-0 right-0 w-6 h-6 border-t border-r border-charcoal/40" />
          <span className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-charcoal/40" />
          <span className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-charcoal/40" />
        </div>
      </div>
    </div>
  );
}
