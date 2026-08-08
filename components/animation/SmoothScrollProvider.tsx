"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { scheduleScrollRefresh } from "@/lib/gsap/refresh";
import { setLenisInstance } from "@/lib/smoothScroll";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

/**
 * Lenis smooth scroll wired to GSAP ScrollTrigger (Cipher / Trionn pattern).
 * Disabled when prefers-reduced-motion is set.
 */
export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setLenisInstance(null);
      document.documentElement.classList.remove("lenis");
      return;
    }

    registerGsap();

    const lenis = new Lenis({
      duration: 0.7,
      smoothWheel: true,
      touchMultiplier: 1.5,
      wheelMultiplier: 1.2,
      autoRaf: false,
    });

    setLenisInstance(lenis);
    document.documentElement.classList.add("lenis");

    lenis.on("scroll", ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    // Only resize Lenis when ScrollTrigger refreshes for a real layout change
    // (ignoreMobileResize already filters chrome show/hide).
    const onRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener("refresh", onRefresh);
    scheduleScrollRefresh();

    let lastWidth = window.innerWidth;
    const onWindowResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      lenis.resize();
      scheduleScrollRefresh();
    };
    window.addEventListener("resize", onWindowResize);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      gsap.ticker.remove(ticker);
      lenis.destroy();
      setLenisInstance(null);
      document.documentElement.classList.remove("lenis");
    };
  }, [reduced]);

  return <>{children}</>;
}
