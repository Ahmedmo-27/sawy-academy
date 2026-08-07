"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  /** Max translate in px at magnet edge. */
  strength?: number;
}

/**
 * Cipher magnetic float: pointer X/Y inside bounds → soft gsap.to on inner.
 */
export function Magnetic({
  children,
  className = "",
  strength = 28,
}: MagneticProps) {
  const magnetRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    registerGsap();
    const magnet = magnetRef.current;
    const inner = innerRef.current;
    if (!magnet || !inner) return;

    const onMove = (event: MouseEvent) => {
      const bounds = magnet.getBoundingClientRect();
      const nx = (event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5;
      const ny =
        (event.clientY - bounds.top) / Math.max(1, bounds.height) - 0.5;
      const clamp = 0.5;
      const cx = Math.max(-clamp, Math.min(clamp, nx));
      const cy = Math.max(-clamp, Math.min(clamp, ny));
      gsap.to(inner, {
        x: cx * strength,
        y: cy * strength,
        duration: 0.9,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const onLeave = () => {
      gsap.to(inner, {
        x: 0,
        y: 0,
        duration: 1,
        ease: "power4.out",
        overwrite: "auto",
      });
    };

    magnet.addEventListener("mousemove", onMove);
    magnet.addEventListener("mouseleave", onLeave);
    return () => {
      magnet.removeEventListener("mousemove", onMove);
      magnet.removeEventListener("mouseleave", onLeave);
      gsap.killTweensOf(inner);
      gsap.set(inner, { clearProps: "transform" });
    };
  }, [reduced, strength]);

  return (
    <div ref={magnetRef} className={`magnetic ${className}`}>
      <div ref={innerRef} className="magnetic__inner will-change-transform">
        {children}
      </div>
    </div>
  );
}
