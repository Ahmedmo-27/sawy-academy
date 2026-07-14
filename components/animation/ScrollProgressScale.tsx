"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { gsap, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsDesktop } from "@/hooks/useMediaQuery";

const TICKS = 20;
const SCROLLBAR_CLASS = "scale-scrollbar-active";
const DRAGGING_CLASS = "scale-scrollbar-dragging";

function getMaxScroll() {
  return Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
}

function getScrollRatio() {
  const max = getMaxScroll();
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / max));
}

function scrollToRatio(ratio: number) {
  const max = getMaxScroll();
  window.scrollTo({
    top: Math.min(1, Math.max(0, ratio)) * max,
    behavior: "auto",
  });
}

function ratioFromClientY(clientY: number, track: HTMLElement) {
  const rect = track.getBoundingClientRect();
  if (rect.height <= 0) return 0;
  return Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
}

export function ScrollProgressScale() {
  const fillRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const reduced = useReducedMotion();
  const isDesktop = useIsDesktop();
  const [scrollValue, setScrollValue] = useState(0);

  const active = isDesktop && !reduced;

  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.classList.add(SCROLLBAR_CLASS);
    return () => {
      root.classList.remove(SCROLLBAR_CLASS);
      root.classList.remove(DRAGGING_CLASS);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const updateValue = () =>
      setScrollValue(Math.round(getScrollRatio() * 100));
    updateValue();
    window.addEventListener("scroll", updateValue, { passive: true });
    window.addEventListener("resize", updateValue);
    return () => {
      window.removeEventListener("scroll", updateValue);
      window.removeEventListener("resize", updateValue);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    registerGsap();
    const fill = fillRef.current;
    const marker = markerRef.current;
    if (!fill || !marker) return;

    const tween = gsap.to(fill, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });

    const markerTween = gsap.to(marker, {
      top: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      markerTween.scrollTrigger?.kill();
      markerTween.kill();
    };
  }, [active]);

  const syncVisual = useCallback((ratio: number) => {
    const fill = fillRef.current;
    const marker = markerRef.current;
    if (fill) gsap.set(fill, { scaleY: ratio });
    if (marker) gsap.set(marker, { top: `${ratio * 100}%` });
  }, []);

  const scrubToPointer = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track) return;
      const ratio = ratioFromClientY(clientY, track);
      syncVisual(ratio);
      scrollToRatio(ratio);
    },
    [syncVisual],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const track = trackRef.current;
      if (!track) return;

      draggingRef.current = true;
      track.setPointerCapture(event.pointerId);
      document.documentElement.classList.add(DRAGGING_CLASS);
      scrubToPointer(event.clientY);
      event.preventDefault();
    },
    [scrubToPointer],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      scrubToPointer(event.clientY);
      event.preventDefault();
    },
    [scrubToPointer],
  );

  const endDrag = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    document.documentElement.classList.remove(DRAGGING_CLASS);
    if (trackRef.current?.hasPointerCapture(event.pointerId)) {
      trackRef.current.releasePointerCapture(event.pointerId);
    }
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const max = getMaxScroll();
    if (max <= 0) return;

    const page = window.innerHeight * 0.9;
    const line = 40;
    let next: number | null = null;

    switch (event.key) {
      case "ArrowUp":
        next = window.scrollY - line;
        break;
      case "ArrowDown":
        next = window.scrollY + line;
        break;
      case "PageUp":
        next = window.scrollY - page;
        break;
      case "PageDown":
      case " ":
        next = window.scrollY + page;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = max;
        break;
      default:
        return;
    }

    event.preventDefault();
    window.scrollTo({ top: Math.min(max, Math.max(0, next)), behavior: "auto" });
  }, []);

  if (!active) return null;

  return (
    <div
      className="fixed left-1 top-24 bottom-8 z-40 flex flex-col items-center w-8"
      role="scrollbar"
      aria-orientation="vertical"
      aria-controls="main-content"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={scrollValue}
      aria-label="Page scroll"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <span
        className="pointer-events-none label-caps text-charcoal/30 text-[0.5rem] mb-2 -rotate-90 origin-center whitespace-nowrap"
        aria-hidden="true"
      >
        0m
      </span>
      <div
        ref={trackRef}
        className="relative flex-1 w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-hairline/80">
          {Array.from({ length: TICKS }).map((_, i) => (
            <span
              key={i}
              className="absolute left-0 h-px bg-charcoal/20"
              style={{
                top: `${(i / (TICKS - 1)) * 100}%`,
                width: i % 5 === 0 ? "10px" : "5px",
              }}
            />
          ))}
          <div
            ref={fillRef}
            className="absolute top-0 left-0 w-full bg-clay/50 origin-top pointer-events-none"
            style={{ height: "100%", transform: "scaleY(0)" }}
          />
          <div
            ref={markerRef}
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 border border-clay bg-concrete pointer-events-none"
            style={{ top: "0%" }}
          />
        </div>
      </div>
      <span
        className="pointer-events-none label-caps text-charcoal/30 text-[0.5rem] mt-2 -rotate-90 origin-center whitespace-nowrap"
        aria-hidden="true"
      >
        scale
      </span>
    </div>
  );
}
