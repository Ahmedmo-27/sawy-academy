"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DecryptedText } from "@/components/animation/DecryptedText";

export interface ScrubChapter {
  id: string;
  code: string;
  title: string;
  datum: string;
  deliverables: string;
  sheetRef: string;
  fee?: string;
  href?: string;
}

const DEFAULT_CHAPTERS: ScrubChapter[] = [
  {
    id: "module-1",
    code: "ARC-D01",
    title: "Spatial Composition I",
    datum: "+0.00m // GROUND VOID",
    deliverables:
      "8px modular grids, solid-to-void poche massing, and 1:50 pavilion parti composition.",
    sheetRef: "SC-01 PROPORTION",
    fee: "EGP 18,500",
    href: "/courses/spatial-composition-i",
  },
  {
    id: "module-2",
    code: "ARC-D02",
    title: "Drawing & Representation",
    datum: "+3.40m // SECTION CUT",
    deliverables:
      "Orthographic cutting planes, line-weight hierarchy, and presentation drawing sets.",
    sheetRef: "DR-02 SECTION CUT",
    fee: "EGP 16,800",
    href: "/courses/drawing-and-representation",
  },
  {
    id: "module-3",
    code: "ARC-D03",
    title: "Material Studies",
    datum: "+7.80m // STRUCTURAL BAY",
    deliverables:
      "Cairo board-marked concrete, 1:2 timber joinery details, and bearing stone poche.",
    sheetRef: "MS-03 FORMWORK",
    fee: "EGP 19,900",
    href: "/courses/material-studies",
  },
  {
    id: "module-4",
    code: "ARC-D04",
    title: "Design Studio I",
    datum: "+12.00m // DEFENSE ROOF",
    deliverables:
      "Complete pavilion brief, structural bay integration, and guest jury defense.",
    sheetRef: "DS-04 JURY DEFENSE",
    fee: "EGP 22,000",
    href: "/courses/design-studio-i",
  },
];

interface ScrollVideoScrubProps {
  frameCount?: number;
  framePrefix?: string;
  frameExt?: string;
  padLength?: number;
  scrollDistance?: string;
  chapters?: ScrubChapter[];
  className?: string;
}

export function ScrollVideoScrub({
  frameCount = 240,
  framePrefix = "/frames/diploma/frame_",
  frameExt = ".webp",
  padLength = 4,
  scrollDistance = "+=260%",
  chapters = DEFAULT_CHAPTERS,
  className = "",
}: ScrollVideoScrubProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  const [activeFrame, setActiveFrame] = useState(1);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadPct, setLoadPct] = useState(0);

  // Smooth scroll-driven fade-out / fade-in state
  const [textOpacity, setTextOpacity] = useState(1);
  const [textY, setTextY] = useState(0);

  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());

  const getFramePath = useCallback(
    (index: number) => {
      const padded = String(index).padStart(padLength, "0");
      return `${framePrefix}${padded}${frameExt}`;
    },
    [framePrefix, padLength, frameExt]
  );

  // Draw frame on canvas with white studio background
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

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    let loadedCount = 0;

    const firstImg = new Image();
    firstImg.src = getFramePath(1);
    firstImg.onload = () => {
      if (cancelled) return;
      imagesRef.current.set(1, firstImg);
      renderFrame(1);
      setIsLoaded(true);
    };

    const preloadRest = () => {
      for (let i = 2; i <= frameCount; i++) {
        const img = new Image();
        img.src = getFramePath(i);
        img.onload = () => {
          if (cancelled) return;
          imagesRef.current.set(i, img);
          loadedCount++;
          setLoadPct(Math.round((loadedCount / frameCount) * 100));
        };
      }
    };

    const timer = setTimeout(preloadRest, 80);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [frameCount, getFramePath, renderFrame]);

  useEffect(() => {
    const handleResize = () => renderFrame(activeFrame);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeFrame, renderFrame]);

  // GSAP ScrollTrigger
  useEffect(() => {
    if (reduced) return;
    registerGsap();

    const pinEl = pinRef.current;
    const containerEl = containerRef.current;
    if (!pinEl || !containerEl) return;

    const boundaries: number[] = [];
    for (let i = 1; i < chapters.length; i++) {
      boundaries.push(i / chapters.length);
    }
    const FADE_WINDOW = 0.035;

    const ctx = gsap.context(() => {
      gsap.to(
        {},
        {
          ease: "none",
          scrollTrigger: {
            id: "diploma-scrub-trigger",
            trigger: containerEl,
            start: "top top",
            end: scrollDistance,
            pin: pinEl,
            pinSpacing: true,
            scrub: 0.15,
            anticipatePin: 1,
            onUpdate: (self) => {
              const progress = self.progress;
              const targetFrame = Math.min(
                frameCount,
                Math.max(1, Math.floor(progress * (frameCount - 1)) + 1)
              );

              setActiveFrame(targetFrame);
              renderFrame(targetFrame);

              const chapterIdx = Math.min(
                chapters.length - 1,
                Math.floor(progress * chapters.length)
              );
              setActiveChapterIndex(chapterIdx);

              let minDistance = 1;
              let closestBoundary = boundaries[0] ?? 0.5;

              for (const b of boundaries) {
                const dist = Math.abs(progress - b);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestBoundary = b;
                }
              }

              if (minDistance < FADE_WINDOW) {
                const rawT = minDistance / FADE_WINDOW;
                const smoothT = rawT * rawT * (3 - 2 * rawT);
                setTextOpacity(Math.max(0.04, smoothT));
                const dir = progress < closestBoundary ? -1 : 1;
                setTextY(dir * (1 - smoothT) * 6);
              } else {
                setTextOpacity(1);
                setTextY(0);
              }
            },
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [reduced, frameCount, scrollDistance, renderFrame, chapters.length]);

  const jumpToStage = (idx: number) => {
    const st = ScrollTrigger.getById("diploma-scrub-trigger");
    if (st) {
      const target =
        st.start + (st.end - st.start) * ((idx + 0.15) / chapters.length);
      window.scrollTo({ top: target, behavior: "smooth" });
    }
  };

  const activeChapter = chapters[activeChapterIndex] || chapters[0];

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-concrete text-charcoal select-none border-y border-charcoal/10 ${className}`}
    >
      <div
        ref={pinRef}
        className="h-[var(--app-height,100svh)] w-full flex flex-col justify-between overflow-hidden pt-[calc(var(--nav-height,3.75rem)+0.5rem)] sm:pt-[calc(var(--nav-height,4.5rem)+0.75rem)] pb-2.5 sm:pb-4 px-3 sm:px-6 lg:px-8"
      >
        {/* Top Architectural HUD Bar - Locked Height & Navbar Clearance */}
        <header className="relative z-20 h-10 sm:h-12 lg:h-14 shrink-0 flex items-center justify-between gap-3 sm:gap-4 border-b border-charcoal/10 pb-2 sm:pb-3 flex-nowrap overflow-hidden">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
            <span className="inline-flex items-center justify-center px-2 py-0.5 sm:px-2.5 sm:py-1 text-[0.6875rem] sm:text-[0.75rem] font-mono font-semibold text-clay bg-clay/10 border border-clay/20 shrink-0">
              <DecryptedText
                text={activeChapter.code}
                animateOn="view"
                speed={25}
                maxIterations={6}
              />
            </span>
            <div
              className="min-w-0 flex-1 transition-all duration-100 ease-out"
              style={{
                opacity: textOpacity,
                transform: `translateY(${textY}px)`,
              }}
            >
              <p className="text-[0.5625rem] sm:text-[0.6875rem] font-mono tracking-widest uppercase text-charcoal/60 truncate">
                AXONOMETRIC SCRUB // 1:50 SPATIAL CADENCE
              </p>
              <h3 className="font-serif text-xs sm:text-base text-charcoal font-medium tracking-tight truncate">
                {activeChapter.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-[0.6875rem] sm:text-[0.75rem] font-mono text-charcoal/70 shrink-0">
            <div
              className="hidden md:block transition-all duration-100 ease-out"
              style={{
                opacity: textOpacity,
                transform: `translateY(${textY}px)`,
              }}
            >
              <span className="text-clay font-medium">DATUM: </span>
              {activeChapter.datum}
            </div>
            <div className="px-2 py-0.5 sm:px-3 sm:py-1 border border-charcoal/15 bg-white shadow-xs text-charcoal font-medium shrink-0 text-[0.625rem] sm:text-[0.75rem]">
              FRAME [ {String(activeFrame).padStart(padLength, "0")} / {frameCount} ]
            </div>
          </div>
        </header>

        {/* Center Main Stage - Responsive Vertical Split on Mobile, Horizontal on Desktop */}
        <div className="relative z-10 flex-1 my-2 sm:my-3 flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6 items-stretch min-h-0 overflow-hidden">
          {/* Canvas Viewport: Constrained height on mobile so card fits comfortably */}
          <div className="relative w-full h-[28svh] sm:h-[34svh] lg:h-full lg:col-span-8 shrink-0 lg:shrink flex items-center justify-center overflow-hidden border border-charcoal/15 bg-white shadow-xs">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Architectural Crosshair & Drafting Marks */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-charcoal/20" />
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-dashed border-charcoal/20" />
              <div className="absolute top-2 left-2 sm:top-4 sm:left-4 text-[0.5625rem] sm:text-[0.625rem] font-mono text-charcoal/60">
                X: 0.00 Y: 0.00 Z: +{(activeFrame * 0.05).toFixed(2)}m
              </div>
              <div className="hidden sm:block absolute bottom-4 right-4 text-[0.625rem] font-mono text-clay font-medium">
                ORTHOGRAPHIC SECTION // REALTIME 60FPS
              </div>
            </div>

            {/* Frame Loader */}
            {!isLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-concrete/90 z-30">
                <div className="w-36 sm:w-48 h-1 bg-charcoal/10 overflow-hidden mb-2 sm:mb-3">
                  <div
                    className="h-full bg-clay transition-all duration-150"
                    style={{ width: `${loadPct}%` }}
                  />
                </div>
                <p className="text-[0.5625rem] sm:text-[0.6875rem] font-mono tracking-widest uppercase text-charcoal/60">
                  INITIALIZING AXONOMETRIC FRAMES ({loadPct}%)
                </p>
              </div>
            )}
          </div>

          {/* Chapter Syllabus Side HUD Card - Flexible on Mobile with Full Content Visibility */}
          <div className="flex-1 min-h-0 lg:col-span-4 flex flex-col justify-between bg-white border border-charcoal/15 p-3.5 sm:p-4 lg:p-5 shadow-xs overflow-hidden select-none">
            {/* Top Chapter Metadata with Scroll-Driven Fade */}
            <div className="flex flex-col shrink-0">
              {/* Badge row */}
              <div className="flex items-center justify-between border-b border-charcoal/10 pb-1.5 mb-1.5 shrink-0">
                <span className="text-[0.625rem] sm:text-xs font-mono tracking-widest text-clay font-semibold uppercase truncate">
                  MODULE {String(activeChapterIndex + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
                </span>
                <span className="px-1.5 py-0.5 text-[0.625rem] sm:text-xs font-mono font-medium text-clay bg-clay/10 border border-clay/20 shrink-0">
                  {activeChapter.code}
                </span>
              </div>

              {/* Dynamic Text with Smooth Fade */}
              <div
                className="flex flex-col transition-all duration-100 ease-out shrink-0"
                style={{
                  opacity: textOpacity,
                  transform: `translateY(${textY}px)`,
                }}
              >
                {/* Title */}
                <div className="flex items-center mb-1 overflow-hidden">
                  <h4 className="font-serif text-lg sm:text-xl lg:text-2xl text-charcoal font-medium tracking-tight line-clamp-2 leading-tight">
                    {activeChapter.title}
                  </h4>
                </div>

                {/* Deliverables description */}
                <div className="flex items-start mb-2 overflow-hidden">
                  <p className="text-[0.6875rem] sm:text-xs text-charcoal/70 leading-relaxed line-clamp-2">
                    {activeChapter.deliverables}
                  </p>
                </div>

                {/* Architectural Spec Block */}
                <div className="border-t border-charcoal/10 py-1.5 sm:py-2 space-y-1 sm:space-y-1.5 text-[0.625rem] sm:text-xs font-mono shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal/50">DRAWING SET:</span>
                    <span className="text-clay font-semibold truncate max-w-[140px] sm:max-w-[200px]">{activeChapter.sheetRef}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal/50">DELIVERY:</span>
                    <span className="px-1.5 py-0.5 bg-concrete text-charcoal/80 border border-charcoal/10 text-[0.5625rem] sm:text-[0.6875rem]">
                      100% ONLINE VIDEO
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal/50">STUDIO FEE:</span>
                    <span className="font-serif text-sm sm:text-base font-semibold text-charcoal">
                      {activeChapter.fee || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stages Stepper / Loader with Full Mobile Scaling */}
            <div className="mt-auto pt-2 sm:pt-2.5 border-t border-charcoal/10 flex flex-col gap-1.5 sm:gap-2 shrink-0">
              <div>
                <div className="flex items-center justify-between text-[0.5625rem] sm:text-[0.6875rem] font-mono mb-1">
                  <span className="text-charcoal/60 uppercase tracking-wider">
                    CURRICULUM STAGES
                  </span>
                  <span className="text-clay font-medium">
                    {Math.round(((activeChapterIndex + 1) / chapters.length) * 100)}% COMPLETE
                  </span>
                </div>

                {/* 4 Interactive Stepper Segments */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {chapters.map((ch, idx) => {
                    const isActive = idx === activeChapterIndex;
                    const isPassed = idx < activeChapterIndex;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => jumpToStage(idx)}
                        className="group text-left cursor-pointer focus:outline-hidden"
                        title={`Click to jump to ${ch.code}: ${ch.title}`}
                      >
                        <div
                          className={`h-1 sm:h-1.5 transition-all duration-200 ${
                            isActive
                              ? "bg-clay ring-2 ring-clay/20"
                              : isPassed
                              ? "bg-charcoal/60"
                              : "bg-charcoal/15 group-hover:bg-charcoal/30"
                          }`}
                        />
                        <span
                          className={`block mt-0.5 sm:mt-1 text-[0.5625rem] sm:text-[0.625rem] font-mono transition-colors truncate ${
                            isActive
                              ? "text-clay font-bold"
                              : isPassed
                              ? "text-charcoal/80"
                              : "text-charcoal/40 group-hover:text-charcoal/70"
                          }`}
                        >
                          {String(idx + 1).padStart(2, "0")} {ch.code.replace("ARC-", "")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action row with CTA link */}
              <div className="pt-0.5 flex items-center justify-between gap-2">
                <span className="text-[0.5625rem] sm:text-[0.6875rem] font-mono text-charcoal/50 truncate">
                  SCROLL TO EXPAND ↓
                </span>
                {activeChapter.href && (
                  <Link
                    href={activeChapter.href}
                    className="action-secondary py-0.5 text-[0.6875rem] sm:text-xs font-mono font-medium text-clay hover:underline uppercase tracking-wider shrink-0"
                  >
                    View Syllabus →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Progress Footnote - Mobile Compact */}
        <footer className="relative z-20 h-6 sm:h-8 shrink-0 flex items-center justify-between text-[0.5625rem] sm:text-[0.6875rem] font-mono text-charcoal/50 border-t border-charcoal/10 pt-1.5 sm:pt-2">
          <span className="truncate">SAWY ACADEMY // ARCHITECTURAL ATELIER</span>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden sm:inline">ELEVATION: {activeChapter.datum}</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-clay font-medium">{activeChapter.code}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
