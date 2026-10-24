"use client";

import React, { useEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ArchitecturalMetricTickerProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  className?: string;
  numberClassName?: string;
  labelClassName?: string;
}

function formatNumber(num: number): string {
  return Math.round(num).toLocaleString();
}

/**
 * High-performance GSAP architectural metric odometer.
 * Counts up smoothly on viewport entry without triggering React re-renders.
 */
export function ArchitecturalMetricTicker({
  value,
  duration = 1.8,
  prefix = "",
  suffix = "",
  label,
  className = "",
  numberClassName = "text-3xl sm:text-4xl font-serif font-medium text-clay",
  labelClassName = "label-caps mt-1 text-charcoal-muted",
}: ArchitecturalMetricTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    registerGsap();
    const container = containerRef.current;
    const numEl = numberRef.current;
    if (!container || !numEl) return;

    if (reduced) {
      numEl.textContent = `${prefix}${formatNumber(value)}${suffix}`;
      return;
    }

    const proxy = { count: 0 };
    numEl.textContent = `${prefix}0${suffix}`;

    const tween = gsap.to(proxy, {
      count: value,
      duration,
      ease: "power2.out",
      scrollTrigger: {
        trigger: container,
        start: "top 88%",
        toggleActions: "play none none none",
        once: true,
      },
      onUpdate: () => {
        if (numEl) {
          numEl.textContent = `${prefix}${formatNumber(proxy.count)}${suffix}`;
        }
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [value, duration, prefix, suffix, reduced]);

  return (
    <div ref={containerRef} className={`inline-flex flex-col ${className}`}>
      <span ref={numberRef} className={`tabular-nums ${numberClassName}`}>
        {prefix}{reduced ? formatNumber(value) : "0"}{suffix}
      </span>
      {label && <span className={labelClassName}>{label}</span>}
    </div>
  );
}
