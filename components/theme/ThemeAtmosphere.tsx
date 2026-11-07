"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap/config";
import { useTheme } from "@/lib/themes/ThemeProvider";

gsap.registerPlugin(useGSAP);

/**
 * Site-wide chrome that is not a recolor: a folio rail, a stamped yard
 * stripe, an orbital instrument, a newspaper issue rule, or a chapter scrub.
 */
export function ThemeAtmosphere() {
  const { theme } = useTheme();
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(root.querySelectorAll("[data-motif]"), {
          autoAlpha: 1,
          y: 0,
          x: 0,
          scale: 1,
          rotation: 0,
        });
      });
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const duration = theme.motion.duration;
        const ease = theme.motion.ease;

        if (theme.id === "obsidian") {
          gsap.from("[data-motif='folio']", {
            yPercent: 12,
            autoAlpha: 0,
            duration,
            ease,
          });
          gsap.to("[data-motif='folio-rule']", {
            scaleY: 1,
            duration: duration * 1.4,
            ease,
          });
        }

        if (theme.id === "corten") {
          gsap.from("[data-motif='stamp']", {
            y: -theme.motion.travel,
            autoAlpha: 0,
            duration,
            ease,
          });
          gsap.to("[data-motif='marquee']", {
            xPercent: -50,
            duration: 18,
            ease: "none",
            repeat: -1,
          });
        }

        if (theme.id === "instrument") {
          gsap.to("[data-motif='orbit']", {
            rotation: 360,
            duration: 28,
            ease: "none",
            repeat: -1,
            transformOrigin: "50% 50%",
          });
          gsap.from("[data-motif='orbit']", {
            scale: theme.motion.scaleFrom,
            autoAlpha: 0,
            duration,
            ease,
          });
        }

        if (theme.id === "ledger") {
          gsap.from("[data-motif='issue']", {
            clipPath: "inset(0 100% 0 0)",
            duration,
            ease,
          });
        }

        if (theme.id === "lecture") {
          gsap.from("[data-motif='chapter']", {
            autoAlpha: 0,
            y: theme.motion.travel * 0.4,
            duration,
            ease,
          });
          gsap.to("[data-motif='chapter-fill']", {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: 0,
              end: "max",
              scrub: 0.35,
            },
          });
        }

        if (theme.id === "atelier") {
          gsap.from("[data-motif='ticks']", {
            scaleX: 0,
            duration,
            ease,
            transformOrigin: "left center",
          });
        }
      });

      return () => mm.revert();
    },
    {
      scope: rootRef,
      dependencies: [theme.id],
      revertOnUpdate: true,
    }
  );

  return (
    <div
      ref={rootRef}
      className={`theme-atmosphere theme-atmosphere-${theme.id}`}
      aria-hidden="true"
    >
      {theme.id === "atelier" && (
        <div data-motif="ticks" className="theme-atelier-ticks" />
      )}
      {theme.id === "obsidian" && (
        <div data-motif="folio" className="theme-folio-rail">
          <span data-motif="folio-rule" className="theme-folio-rule" />
          <span className="theme-folio-label">Edition · Zamalek · Cairo</span>
        </div>
      )}
      {theme.id === "corten" && (
        <>
          <div data-motif="stamp" className="theme-yard-stamp">
            Yard 04 · Cairo
          </div>
          <div className="theme-yard-marquee">
            <div data-motif="marquee" className="theme-yard-marquee-track">
              <span>Corten yard · Hard cut · Studio fee · Online masterclass · </span>
              <span>Corten yard · Hard cut · Studio fee · Online masterclass · </span>
            </div>
          </div>
        </>
      )}
      {theme.id === "instrument" && (
        <svg
          data-motif="orbit"
          className="theme-orbit"
          viewBox="0 0 160 160"
          fill="none"
        >
          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="1" />
          <circle cx="80" cy="80" r="46" stroke="currentColor" strokeWidth="1" />
          <circle cx="80" cy="80" r="18" stroke="currentColor" strokeWidth="1" />
          <path d="M80 6 V154 M6 80 H154" stroke="currentColor" strokeWidth="1" />
          <circle cx="80" cy="10" r="3" fill="currentColor" />
        </svg>
      )}
      {theme.id === "ledger" && (
        <div data-motif="issue" className="theme-issue">
          <span>Vol. XII</span>
          <span>Zamalek</span>
          <span>Est. 2012</span>
          <span>The Sawy Ledger</span>
        </div>
      )}
      {theme.id === "lecture" && (
        <div data-motif="chapter" className="theme-chapter">
          <span className="theme-chapter-label">Chapter</span>
          <span className="theme-chapter-track">
            <span data-motif="chapter-fill" className="theme-chapter-fill" />
          </span>
        </div>
      )}
    </div>
  );
}
