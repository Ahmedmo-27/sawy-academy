"use client";

import { useEffect } from "react";

/**
 * Locks --app-height so mobile browser chrome (URL bar / bottom toolbar)
 * expanding or collapsing mid-scroll does not resize the layout.
 * Updates only on real viewport changes (width or orientation).
 */
export function StableViewport() {
  useEffect(() => {
    const root = document.documentElement;
    let width = window.innerWidth;

    const apply = () => {
      // Prefer the CSS small viewport when available; fall back to px lock.
      if (CSS.supports("height", "100svh")) {
        root.style.setProperty("--app-height", "100svh");
        return;
      }
      root.style.setProperty("--app-height", `${window.innerHeight}px`);
    };

    apply();

    const onResize = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      apply();
    };

    const onOrientation = () => {
      window.setTimeout(() => {
        width = window.innerWidth;
        apply();
      }, 250);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, []);

  return null;
}
