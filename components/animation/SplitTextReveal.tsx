"use client";

import { useEffect, useRef } from "react";
import {
  gsap,
  SplitText,
  registerGsap,
} from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type SplitKind = "lines" | "words" | "chars";

interface SplitTextRevealProps {
  children: React.ReactNode;
  type?: SplitKind;
  className?: string;
  delay?: number;
  immediate?: boolean;
  start?: string;
}

/**
 * GSAP SplitText line/word/char mask reveals (Cipher scroll-text-reveal pattern).
 */
export function SplitTextReveal({
  children,
  type = "lines",
  className = "",
  delay = 0,
  immediate = false,
  start = "top 88%",
}: SplitTextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    registerGsap();
    let split: InstanceType<typeof SplitText> | null = null;
    let tween: gsap.core.Tween | null = null;
    let killed = false;

    const run = () => {
      if (killed || !ref.current) return;

      split = SplitText.create(ref.current, {
        type,
        mask: type === "chars" ? "chars" : type === "words" ? "words" : "lines",
        autoSplit: true,
        aria: "none",
      });

      const targets =
        type === "chars"
          ? split.chars
          : type === "words"
            ? split.words
            : split.lines;

      if (!targets?.length) return;

      gsap.set(targets, {
        yPercent: type === "chars" ? 110 : 118,
        autoAlpha: 0,
        force3D: true,
      });

      const vars: gsap.TweenVars = {
        yPercent: 0,
        autoAlpha: 1,
        duration: type === "chars" ? 0.45 : type === "words" ? 0.55 : 0.72,
        stagger: type === "chars" ? 0.018 : type === "words" ? 0.06 : 0.1,
        ease: "power3.out",
        delay,
      };

      if (immediate) {
        tween = gsap.to(targets, vars);
      } else {
        tween = gsap.to(targets, {
          ...vars,
          scrollTrigger: {
            trigger: ref.current,
            start,
            toggleActions: "play none none none",
          },
        });
      }
    };

    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    void fontsReady.then(() => {
      requestAnimationFrame(() => requestAnimationFrame(run));
    });

    return () => {
      killed = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
      split?.revert();
    };
  }, [reduced, type, delay, immediate, start]);

  return (
    <div ref={ref} className={`split-text-reveal ${className}`}>
      {children}
    </div>
  );
}
