"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap/config";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface PinScrubStatItem {
  value: string;
  label: string;
  detail?: string;
  meta?: string;
  image?: string;
  imageAlt?: string;
  href?: string;
  linkLabel?: string;
}

interface PinScrubStatsProps {
  items: PinScrubStatItem[];
  className?: string;
}

/**
 * Pin set-piece with continuous card motion — short pin distance so
 * scroll never feels stuck between transitions.
 */
export function PinScrubStats({ items, className = "" }: PinScrubStatsProps) {
  const pinRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || items.length < 2) return;
    registerGsap();
    const pin = pinRef.current;
    const cards = cardsRef.current;
    const progress = progressRef.current;
    if (!pin || !cards) return;

    const cardEls = Array.from(
      cards.querySelectorAll<HTMLElement>("[data-scrub-card]")
    );
    if (cardEls.length < 2) return;

    const mm = gsap.matchMedia();

    const setup = (opts: {
      rotate: number;
      enterOffset: number;
      exitOffset: number;
      depth: number;
      /** Viewport-heights of scroll per card (hold + transition). */
      vhPerCard: number;
      /** Extra scroll after the last card settles. */
      vhSettle: number;
    }) => {
      const CENTER = -50;
      const EXIT_LEFT = CENTER - opts.exitOffset;
      const ENTER_RIGHT = CENTER + opts.enterOffset;
      const n = cardEls.length;

      gsap.set(cardEls, {
        transformPerspective: 1100,
        transformOrigin: "50% 50%",
        top: "50%",
        left: "50%",
        yPercent: -50,
      });

      cardEls.forEach((card, i) => {
        const detail = card.querySelector<HTMLElement>("[data-scrub-detail]");
        const isActive = i === 0;
        gsap.set(card, {
          rotateY: isActive ? 0 : opts.rotate,
          xPercent: isActive ? CENTER : ENTER_RIGHT,
          z: isActive ? 0 : -opts.depth,
          opacity: isActive ? 1 : 0,
          scale: isActive ? 1 : 0.92,
          zIndex: isActive ? n : 0,
        });
        if (detail) {
          gsap.set(detail, {
            opacity: isActive ? 1 : 0,
            y: isActive ? 0 : 10,
          });
        }
      });

      // Continuous timeline: no empty hold tweens — every scroll px moves cards.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () =>
            `+=${Math.round(
              window.innerHeight *
                (opts.vhPerCard * (n - 1) + opts.vhSettle)
            )}`,
          pin: true,
          scrub: 0.35,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (!progress) return;
            progress.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      cardEls.forEach((card, i) => {
        if (i === 0) return;
        const prev = cardEls[i - 1];
        const prevDetail =
          prev.querySelector<HTMLElement>("[data-scrub-detail]");
        const nextDetail =
          card.querySelector<HTMLElement>("[data-scrub-detail]");
        // Hold on the active card, then transition — linger before leaving.
        const hold = 0.45;
        const start = (i - 1) * (1 + hold) + hold;

        tl.set(card, { zIndex: n + i }, start);
        tl.set(prev, { zIndex: 0 }, start);

        tl.to(
          prev,
          {
            rotateY: -opts.rotate,
            xPercent: EXIT_LEFT,
            z: -opts.depth,
            opacity: 0,
            scale: 0.92,
            ease: "none",
            duration: 1,
          },
          start
        );
        if (prevDetail) {
          tl.to(
            prevDetail,
            { opacity: 0, y: 8, ease: "none", duration: 0.45 },
            start
          );
        }
        tl.fromTo(
          card,
          {
            rotateY: opts.rotate,
            xPercent: ENTER_RIGHT,
            z: -opts.depth,
            opacity: 0,
            scale: 0.92,
          },
          {
            rotateY: 0,
            xPercent: CENTER,
            z: 0,
            opacity: 1,
            scale: 1,
            ease: "none",
            duration: 1,
          },
          start
        );
        if (nextDetail) {
          tl.fromTo(
            nextDetail,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, ease: "none", duration: 0.55 },
            start + 0.2
          );
        }
      });

      // Brief settle on the last card before unpinning.
      tl.to({}, { duration: 0.45 });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        gsap.set(cardEls, { clearProps: "all" });
        if (progress) progress.style.transform = "scaleX(0)";
      };
    };

    mm.add("(max-width: 767px)", () =>
      setup({
        rotate: 10,
        enterOffset: 100,
        exitOffset: 100,
        depth: 70,
        vhPerCard: 1.05,
        vhSettle: 0.45,
      })
    );
    mm.add("(min-width: 768px)", () =>
      setup({
        rotate: 22,
        enterOffset: 110,
        exitOffset: 110,
        depth: 140,
        vhPerCard: 1.15,
        vhSettle: 0.5,
      })
    );

    return () => {
      mm.revert();
      ScrollTrigger.refresh();
    };
  }, [reduced, items]);

  if (!items.length) return null;

  return (
    <div ref={pinRef} className={`pin-scrub-stats ${className}`}>
      <div className="relative h-dvh overflow-hidden">
        <div
          ref={cardsRef}
          className="absolute inset-x-0 mx-auto min-h-0 w-full max-w-6xl px-3 sm:px-6 lg:px-8"
          style={{
            top: "calc(var(--nav-height) + 0.75rem + env(safe-area-inset-top, 0px))",
            bottom: "max(2.5rem, env(safe-area-inset-bottom, 0px))",
            perspective: "1600px",
          }}
        >
          {items.map((item, i) => (
            <article
              key={`${item.label}-${i}`}
              data-scrub-card
              className="absolute flex h-[98%] w-[min(55rem,100%)] flex-col overflow-hidden border border-hairline bg-concrete will-change-transform"
            >
              {item.image ? (
                <div className="relative min-h-0 w-full flex-[1.15] overflow-hidden border-b border-hairline bg-concrete-dark">
                  <Image
                    src={item.image}
                    alt={item.imageAlt || item.label}
                    fill
                    sizes="(max-width: 768px) 100vw, min(52rem, 100vw)"
                    className="object-cover"
                    priority={i === 0}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-concrete via-transparent to-transparent opacity-80"
                    aria-hidden="true"
                  />
                </div>
              ) : null}

              <div className="shrink-0 px-4 py-4 sm:px-7 sm:py-6 lg:px-8 lg:py-7 [@media(max-height:720px)]:px-4 [@media(max-height:720px)]:py-3">
                <p className="type-display text-clay mb-1.5 sm:mb-2 [@media(max-height:720px)]:mb-1">
                  {item.value}
                </p>
                <p className="label-caps text-charcoal-infill mb-3 sm:mb-4 [@media(max-height:720px)]:mb-2">
                  {item.label}
                </p>

                <div data-scrub-detail className="space-y-2 sm:space-y-3">
                  {item.meta ? (
                    <p className="type-title text-charcoal">{item.meta}</p>
                  ) : null}
                  {item.detail ? (
                    <p className="type-body max-w-xl text-charcoal-infill line-clamp-3 [@media(max-height:720px)]:line-clamp-2">
                      {item.detail}
                    </p>
                  ) : null}
                  {item.href && item.linkLabel ? (
                    <Link
                      href={item.href}
                      className="action-secondary mt-1 inline-flex sm:mt-2"
                    >
                      {item.linkLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Progress rail — shows scroll is advancing during the pin */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-6 sm:bottom-4"
          aria-hidden="true"
        >
          <div className="h-px w-full max-w-xs overflow-hidden bg-hairline sm:max-w-sm">
            <div
              ref={progressRef}
              className="h-full w-full origin-left bg-clay/60"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
