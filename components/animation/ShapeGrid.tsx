"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ShapeGridProps {
  className?: string;
  gridSize?: number;
  dotSize?: number;
  crosshairSize?: number;
  highlightRadius?: number;
  baseColor?: string;
  activeColor?: string;
}

export function ShapeGrid({
  className = "",
  gridSize = 36,
  crosshairSize = 4,
  highlightRadius = 140,
  baseColor = "rgba(139, 90, 74, 0.12)", // Warm clay subtle
  activeColor = "rgba(139, 90, 74, 0.75)", // Warm clay active
}: ShapeGridProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    const onPointerLeave = () => {
      targetMouseX = -1000;
      targetMouseY = -1000;
    };

    window.addEventListener("mousemove", onPointerMove);
    document.addEventListener("mouseleave", onPointerLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth lerp mouse
      mouseX += (targetMouseX - mouseX) * 0.12;
      mouseY += (targetMouseY - mouseY) * 0.12;

      const cols = Math.floor(width / gridSize) + 1;
      const rows = Math.floor(height / gridSize) + 1;

      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const x = c * gridSize;
          const y = r * gridSize;

          const dx = x - mouseX;
          const dy = y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let ratio = 0;
          if (!prefersReduced && dist < highlightRadius) {
            ratio = 1 - dist / highlightRadius;
            ratio = ratio * ratio; // quadratic ease
          }

          ctx.save();
          ctx.beginPath();

          // Draw architectural CAD crosshair
          const len = crosshairSize + ratio * 3;
          ctx.strokeStyle = ratio > 0.05 ? activeColor : baseColor;
          ctx.lineWidth = ratio > 0.05 ? 1 : 0.6;

          // Horizontal arm
          ctx.moveTo(x - len, y);
          ctx.lineTo(x + len, y);
          // Vertical arm
          ctx.moveTo(x, y - len);
          ctx.lineTo(x, y + len);

          ctx.stroke();

          // Coordinate dot in center for active nodes
          if (ratio > 0.25) {
            ctx.fillStyle = activeColor;
            ctx.beginPath();
            ctx.arc(x, y, 1 + ratio * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      if (!prefersReduced) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gridSize, crosshairSize, highlightRadius, baseColor, activeColor, prefersReduced]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full opacity-80" />
    </div>
  );
}
