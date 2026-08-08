"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { scheduleScrollRefresh } from "@/lib/gsap/refresh";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { scrollToY } from "@/lib/smoothScroll";

const TICKS = 20;

/** Same max scroll the native scrollbar uses. */
function getMaxScroll() {
  const doc = document.documentElement;
  return Math.max(0, doc.scrollHeight - doc.clientHeight);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function ScrollProgressScale() {
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    registerGsap();
    const track = trackRef.current;
    const fill = fillRef.current;
    const marker = markerRef.current;
    if (!track || !fill || !marker) return;

    const proxy = { progress: 0 };
    let dragging = false;

    const applyVisual = (p: number) => {
      gsap.set(fill, { scaleY: p });
      gsap.set(marker, { top: `${p * 100}%` });
    };

    const scrollToProgress = (p: number) => {
      const max = getMaxScroll();
      scrollToY(p * max, true);
    };

    const progressFromClientY = (clientY: number) => {
      const rect = track.getBoundingClientRect();
      if (rect.height <= 0) return 0;
      return clamp((clientY - rect.top) / rect.height, 0, 1);
    };

    const tween = gsap.fromTo(
      proxy,
      { progress: 0 },
      {
        progress: 1,
        ease: "none",
        scrollTrigger: {
          // Match the browser scrollbar: 0 → max scrollY
          start: 0,
          end: () => getMaxScroll(),
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          if (dragging) return;
          applyVisual(proxy.progress);
        },
      },
    );

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      e.preventDefault();
      const p = progressFromClientY(e.clientY);
      proxy.progress = p;
      applyVisual(p);
      scrollToProgress(p);
    };

    const endDrag = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      marker.releasePointerCapture(e.pointerId);
      marker.classList.remove("cursor-grabbing");
      marker.classList.add("cursor-grab");
      document.body.style.removeProperty("user-select");
      document.body.style.removeProperty("cursor");
      // Re-enable after programmatic scroll so scrub picks up from current position
      tween.scrollTrigger?.enable();
      ScrollTrigger.update();
    };

    const beginDrag = (e: PointerEvent) => {
      dragging = true;
      // Avoid scrub lag fighting the drag thumb
      tween.scrollTrigger?.disable(false);
      marker.setPointerCapture(e.pointerId);
      marker.classList.remove("cursor-grab");
      marker.classList.add("cursor-grabbing");
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";

      const p = progressFromClientY(e.clientY);
      proxy.progress = p;
      applyVisual(p);
      scrollToProgress(p);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      beginDrag(e);
    };

    // Click/drag anywhere on the track jumps + can continue as a drag
    const onTrackPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (e.target === marker || marker.contains(e.target as Node)) return;
      e.preventDefault();
      beginDrag(e);
    };

    marker.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointerdown", onTrackPointerDown);
    marker.addEventListener("pointermove", onPointerMove);
    marker.addEventListener("pointerup", endDrag);
    marker.addEventListener("pointercancel", endDrag);

    // Recalculate once after batches of layout and asset changes settle.
    const onLoad = () => scheduleScrollRefresh();
    window.addEventListener("load", onLoad);
    void document.fonts?.ready.then(() => scheduleScrollRefresh());

    // Late images that expand document height after first paint
    const bindImage = (img: HTMLImageElement) => {
      if (img.complete) return;
      img.addEventListener("load", onLoad, { once: true });
      img.addEventListener("error", onLoad, { once: true });
    };
    document.querySelectorAll("img").forEach((img) => bindImage(img));

    const mo = new MutationObserver((mutations) => {
      scheduleScrollRefresh();
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) bindImage(node);
          else if (node instanceof HTMLElement) {
            node.querySelectorAll("img").forEach((img) => bindImage(img));
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    scheduleScrollRefresh();

    return () => {
      mo.disconnect();
      window.removeEventListener("load", onLoad);
      marker.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointerdown", onTrackPointerDown);
      marker.removeEventListener("pointermove", onPointerMove);
      marker.removeEventListener("pointerup", endDrag);
      marker.removeEventListener("pointercancel", endDrag);
      document.body.style.removeProperty("user-select");
      document.body.style.removeProperty("cursor");
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      className="pointer-events-none fixed left-3 top-24 bottom-8 z-40 hidden lg:flex flex-col items-center w-6"
      aria-hidden="true"
    >
      <span className="label-caps text-charcoal/30 text-[0.5rem] mb-2 -rotate-90 origin-center whitespace-nowrap">
        0m
      </span>
      <div
        ref={trackRef}
        className="pointer-events-auto relative flex-1 w-full cursor-pointer touch-none"
      >
        {/* Visual rail — thin line; hit target is the wider parent */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-hairline/80 pointer-events-none">
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
            className="absolute top-0 left-0 w-full bg-clay/50 origin-top"
            style={{ height: "100%", transform: "scaleY(0)" }}
          />
        </div>
        <div
          ref={markerRef}
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-clay bg-concrete cursor-grab touch-none"
          style={{ top: "0%" }}
        />
      </div>
      <span className="label-caps text-charcoal/30 text-[0.5rem] mt-2 -rotate-90 origin-center whitespace-nowrap">
        scale
      </span>
    </div>
  );
}
