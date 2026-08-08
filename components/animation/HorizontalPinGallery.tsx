"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap/config";
import { scheduleScrollRefresh } from "@/lib/gsap/refresh";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface HorizontalPinGalleryProps {
  children: React.ReactNode;
  className?: string;
  /** Extra scroll distance multiplier beyond track overflow (keep ≤ 1). */
  distanceFactor?: number;
}

/** Fixed header clearance so pin starts when the nav meets the cards. */
function getNavOffsetPx(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--nav-height")
    .trim();
  if (!raw) return 88;
  if (raw.endsWith("rem")) {
    const root =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return parseFloat(raw) * root;
  }
  return parseFloat(raw) || 88;
}

/**
 * Pin + horizontal scrub — snappy scrub, shorter pin distance so it
 * doesn't feel stuck mid-gallery.
 */
export function HorizontalPinGallery({
  children,
  className = "",
  distanceFactor = 1,
}: HorizontalPinGalleryProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    registerGsap();
    const pin = pinRef.current;
    const track = trackRef.current;
    const progress = progressRef.current;
    if (!pin || !track) return;

    const getScroll = () =>
      Math.max(0, track.scrollWidth - pin.clientWidth) * distanceFactor;

    gsap.set(track, { x: 0, force3D: true });

    const tween = gsap.to(track, {
      x: () => -getScroll(),
      ease: "none",
      scrollTrigger: {
        trigger: pin,
        // Pin just under the fixed navbar so horizontal scrub begins
        // when the nav reaches the top of the cards — not under it.
        start: () => `top ${getNavOffsetPx()}`,
        end: () => `+=${Math.max(getScroll() * 1.05, pin.clientWidth * 0.55)}`,
        pin: true,
        scrub: 0.2,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          if (!progress) return;
          progress.style.transform = `scaleX(${self.progress})`;
        },
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(track, { clearProps: "transform" });
      if (progress) progress.style.transform = "scaleX(0)";
      scheduleScrollRefresh();
    };
  }, [reduced, distanceFactor]);

  return (
    <div ref={sectionRef} className={`horiz-pin ${className}`}>
      <div
        ref={pinRef}
        className="horiz-pin__viewport relative flex h-[min(calc(70svh-var(--nav-height)),560px)] w-full items-center overflow-hidden sm:h-[min(calc(85svh-var(--nav-height)),720px)] lg:h-[min(calc(100svh-var(--nav-height)),820px)]"
      >
        <div
          ref={trackRef}
          className="horiz-pin__track flex w-max flex-row gap-5 will-change-transform sm:gap-6"
        >
          {children}
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-6 sm:bottom-2"
          aria-hidden="true"
        >
          <div className="h-px w-full max-w-xs overflow-hidden bg-hairline sm:max-w-sm">
            <div
              ref={progressRef}
              className="h-full w-full origin-left bg-clay/60"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
