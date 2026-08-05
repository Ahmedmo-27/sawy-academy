"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const TICKS = 20;

/** Same max scroll the native scrollbar uses. */
function getMaxScroll() {
  const doc = document.documentElement;
  return Math.max(0, doc.scrollHeight - doc.clientHeight);
}

export function ScrollProgressScale() {
  const fillRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    registerGsap();
    const fill = fillRef.current;
    const marker = markerRef.current;
    if (!fill || !marker) return;

    const proxy = { progress: 0 };

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
          const p = proxy.progress;
          gsap.set(fill, { scaleY: p });
          gsap.set(marker, { top: `${p * 100}%` });
        },
      },
    );

    let refreshRaf = 0;
    const refresh = () => {
      cancelAnimationFrame(refreshRaf);
      refreshRaf = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    };

    // Recalculate as layout / assets settle (pre- and post-load)
    const ro = new ResizeObserver(refresh);
    ro.observe(document.documentElement);
    ro.observe(document.body);

    const onLoad = () => refresh();
    window.addEventListener("load", onLoad);
    window.addEventListener("resize", onLoad);
    void document.fonts?.ready.then(refresh);

    // Late images that expand document height after first paint
    const bindImage = (img: HTMLImageElement) => {
      if (img.complete) return;
      img.addEventListener("load", refresh, { once: true });
      img.addEventListener("error", refresh, { once: true });
    };
    document.querySelectorAll("img").forEach((img) => bindImage(img));

    const mo = new MutationObserver((mutations) => {
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

    // Double-raf so we measure after the first layout pass
    const boot = requestAnimationFrame(() => {
      refresh();
      requestAnimationFrame(refresh);
    });

    return () => {
      cancelAnimationFrame(boot);
      cancelAnimationFrame(refreshRaf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("load", onLoad);
      window.removeEventListener("resize", onLoad);
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
      <div className="relative flex-1 w-px bg-hairline/80">
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
        <div
          ref={markerRef}
          className="absolute left-1/2 -translate-x-1/2 w-2 h-2 border border-clay bg-concrete"
          style={{ top: "0%" }}
        />
      </div>
      <span className="label-caps text-charcoal/30 text-[0.5rem] mt-2 -rotate-90 origin-center whitespace-nowrap">
        scale
      </span>
    </div>
  );
}
