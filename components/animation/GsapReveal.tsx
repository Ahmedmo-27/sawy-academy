"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type GsapRevealType = "heading" | "text" | "image" | "card" | "clip";

interface GsapRevealProps {
  children: React.ReactNode;
  type?: GsapRevealType;
  className?: string;
  delay?: number;
  immediate?: boolean;
}

export function GsapReveal({
  children,
  type = "text",
  className = "",
  delay = 0,
  immediate = false,
}: GsapRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    registerGsap();
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, force3D: true });

    const to: gsap.TweenVars = {
      opacity: 1,
      duration: 0.7,
      delay,
      ease: "power2.out",
    };

    switch (type) {
      case "heading":
        gsap.set(el, { y: 36 });
        to.y = 0;
        to.duration = 0.85;
        break;
      case "image":
        gsap.set(el, { scale: 0.95 });
        to.scale = 1;
        to.duration = 0.9;
        break;
      case "card":
        gsap.set(el, { y: 28 });
        to.y = 0;
        to.duration = 0.65;
        break;
      case "clip":
        gsap.set(el, { clipPath: "inset(0 0 100% 0)" });
        to.clipPath = "inset(0 0 0% 0)";
        to.duration = 0.8;
        break;
      default:
        gsap.set(el, { y: 16 });
        to.y = 0;
    }

    if (immediate) {
      gsap.to(el, to);
      return;
    }

    const tween = gsap.to(el, {
      ...to,
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced, type, delay, immediate]);

  return (
    <div ref={ref} className={`min-w-0 max-w-full will-change-transform ${className}`}>
      {children}
    </div>
  );
}

interface GsapStaggerProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}

export function GsapStagger({
  children,
  className = "",
  stagger = 0.08,
}: GsapStaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    registerGsap();
    const el = ref.current;
    if (!el) return;

    const items = el.children;
    if (!items.length) return;

    gsap.set(items, { opacity: 0, y: 24, force3D: true });

    const tween = gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.65,
      stagger,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced, stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
