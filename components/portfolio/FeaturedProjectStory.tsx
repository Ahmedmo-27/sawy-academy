"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, SplitText } from "@/lib/gsap/config";
import { createHorizontalScrollId } from "@/lib/gsap/horizontalSections";
import { scheduleScrollRefresh } from "@/lib/gsap/refresh";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Project } from "@/lib/api/types";

interface FeaturedProjectStoryProps {
  projects: Project[];
  totalProjects: number;
}

function getNavOffsetPx(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--nav-height")
    .trim();
  if (!raw) return 88;
  if (raw.endsWith("rem")) {
    const root =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return parseFloat(raw) * root;
  }
  return parseFloat(raw) || 88;
}

export function FeaturedProjectStory({
  projects,
  totalProjects,
}: FeaturedProjectStoryProps) {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const projectKey = projects.map((project) => project.id).join("-");

  useGSAP(
    () => {
      if (reduced || projects.length < 2) return;
      registerGsap();

      const media = gsap.matchMedia();

      media.add("(min-width: 1024px)", () => {
        const root = rootRef.current;
        const pin = pinRef.current;
        if (!root || !pin) return;

        const images = gsap.utils.toArray<HTMLElement>(
          "[data-story-image]",
          root
        );
        const copies = gsap.utils.toArray<HTMLElement>(
          "[data-story-copy]",
          root
        );
        const titles = gsap.utils.toArray<HTMLElement>(
          "[data-story-title]",
          root
        );
        const progress = root.querySelector<HTMLElement>(
          "[data-story-progress]"
        );
        const counter = root.querySelector<HTMLElement>("[data-story-counter]");
        const splits = titles.map((title) =>
          SplitText.create(title, {
            type: "lines",
            mask: "lines",
            aria: "auto",
          })
        );

        gsap.set(images, {
          autoAlpha: 0,
          scale: 1.06,
          clipPath: "inset(8% 0 8% 0)",
          force3D: true,
        });
        gsap.set(images[0], {
          autoAlpha: 1,
          scale: 1,
          clipPath: "inset(0% 0 0% 0)",
        });
        gsap.set(copies, { autoAlpha: 0, y: 28 });
        gsap.set(copies[0], { autoAlpha: 1, y: 0 });
        gsap.set(
          splits.slice(1).flatMap((split) => split.lines),
          { yPercent: 115 }
        );
        if (progress) gsap.set(progress, { scaleY: 0 });

        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: pin,
            start: () => `top ${getNavOffsetPx()}`,
            end: () =>
              `+=${Math.max(
                window.innerHeight * (projects.length - 1) * 0.85,
                1600
              )}`,
            pin: true,
            scrub: 0.65,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        for (let index = 1; index < projects.length; index += 1) {
          const position = index - 1;

          timeline
            .to(
              images[index - 1],
              {
                autoAlpha: 0,
                scale: 1.035,
                clipPath: "inset(0% 0 10% 0)",
                duration: 0.45,
              },
              position
            )
            .fromTo(
              images[index],
              {
                autoAlpha: 0,
                scale: 1.08,
                clipPath: "inset(100% 0 0% 0)",
              },
              {
                autoAlpha: 1,
                scale: 1,
                clipPath: "inset(0% 0 0% 0)",
                duration: 0.75,
              },
              position + 0.15
            )
            .to(
              copies[index - 1],
              { autoAlpha: 0, y: -24, duration: 0.3 },
              position
            )
            .fromTo(
              copies[index],
              { autoAlpha: 0, y: 28 },
              { autoAlpha: 1, y: 0, duration: 0.45 },
              position + 0.3
            )
            .to(
              splits[index].lines,
              { yPercent: 0, duration: 0.45, stagger: 0.035 },
              position + 0.3
            );

          if (counter) {
            timeline.call(
              () => {
                counter.textContent = String(index + 1).padStart(2, "0");
              },
              [],
              position + 0.45
            );
            timeline.call(
              () => {
                counter.textContent = String(index).padStart(2, "0");
              },
              [],
              position + 0.44
            );
          }
        }

        if (progress) {
          timeline.fromTo(
            progress,
            { scaleY: 0 },
            { scaleY: 1, duration: projects.length - 1 },
            0
          );
        }

        scheduleScrollRefresh();

        return () => {
          splits.forEach((split) => split.revert());
          scheduleScrollRefresh();
        };
      });

      media.add("(max-width: 1023px)", () => {
        const pin = rootRef.current?.querySelector<HTMLElement>(
          "[data-story-mobile-pin]"
        );
        const viewport = rootRef.current?.querySelector<HTMLElement>(
          "[data-story-mobile-viewport]"
        );
        const track = rootRef.current?.querySelector<HTMLElement>(
          "[data-story-mobile-track]"
        );
        const cards = gsap.utils.toArray<HTMLElement>(
          "[data-story-mobile-card]",
          rootRef.current
        );
        const mediaLayers = gsap.utils.toArray<HTMLElement>(
          "[data-story-mobile-media]",
          rootRef.current
        );
        const progress = rootRef.current?.querySelector<HTMLElement>(
          "[data-story-mobile-progress]"
        );
        if (!pin || !viewport || !track || cards.length === 0) return;

        gsap.fromTo(
          cards,
          { autoAlpha: 0, x: 48 },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.72,
            stagger: 0.09,
            ease: "power3.out",
            scrollTrigger: {
              trigger: viewport,
              start: "top 86%",
              once: true,
            },
          }
        );

        const getDistance = () =>
          Math.max(0, track.scrollWidth - viewport.clientWidth);
        const imageX = mediaLayers.map((layer) =>
          gsap.quickTo(layer, "xPercent", {
            duration: 0.35,
            ease: "power2.out",
          })
        );

        const updateSwipeMotion = () => {
          const viewportRect = viewport.getBoundingClientRect();
          const viewportCenter = viewportRect.left + viewportRect.width / 2;

          cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            const cardCenter = rect.left + rect.width / 2;
            const offset = (cardCenter - viewportCenter) / viewportRect.width;
            imageX[index]?.(gsap.utils.clamp(-7, 7, offset * -7));
          });
        };

        gsap.set(track, { x: 0, force3D: true });
        const horizontalId = createHorizontalScrollId("featured-mobile");
        const horizontalTween = gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
          scrollTrigger: {
            id: horizontalId,
            trigger: pin,
            start: () => `top ${getNavOffsetPx()}`,
            end: () =>
              `+=${Math.max(getDistance() * 0.9, window.innerHeight * 1.2)}`,
            pin: true,
            scrub: 0.45,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (progress) gsap.set(progress, { scaleX: self.progress });
              updateSwipeMotion();
            },
          },
        });
        updateSwipeMotion();
        scheduleScrollRefresh();

        return () => {
          horizontalTween.scrollTrigger?.kill();
          horizontalTween.kill();
          gsap.set(track, { clearProps: "transform" });
          if (progress) gsap.set(progress, { scaleX: 0 });
          scheduleScrollRefresh();
        };
      });

      return () => media.revert();
    },
    {
      scope: rootRef,
      dependencies: [projectKey, reduced],
      revertOnUpdate: true,
    }
  );

  if (projects.length === 0) return null;

  return (
    <section ref={rootRef} className="section-standard min-w-0 max-w-full">
      <div className="mb-6 flex items-end justify-between border-b border-charcoal pb-3">
        <div>
          <p className="eyebrow mb-2 text-clay">Selected work</p>
          <h2 className="font-serif text-2xl font-light sm:text-3xl">
            Project highlights
          </h2>
        </div>
        <p className="label-caps hidden sm:block">
          {String(totalProjects).padStart(2, "0")} projects · 01 archive
        </p>
      </div>

      <div
        ref={pinRef}
        className={reduced ? "hidden" : "hidden lg:block"}
      >
        <div className="grid h-[min(calc(100svh-var(--nav-height)-2rem),760px)] min-h-[580px] grid-cols-12 gap-10">
          <div className="relative col-span-8 overflow-hidden bg-charcoal">
            {projects.map((project, index) => (
              <div
                key={project.id}
                data-story-image
                className="invisible absolute inset-0 will-change-transform"
                aria-hidden={index === 0 ? undefined : true}
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover"
                  sizes="66vw"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/45 via-transparent to-charcoal/10" />
                <p className="label-caps absolute left-6 top-6 !text-concrete/80">
                  {project.sheetRef || `Project ${index + 1}`}
                </p>
              </div>
            ))}
          </div>

          <div className="relative col-span-4 flex min-w-0 flex-col border-t border-charcoal">
            <div className="flex items-center justify-between py-4">
              <p className="eyebrow">Featured sequence</p>
              <p className="dim-label tabular-nums">
                <span data-story-counter>01</span> /{" "}
                {String(projects.length).padStart(2, "0")}
              </p>
            </div>

            <div className="relative flex-1">
              {projects.map((project, index) => (
                <article
                  key={project.id}
                  data-story-copy
                  className="invisible absolute inset-0 flex flex-col justify-center will-change-transform"
                >
                  <p className="label-caps mb-5">
                    {project.category} · {project.year}
                  </p>
                  <h3
                    data-story-title
                    className="font-serif text-4xl font-light leading-[0.98] xl:text-5xl"
                  >
                    {project.title}
                  </h3>
                  <p className="type-infill mt-6 max-w-xs">
                    Sheet {project.sheetRef || String(index + 1).padStart(2, "0")}{" "}
                    from the academy&apos;s selected project archive.
                  </p>
                  <Link
                    href={`/portfolio/${project.slug}`}
                    className="action-primary mt-8 w-fit"
                  >
                    Explore project
                  </Link>
                </article>
              ))}
            </div>

            <div className="flex items-end gap-4 border-t border-hairline py-5">
              <div className="h-20 w-px overflow-hidden bg-hairline">
                <div
                  data-story-progress
                  className="h-full w-full origin-top bg-clay"
                />
              </div>
              <p className="label-caps max-w-[10rem] leading-relaxed">
                Scroll to explore the selected works
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        data-story-mobile-pin
        data-scroll-axis="x"
        className={reduced ? "lg:block" : "lg:hidden"}
      >
        <div
          data-story-mobile-viewport
          className={`overflow-hidden pb-2 ${
            reduced
              ? "overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : ""
          }`}
          aria-label="Featured projects"
        >
          <div
            data-story-mobile-track
            className="flex w-max gap-4 will-change-transform"
          >
            {projects.map((project, index) => (
              <Link
                key={project.id}
                href={`/portfolio/${project.slug}`}
                data-story-mobile-card
                className="group block w-[min(88vw,34rem)] min-w-0 shrink-0 overflow-hidden sm:w-[min(72vw,38rem)] md:w-[min(58vw,40rem)]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-concrete-dark sm:aspect-[16/10] md:aspect-[4/3]">
                  <div
                    data-story-mobile-media
                    className="absolute -inset-x-[8%] inset-y-0 will-change-transform"
                  >
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 639px) 88vw, (max-width: 767px) 72vw, 58vw"
                      priority={index === 0}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/55 via-transparent to-transparent" />
                  <p className="label-caps absolute left-5 top-5 !text-concrete/80">
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {String(projects.length).padStart(2, "0")}
                  </p>
                </div>
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-hairline py-4">
                  <div className="min-w-0">
                    <h3 className="font-serif text-xl font-light leading-tight sm:text-2xl">
                      {project.title}
                    </h3>
                    <p className="label-caps mt-2">
                      {project.category} · {project.year}
                    </p>
                  </div>
                  <span
                    className="text-2xl transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <p className="label-caps shrink-0">
            {reduced ? "Swipe projects" : "Scroll projects"}
          </p>
          <div className="h-px flex-1 overflow-hidden bg-hairline">
            <div
              data-story-mobile-progress
              className="h-full w-full origin-left bg-clay"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
          <p className="dim-label shrink-0">
            01—{String(projects.length).padStart(2, "0")}
          </p>
        </div>
      </div>
    </section>
  );
}
