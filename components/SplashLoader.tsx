"use client";

import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/feedback/LoadingScreen";

export function SplashLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const minDisplay = prefersReducedMotion ? 0 : 1400;
    const fadeMs = prefersReducedMotion ? 0 : 600;
    const start = Date.now();

    const finish = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, minDisplay - elapsed);
      window.setTimeout(() => {
        setFadeOut(true);
        window.setTimeout(() => setVisible(false), fadeMs);
      }, remaining);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish);
      return () => window.removeEventListener("load", finish);
    }
  }, []);

  if (!visible) return null;

  return <LoadingScreen fading={fadeOut} />;
}
