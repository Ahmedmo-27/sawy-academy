"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { registerGsap } from "@/lib/gsap/config";

interface OrthographicSectionCutProps {
  renderSrc: string;
  renderAlt?: string;
  wireframeSrc?: string;
  wireframeAlt?: string;
  title?: string;
  aspectClass?: string;
  className?: string;
  defaultPosition?: number; // 0 to 100
}

/**
 * Interactive Architectural Section Cut Slider.
 * Slices between photorealistic built render and orthographic CAD section/wireframe.
 */
export function OrthographicSectionCut({
  renderSrc,
  renderAlt = "Architectural Render",
  wireframeSrc,
  wireframeAlt = "Orthographic Section Cut CAD",
  title = "SECTION CUT A-A // ORTHOGRAPHIC PROJECTION",
  aspectClass = "aspect-[16/10]",
  className = "",
  defaultPosition = 50,
}: OrthographicSectionCutProps) {
  const [sliderPos, setSliderPos] = useState(defaultPosition);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    registerGsap();
  }, []);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setSliderPos((p) => Math.max(5, p - 5));
    } else if (e.key === "ArrowRight") {
      setSliderPos((p) => Math.min(95, p + 5));
    }
  };

  return (
    <div className={`surface-card-elevated overflow-hidden ${className}`}>
      {/* Architectural title block header */}
      <div className="flex items-center justify-between border-b border-charcoal/10 bg-concrete px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-clay" />
          <span className="text-[11px] font-mono font-semibold tracking-wider text-charcoal uppercase">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-charcoal/70">
          <span className="hidden sm:inline">DRAG CUTTING PLANE</span>
          <span className="rounded bg-white px-2 py-0.5 border border-charcoal/10 font-semibold text-clay">
            {Math.round(sliderPos)}% CUT
          </span>
        </div>
      </div>

      {/* Main comparative viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative ${aspectClass} w-full cursor-ew-resize select-none overflow-hidden touch-none`}
      >
        {/* Under layer: Built Render */}
        <div className="absolute inset-0">
          <Image
            src={renderSrc}
            alt={renderAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 80vw"
            className="object-cover"
          />
          <div className="absolute bottom-3 right-3 rounded bg-charcoal/85 px-2.5 py-1 text-[11px] font-mono font-medium text-concrete shadow backdrop-blur-sm">
            BUILT RENDERING
          </div>
        </div>

        {/* Top layer: CAD Wireframe / Blueprint Cut */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          {wireframeSrc ? (
            <Image
              src={wireframeSrc}
              alt={wireframeAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 80vw"
              className="object-cover filter contrast-125"
            />
          ) : (
            /* Procedural architectural blueprint overlay when no secondary image is passed */
            <div className="absolute inset-0 bg-[#0E1524] flex items-center justify-center">
              <svg
                className="absolute inset-0 h-full w-full opacity-40"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="grid-cad"
                    width="24"
                    height="24"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 24 0 L 0 0 0 24"
                      fill="none"
                      stroke="#4F8FFF"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-cad)" />
              </svg>

              <Image
                src={renderSrc}
                alt={wireframeAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 80vw"
                className="object-cover opacity-20 filter invert grayscale"
              />

              <div className="relative z-10 text-center font-mono text-[#7CB2FF] p-6 max-w-md">
                <p className="text-xs uppercase tracking-widest text-[#A8CFFF] mb-2 font-semibold">
                  CAD ORTHOGRAPHIC POCHE CUT
                </p>
                <p className="text-[11px] text-[#7CB2FF]/80 leading-relaxed">
                  Solid-to-void Poche analysis · 1:50 Module Grid · Structural Bay Layout
                </p>
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-3 rounded bg-clay/90 px-2.5 py-1 text-[11px] font-mono font-medium text-concrete shadow backdrop-blur-sm">
            SECTION POCHE // CAD
          </div>
        </div>

        {/* Vertical Cutting Plane Divider Bar */}
        <div
          className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)]"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Draggable center datum handle */}
          <div
            tabIndex={0}
            role="slider"
            aria-label="Section cut position"
            aria-valuenow={Math.round(sliderPos)}
            aria-valuemin={5}
            aria-valuemax={95}
            onKeyDown={handleKeyDown}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-charcoal text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-clay"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
