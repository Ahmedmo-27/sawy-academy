"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface HorizontalPinGalleryProps {
  children: React.ReactNode;
  className?: string;
  /** Extra scroll distance multiplier beyond track overflow (keep ≤ 1). */
  distanceFactor?: number;
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
        start: "top top",
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
      ScrollTrigger.refresh();
    };
  }, [reduced, distanceFactor]);

  return (
    <div ref={sectionRef} className={`horiz-pin ${className}`}>
      <div
        ref={pinRef}
        className="horiz-pin__viewport relative flex h-[min(100dvh,820px)] w-full items-center overflow-hidden"
      >
        <div
          ref={trackRef}
          className="horiz-pin__track flex w-max flex-row gap-4 will-change-transform sm:gap-6"
        >
          {children}
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-6 sm:bottom-4"
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
