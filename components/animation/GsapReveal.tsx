"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap/config";
import { useTheme } from "@/lib/themes/ThemeProvider";
import type { ThemeMotion } from "@/lib/themes/types";

gsap.registerPlugin(useGSAP);

export type GsapRevealType = "heading" | "text" | "image" | "card" | "clip";

interface GsapRevealProps {
  children: React.ReactNode;
  type?: GsapRevealType;
  className?: string;
  delay?: number;
  immediate?: boolean;
}

function applyReveal(
  el: HTMLElement,
  type: GsapRevealType,
  motion: ThemeMotion,
  delay: number,
  immediate: boolean,
  reduced: boolean
) {
  if (reduced) {
    gsap.set(el, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      clipPath: "none",
    });
    return;
  }

  const duration = motion.duration;
  const ease = motion.ease;
  const travel = motion.travel;

  if (type === "clip" || motion.reveal === "clip") {
    gsap.set(el, { clipPath: "inset(0 0 100% 0)" });
    return gsap.to(el, {
      clipPath: "inset(0 0 0% 0)",
      duration: Math.max(duration, 0.9),
      delay,
      ease,
      ...(immediate
        ? {}
        : {
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }),
    });
  }

  if (motion.reveal === "wipe") {
    gsap.set(el, { clipPath: "inset(0 100% 0 0)", autoAlpha: 1 });
    return gsap.to(el, {
      clipPath: "inset(0 0% 0 0)",
      duration,
      delay,
      ease,
      ...(immediate
        ? {}
        : {
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }),
    });
  }

  if (motion.reveal === "hard") {
    const distance = type === "heading" ? travel : travel * 0.7;
    gsap.set(el, { x: distance, autoAlpha: 0 });
    return gsap.to(el, {
      x: 0,
      autoAlpha: 1,
      duration,
      delay,
      ease,
      ...(immediate
        ? {}
        : {
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }),
    });
  }

  if (motion.reveal === "orbit") {
    gsap.set(el, {
      rotation: type === "image" ? -6 : -2,
      scale: motion.scaleFrom,
      autoAlpha: 0,
    });
    return gsap.to(el, {
      rotation: 0,
      scale: 1,
      autoAlpha: 1,
      duration,
      delay,
      ease,
      ...(immediate
        ? {}
        : {
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }),
    });
  }

  const from: gsap.TweenVars = { autoAlpha: 0, force3D: true };
  const to: gsap.TweenVars = {
    autoAlpha: 1,
    duration,
    delay,
    ease,
  };

  if (type === "image") {
    from.scale = motion.scaleFrom;
    to.scale = 1;
  } else if (type === "heading") {
    from.y = travel;
    to.y = 0;
  } else if (type === "card") {
    from.y = travel * 0.75;
    to.y = 0;
  } else {
    from.y = travel * 0.45;
    to.y = 0;
  }

  gsap.set(el, from);
  return gsap.to(el, {
    ...to,
    ...(immediate
      ? {}
      : {
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }),
  });
}

export function GsapReveal({
  children,
  type = "text",
  className = "",
  delay = 0,
  immediate = false,
}: GsapRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => {
        applyReveal(el, type, theme.motion, delay, immediate, true);
      });
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        applyReveal(el, type, theme.motion, delay, immediate, false);
      });
      return () => mm.revert();
    },
    {
      scope: ref,
      dependencies: [type, delay, immediate, theme.id, theme.motion],
      revertOnUpdate: true,
    }
  );

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
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
  stagger,
}: GsapStaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const staggerAmount = stagger ?? theme.motion.stagger;

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (!el) return;
      const items = el.children;
      if (!items.length) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(items, { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0 });
      });
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const motion = theme.motion;
        if (motion.reveal === "hard") {
          gsap.set(items, { x: motion.travel, autoAlpha: 0 });
          gsap.to(items, {
            x: 0,
            autoAlpha: 1,
            duration: motion.duration,
            stagger: staggerAmount,
            ease: motion.ease,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
          return;
        }
        if (motion.reveal === "clip" || motion.reveal === "wipe") {
          const inset =
            motion.reveal === "wipe"
              ? "inset(0 100% 0 0)"
              : "inset(0 0 100% 0)";
          gsap.set(items, { clipPath: inset });
          gsap.to(items, {
            clipPath: "inset(0 0% 0 0)",
            duration: motion.duration,
            stagger: staggerAmount,
            ease: motion.ease,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
          return;
        }
        if (motion.reveal === "orbit") {
          gsap.set(items, {
            rotation: -3,
            scale: motion.scaleFrom,
            autoAlpha: 0,
          });
          gsap.to(items, {
            rotation: 0,
            scale: 1,
            autoAlpha: 1,
            duration: motion.duration,
            stagger: staggerAmount,
            ease: motion.ease,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
          return;
        }
        gsap.set(items, { autoAlpha: 0, y: motion.travel * 0.7, force3D: true });
        gsap.to(items, {
          autoAlpha: 1,
          y: 0,
          duration: motion.duration,
          stagger: staggerAmount,
          ease: motion.ease,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });
      return () => mm.revert();
    },
    {
      scope: ref,
      dependencies: [staggerAmount, theme.id],
      revertOnUpdate: true,
    }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
