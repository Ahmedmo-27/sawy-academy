"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, registerGsap } from "@/lib/gsap/config";
import { scheduleScrollRefresh } from "@/lib/gsap/refresh";
import { getLenis } from "@/lib/smoothScroll";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const PANEL_COUNT = 6;

const routeNames: Record<string, string> = {
  "/": "Home",
  "/about": "About",
  "/portfolio": "Portfolio",
  "/courses": "Courses",
  "/products": "Products",
  "/researches": "Research",
  "/services": "Services",
  "/contact": "Contact",
  "/cart": "Cart",
  "/login": "Account",
  "/dashboard": "Dashboard",
};

function destinationName(pathname: string): string {
  const exact = routeNames[pathname];
  if (exact) return exact;

  const root = `/${pathname.split("/").filter(Boolean)[0] ?? ""}`;
  if (routeNames[root]) return routeNames[root];

  const segment = pathname.split("/").filter(Boolean).at(-1);
  if (!segment) return "Home";

  try {
    return decodeURIComponent(segment)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch {
    return "Sawy Academy";
  }
}

/**
 * Cipher-inspired column curtain, redrawn as an architectural sheet transition.
 * It intercepts public, same-origin links and keeps the destination covered until
 * the App Router has committed the next page.
 */
export function PageTransition() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const fallbackRef = useRef<number | null>(null);
  const previousPathRef = useRef<string | null>(null);
  const [destination, setDestination] = useState("Sawy Academy");
  const pathname = usePathname();
  const router = useRouter();
  const reduced = useReducedMotion();

  const reveal = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const panels = overlay.querySelectorAll<HTMLElement>("[data-page-panel]");
    const label = overlay.querySelector<HTMLElement>("[data-page-label]");
    const rule = overlay.querySelector<HTMLElement>("[data-page-rule]");

    if (fallbackRef.current !== null) {
      window.clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(overlay, {
          autoAlpha: 0,
          pointerEvents: "none",
        });
        busyRef.current = false;
        getLenis()?.start();
        scheduleScrollRefresh();
      },
    });

    tl.to([label, rule], {
      autoAlpha: 0,
      y: -10,
      duration: 0.18,
      ease: "power2.in",
    })
      .set(panels, { transformOrigin: "50% 0%" })
      .to(
        panels,
        {
          scaleY: 0,
          duration: 0.48,
          stagger: { each: 0.045, from: "end" },
          ease: "power3.inOut",
        },
        0.08
      );
  };

  useEffect(() => {
    previousPathRef.current = pathname;
  }, []);

  useEffect(() => {
    if (!busyRef.current || previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;

    // Two frames let the new route paint while it is still hidden by the curtain.
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(reveal);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (reduced) return;
    registerGsap();

    const overlay = overlayRef.current;
    if (!overlay) return;

    const panels = overlay.querySelectorAll<HTMLElement>("[data-page-panel]");
    const label = overlay.querySelector<HTMLElement>("[data-page-label]");
    const rule = overlay.querySelector<HTMLElement>("[data-page-rule]");

    gsap.set(overlay, { autoAlpha: 0, pointerEvents: "none" });
    gsap.set(panels, { scaleY: 0, transformOrigin: "50% 100%" });

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        busyRef.current
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.dataset.noTransition !== undefined
      ) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.protocol !== window.location.protocol ||
        url.pathname.startsWith("/admin") ||
        (url.pathname === window.location.pathname &&
          url.search === window.location.search)
      ) {
        return;
      }

      // In-page anchors should retain their native scrolling behavior.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash
      ) {
        return;
      }

      event.preventDefault();
      busyRef.current = true;
      const routePathWillChange = url.pathname !== window.location.pathname;
      setDestination(destinationName(url.pathname));
      getLenis()?.stop();

      gsap.killTweensOf([overlay, panels, label, rule]);
      gsap.set(overlay, {
        autoAlpha: 1,
        pointerEvents: "auto",
      });
      gsap.set(panels, {
        scaleY: 0,
        transformOrigin: "50% 100%",
      });
      gsap.set(label, { autoAlpha: 0, y: 12 });
      gsap.set(rule, { autoAlpha: 1, scaleX: 0, transformOrigin: "0% 50%" });

      gsap
        .timeline({
          onComplete: () => {
            router.push(`${url.pathname}${url.search}${url.hash}`, {
              scroll: true,
            });

            // Query-only navigation does not update usePathname.
            fallbackRef.current = window.setTimeout(
              reveal,
              routePathWillChange ? 1800 : 180
            );
          },
        })
        .to(panels, {
          scaleY: 1,
          duration: 0.46,
          stagger: 0.045,
          ease: "power3.inOut",
        })
        .to(
          label,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.28,
            ease: "power2.out",
          },
          0.28
        )
        .to(
          rule,
          {
            scaleX: 1,
            duration: 0.38,
            ease: "power2.out",
          },
          0.3
        );
    };

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      if (fallbackRef.current !== null) {
        window.clearTimeout(fallbackRef.current);
      }
      gsap.killTweensOf([overlay, panels, label, rule]);
      getLenis()?.start();
    };
  }, [reduced, router]);

  if (reduced) return null;

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-[290] invisible"
      aria-hidden="true"
    >
      <div className="absolute inset-0 grid grid-cols-6">
        {Array.from({ length: PANEL_COUNT }, (_, index) => (
          <div
            key={index}
            data-page-panel
            className={`relative h-full will-change-transform ${
              index % 2 === 0 ? "bg-charcoal" : "bg-charcoal-muted"
            }`}
          >
            <span className="absolute inset-y-0 right-0 w-px bg-concrete/10" />
            <span className="absolute left-3 top-3 font-sans text-[9px] tracking-[0.2em] text-concrete/30 sm:left-4 sm:top-4">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>

      <div
        data-page-label
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      >
        <p className="mb-3 font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-clay-muted sm:text-xs">
          Sawy Academy
        </p>
        <p className="font-serif text-3xl font-light text-concrete sm:text-5xl">
          {destination}
        </p>
        <span
          data-page-rule
          className="mt-6 block h-px w-20 bg-clay-muted sm:w-28"
        />
      </div>

      <span className="absolute bottom-5 left-5 font-sans text-[9px] uppercase tracking-[0.24em] text-concrete/35 sm:bottom-7 sm:left-8">
        Drawing the next space
      </span>
    </div>
  );
}
