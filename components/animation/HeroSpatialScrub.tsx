"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface HeroSpatialScrubProps {
  frameCount?: number;
  framePrefix?: string;
  frameExt?: string;
  padLength?: number;
  className?: string;
}

export function HeroSpatialScrub({
  frameCount = 240,
  framePrefix = "/frames/hero/frame_",
  frameExt = ".webp",
  padLength = 4,
  className = "",
}: HeroSpatialScrubProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  const [activeFrame, setActiveFrame] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());

  const getFramePath = useCallback(
    (index: number) => {
      const padded = String(index).padStart(padLength, "0");
      return `${framePrefix}${padded}${frameExt}`;
    },
    [framePrefix, padLength, frameExt]
  );

  const renderFrame = useCallback((frameNum: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const img = imagesRef.current.get(frameNum);
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const targetWidth = Math.round(rect.width * dpr);
    const targetHeight = Math.round(rect.height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = canvas.width / canvas.height;
    let renderW = canvas.width;
    let renderH = canvas.height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      renderH = canvas.width / imgRatio;
      offsetY = (canvas.height - renderH) / 2;
    } else {
      renderW = canvas.height * imgRatio;
      offsetX = (canvas.width - renderW) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  }, []);

  // Preload frames in background
  useEffect(() => {
    let cancelled = false;

    // First frame
    const firstImg = new Image();
    firstImg.src = getFramePath(1);
    firstImg.onload = () => {
      if (cancelled) return;
      imagesRef.current.set(1, firstImg);
      renderFrame(1);
      setIsLoaded(true);
    };

    // Remaining frames
    const preloadTimer = setTimeout(() => {
      for (let i = 2; i <= frameCount; i++) {
        const img = new Image();
        img.src = getFramePath(i);
        img.onload = () => {
          if (cancelled) return;
          imagesRef.current.set(i, img);
        };
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(preloadTimer);
    };
  }, [frameCount, getFramePath, renderFrame]);

  useEffect(() => {
    const handleResize = () => renderFrame(activeFrame);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeFrame, renderFrame]);

  // Bind to hero section scroll
  useEffect(() => {
    if (reduced) return;
    registerGsap();

    const containerEl = containerRef.current;
    if (!containerEl) return;

    const heroSection = containerEl.closest("section");
    const triggerTarget = heroSection || containerEl;

    const ctx = gsap.context(() => {
      gsap.to(
        {},
        {
          ease: "none",
          scrollTrigger: {
            trigger: triggerTarget,
            start: "top top",
            end: "bottom top",
            scrub: 0.1,
            onUpdate: (self) => {
              const target = Math.min(
                frameCount,
                Math.max(1, Math.floor(self.progress * (frameCount - 1)) + 1)
              );
              setActiveFrame(target);
              renderFrame(target);
            },
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [reduced, frameCount, renderFrame]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-black/80 flex items-center justify-center select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* Architectural overlay marks */}
      <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[0.625rem] font-mono text-white/70">
          <span className="px-1.5 py-0.5 bg-black/70 border border-white/15 text-clay font-medium">
            3D SPATIAL MODEL
          </span>
          <span className="px-1.5 py-0.5 bg-black/70 border border-white/15 text-white/80">
            FRM {String(activeFrame).padStart(padLength, "0")}
          </span>
        </div>

        <div className="flex items-center justify-between text-[0.625rem] font-mono text-white/60">
          <span>AXONOMETRIC ROTATION</span>
          <span className="text-clay font-medium">SCROLL TO ROTATE ↓</span>
        </div>
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-charcoal/90 z-20">
          <p className="text-[0.6875rem] font-mono text-clay animate-pulse">
            INITIALIZING MODEL...
          </p>
        </div>
      )}
    </div>
  );
}
