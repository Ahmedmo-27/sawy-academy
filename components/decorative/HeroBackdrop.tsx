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
            <FloorPlanSketch className="right-0 top-24 w-[48%] max-w-lg opacity-40 hidden lg:block" />
            <AxonometricSketch className="hidden sm:block right-0 bottom-8 w-28 opacity-15 md:left-0 md:right-auto md:bottom-16 md:w-52 md:opacity-30" />
            <BlueprintDraw className="right-16 top-36 w-64 opacity-60 hidden lg:block" />
          </>
        ) : (
          <>
            <FloorPlanSketch className="right-0 top-16 w-60 opacity-30 hidden lg:block" />
            <AxonometricSketch className="-left-16 bottom-12 w-40 opacity-25 hidden md:block" />
            <BlueprintDraw className="right-20 top-32 w-52 opacity-40 hidden lg:block" />
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
