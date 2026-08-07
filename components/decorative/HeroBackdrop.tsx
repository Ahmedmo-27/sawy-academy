"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { parallax } from "@/lib/motion";
import { GeometricLattice } from "./GeometricLattice";
import { FloorPlanSketch } from "./FloorPlanSketch";
import { AxonometricSketch } from "./AxonometricSketch";
import { BlueprintDraw } from "./BlueprintDraw";

interface HeroBackdropProps {
  variant?: "home" | "page";
}

export function HeroBackdrop({ variant = "page" }: HeroBackdropProps) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollY } = useScroll();

  const bgY = useTransform(
    scrollY,
    [0, 800],
    [0, prefersReducedMotion ? 0 : 800 * parallax.background]
  );
  const midY = useTransform(
    scrollY,
    [0, 800],
    [0, prefersReducedMotion ? 0 : 800 * parallax.midground]
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* Background plane — lattice */}
      <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
        <GeometricLattice opacity={variant === "home" ? 0.04 : 0.03} />
      </motion.div>

      {/* Mid-ground plane — line drawings */}
      <motion.div className="absolute inset-0 z-[1]" style={{ y: midY }}>
        {variant === "home" ? (
          <>
            <FloorPlanSketch className="right-0 top-16 w-[70%] max-w-lg opacity-30 sm:top-24 sm:w-[48%] sm:opacity-40" />
            <AxonometricSketch className="right-0 bottom-6 w-24 opacity-20 sm:bottom-8 sm:w-28 sm:opacity-15 md:left-0 md:right-auto md:bottom-16 md:w-52 md:opacity-30" />
            <BlueprintDraw className="right-4 top-28 w-44 opacity-45 sm:right-16 sm:top-36 sm:w-64 sm:opacity-60" />
          </>
        ) : (
          <>
            <FloorPlanSketch className="right-0 top-12 w-48 opacity-25 sm:top-16 sm:w-60 sm:opacity-30" />
            <AxonometricSketch className="-left-10 bottom-8 w-32 opacity-20 sm:-left-16 sm:bottom-12 sm:w-40 sm:opacity-25" />
            <BlueprintDraw className="right-6 top-24 w-40 opacity-35 sm:right-20 sm:top-32 sm:w-52 sm:opacity-40" />
          </>
        )}
      </motion.div>

      {/* Foreground scrim — solid, not gradient; protects structural text */}
      <div
        className={`absolute inset-y-0 left-0 z-[2] ${
          variant === "home"
            ? "w-full bg-concrete/96 sm:bg-concrete/90 md:w-11/12 md:bg-concrete/92 lg:w-8/12"
            : "w-full bg-concrete/90 md:w-10/12 lg:w-7/12"
        }`}
      />
    </div>
  );
}
