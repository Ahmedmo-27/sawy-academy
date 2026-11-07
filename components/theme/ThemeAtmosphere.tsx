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

        if (theme.id === "arabesque") {
          gsap.from("[data-motif='rosette']", {
            scale: theme.motion.scaleFrom,
            rotation: -20,
            autoAlpha: 0,
            duration,
            ease,
            transformOrigin: "50% 50%",
          });
          gsap.to("[data-motif='rosette']", {
            rotation: 360,
            duration: 48,
            ease: "none",
            repeat: -1,
            transformOrigin: "50% 50%",
          });
          gsap.from("[data-motif='girih']", {
            scaleX: 0,
            duration: duration * 1.2,
            ease,
            transformOrigin: "center center",
          });
        }

        if (theme.id === "pharaonic") {
          gsap.from("[data-motif='shaft']", {
            scaleY: 0,
            duration: duration * 1.3,
            ease,
            transformOrigin: "top center",
            stagger: 0.12,
          });
          gsap.from("[data-motif='cartouche']", {
            clipPath: "inset(0 100% 0 0)",
            duration,
            ease,
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
      {theme.id === "arabesque" && (
        <>
          <svg
            data-motif="rosette"
            className="theme-rosette"
            viewBox="0 0 120 120"
            fill="none"
          >
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
          <div data-motif="girih" className="theme-girih" />
        </>
      )}
      {theme.id === "pharaonic" && (
        <div className="theme-pylon-frame">
          <span data-motif="shaft" className="theme-pylon-shaft theme-pylon-shaft-left" />
          <span data-motif="shaft" className="theme-pylon-shaft theme-pylon-shaft-right" />
          <div className="theme-cartouche-anchor">
            <span data-motif="cartouche" className="theme-cartouche">
              Nile · Cairo
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
