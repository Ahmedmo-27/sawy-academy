"use client";

import { useRef, type ComponentType, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap/config";
import type { ThemeId } from "@/lib/themes/types";

gsap.registerPlugin(useGSAP);

function useMotif(
  ref: RefObject<HTMLDivElement | null>,
  animate: (nodes: HTMLElement[], reduced: boolean) => void
) {
  useGSAP(
    () => {
      registerGsap();
      const root = ref.current;
      if (!root) return;
      const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-signature]"));
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => animate(nodes, true));
      mm.add("(prefers-reduced-motion: no-preference)", () => animate(nodes, false));
      return () => mm.revert();
    },
    { scope: ref }
  );
}

function AtelierSignature() {
  const ref = useRef<HTMLDivElement>(null);
  useMotif(ref, (nodes, reduced) => {
    if (reduced) {
      gsap.to(nodes, { autoAlpha: 1, y: 0, scale: 1, rotation: 0, duration: 0 });
      return;
    }
    gsap.fromTo(
      nodes,
      { autoAlpha: 0, y: 10, scale: 0.35 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out", stagger: 0.035 }
    );
  });

  return (
    <div
      ref={ref}
      data-theme-slot="signature-atelier"
      className="theme-signature theme-signature-ticks"
      aria-hidden="true"
    >
      {Array.from({ length: 28 }, (_, index) => (
        <span
          key={index}
          data-signature="tick"
          className={index % 4 === 0 ? "theme-tick theme-tick-major" : "theme-tick"}
        />
      ))}
    </div>
  );
}

function ObsidianSignature() {
  const ref = useRef<HTMLDivElement>(null);
  useMotif(ref, (nodes, reduced) => {
    if (reduced) {
      gsap.to(nodes, { autoAlpha: 1, scale: 1, y: 0, rotation: 0, duration: 0 });
      return;
    }
    gsap.fromTo(
      nodes,
      { autoAlpha: 0, scale: 0.2, y: 8 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 1.05, ease: "power2.out" }
    );
  });

  return (
    <div
      ref={ref}
      data-theme-slot="signature-obsidian"
      className="theme-signature theme-signature-quote"
      aria-hidden="true"
    >
      <span data-signature="rule" className="theme-pull-rule" />
      <p className="font-serif text-xl italic">A folio line through the edition.</p>
    </div>
  );
}

function CortenSignature() {
  const ref = useRef<HTMLDivElement>(null);
  useMotif(ref, (nodes, reduced) => {
    if (reduced) {
      gsap.to(nodes, { autoAlpha: 1, y: 0, scale: 1, rotation: 0, duration: 0 });
      return;
    }
    gsap.fromTo(
      nodes,
      { autoAlpha: 0, y: -16, scale: 0.96 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.38, ease: "power4.out" }
    );
  });

  return (
    <div ref={ref} data-theme-slot="signature-corten" className="theme-signature" aria-hidden="true">
      <div data-signature="stamp" className="theme-signature-stamp">
        <span>Yard</span>
        <strong>Sawy</strong>
        <span>Inspected</span>
      </div>
    </div>
  );
}

function InstrumentSignature() {
  const ref = useRef<HTMLDivElement>(null);
  useMotif(ref, (nodes, reduced) => {
    if (reduced) {
      gsap.to(nodes, {
        autoAlpha: 1,
        rotation: 42,
        scale: 1,
        y: 0,
        duration: 0,
      });
      return;
    }
    gsap.fromTo(
      nodes,
      { autoAlpha: 0, rotation: -28, scale: 0.92 },
      {
        autoAlpha: 1,
        rotation: 42,
        scale: 1,
        duration: 1.15,
        ease: "sine.out",
        transformOrigin: "50% 50%",
      }
    );
  });

  return (
    <div
      ref={ref}
      data-theme-slot="signature-instrument"
      className="theme-signature theme-signature-dial"
      aria-hidden="true"
    >
      <svg data-signature="dial" className="theme-dial" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="31" stroke="currentColor" strokeWidth="1" />
        <circle cx="40" cy="40" r="20" stroke="currentColor" strokeWidth="1" />
        <path d="M40 40 L40 14" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="40" cy="40" r="2.2" fill="currentColor" />
        <path d="M40 9 L40 14 M67 40 L72 40 M40 66 L40 71 M8 40 L13 40" stroke="currentColor" />
      </svg>
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em]">Reading 00</p>
    </div>
  );
}

function LedgerSignature() {
  const ref = useRef<HTMLDivElement>(null);
  useMotif(ref, (nodes, reduced) => {
    if (reduced) {
      gsap.to(nodes, { autoAlpha: 1, scale: 1, y: 0, rotation: 0, duration: 0 });
      return;
    }
    gsap.fromTo(
      nodes,
      { autoAlpha: 0, scale: 0.15 },
      {
        autoAlpha: 1,
        scale: 1,
        duration: 0.9,
        ease: "power2.inOut",
        stagger: 0.08,
        transformOrigin: "0% 50%",
      }
    );
  });

  return (
    <div
      ref={ref}
      data-theme-slot="signature-ledger"
      className="theme-signature theme-signature-rules"
      aria-hidden="true"
    >
      <span data-signature="rule" className="theme-signature-rule theme-signature-rule-strong" />
      <span data-signature="rule" className="theme-signature-rule" />
    </div>
  );
}

function LectureSignature() {
  const ref = useRef<HTMLDivElement>(null);
  useMotif(ref, (nodes, reduced) => {
    if (reduced) {
      gsap.to(nodes, { autoAlpha: 1, y: 0, scale: 1, rotation: 0, duration: 0 });
      return;
    }
    gsap.fromTo(
      nodes,
      { autoAlpha: 0, y: 28, scale: 1.04 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 1.2, ease: "power3.inOut" }
    );
  });

  return (
    <div ref={ref} data-theme-slot="signature-lecture" className="theme-signature" aria-hidden="true">
      <p data-signature="mark" className="theme-chapter-mark">
        Chapter
      </p>
    </div>
  );
}

function ArabesqueSignature() {
  const ref = useRef<HTMLDivElement>(null);
  useMotif(ref, (nodes, reduced) => {
    if (reduced) {
      gsap.to(nodes, {
        autoAlpha: 1,
        scale: 1,
        rotation: 0,
        y: 0,
        duration: 0,
      });
      return;
    }
    gsap.fromTo(
      nodes,
      { autoAlpha: 0, scale: 0.84, rotation: -18 },
      {
        autoAlpha: 1,
        scale: 1,
        rotation: 0,
        duration: 1.05,
        ease: "sine.inOut",
        transformOrigin: "50% 50%",
      }
    );
  });

  return (
    <div
      ref={ref}
      data-theme-slot="signature-arabesque"
      className="theme-signature theme-signature-rosette"
      aria-hidden="true"
    >
      <svg data-signature="rosette" className="theme-signature-star" viewBox="0 0 120 120" fill="none">
        <polygon
          points="60,6 72,38 106,38 78,58 90,92 60,72 30,92 42,58 14,38 48,38"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <polygon
          points="60,24 68,46 92,46 73,59 81,82 60,69 39,82 47,59 28,46 52,46"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="60" cy="60" r="6" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}

function PharaonicSignature() {
  const ref = useRef<HTMLDivElement>(null);
  useMotif(ref, (nodes, reduced) => {
    if (reduced) {
      gsap.to(nodes, { autoAlpha: 1, scale: 1, y: 0, rotation: 0, duration: 0 });
      return;
    }
    gsap.fromTo(
      nodes,
      { autoAlpha: 0, scale: 0.2, y: 12 },
      {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        duration: 1.25,
        ease: "power1.inOut",
        stagger: 0.12,
        transformOrigin: "50% 100%",
      }
    );
  });

  return (
    <div
      ref={ref}
      data-theme-slot="signature-pharaonic"
      className="theme-signature theme-signature-shafts"
      aria-hidden="true"
    >
      <span data-signature="shaft" className="theme-signature-shaft" />
      <span data-signature="shaft" className="theme-signature-shaft" />
    </div>
  );
}

export const themeSignatures: Record<ThemeId, ComponentType> = {
  atelier: AtelierSignature,
  obsidian: ObsidianSignature,
  corten: CortenSignature,
  instrument: InstrumentSignature,
  ledger: LedgerSignature,
  lecture: LectureSignature,
  arabesque: ArabesqueSignature,
  pharaonic: PharaonicSignature,
};
