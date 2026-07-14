"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface BlueprintMorphImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  objectPosition?: string;
  revealOnLoad?: boolean;
}

function WireframeOverlay() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <rect x="40" y="40" width="320" height="420" stroke="var(--color-concrete)" strokeWidth="1" opacity="0.9" />
      <path d="M40 200 H200 V40 H360 V460 H40" stroke="var(--color-concrete)" strokeWidth="0.75" opacity="0.7" />
      <path d="M200 40 V460" stroke="var(--color-concrete)" strokeWidth="0.5" strokeDasharray="6 4" opacity="0.6" />
      <path d="M40 380 H160" stroke="#d4d0c8" strokeWidth="0.5" opacity="0.8" />
      <circle cx="300" cy="120" r="24" stroke="#d4d0c8" strokeWidth="0.5" opacity="0.5" />
      <path
        d="M80 420 L120 400 L160 420 L120 440 Z"
        stroke="var(--color-clay)"
        strokeWidth="0.5"
        opacity="0.6"
      />
    </svg>
  );
}

export function BlueprintMorphImage({
  src,
  alt,
  className = "",
  sizes = "100vw",
  priority = false,
  objectPosition = "center",
  revealOnLoad = false,
}: BlueprintMorphImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const wireRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    registerGsap();
    const wrap = wrapRef.current;
    const img = imgRef.current;
    const wire = wireRef.current;
    if (!wrap || !img || !wire) return;

    const playReveal = () => {
      gsap.set(img, { scale: 0.95, force3D: true });
      gsap.set(wire, { opacity: 1 });

      const tl = gsap.timeline();
      tl.to(wire, { opacity: 0, duration: 0.75, ease: "power2.inOut" }, 0.35).to(
        img,
        { scale: 1, duration: 0.85, ease: "power2.out" },
        0.2
      );

      return tl;
    };

    if (revealOnLoad || priority) {
      const tl = playReveal();
      return () => {
        tl?.kill();
      };
    }

    gsap.set(img, { scale: 1, force3D: true });
    gsap.set(wire, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: "top 92%",
        toggleActions: "play none none none",
        once: true,
      },
    });

    tl.set(img, { scale: 0.95, force3D: true })
      .set(wire, { opacity: 1 })
      .to(wire, { opacity: 0, duration: 0.75, ease: "power2.inOut" }, 0.35)
      .to(img, { scale: 1, duration: 0.85, ease: "power2.out" }, 0.2);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [reduced, priority, revealOnLoad]);

  return (
    <div
      ref={wrapRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
    >
      <div ref={imgRef} className="absolute inset-0 will-change-transform">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          style={{ objectPosition }}
          sizes={sizes}
          priority={priority}
        />
      </div>
      {!reduced && (
        <div
          ref={wireRef}
          className="absolute inset-0 bg-charcoal/40 opacity-0 will-change-transform pointer-events-none"
        >
          <WireframeOverlay />
        </div>
      )}
    </div>
  );
}
