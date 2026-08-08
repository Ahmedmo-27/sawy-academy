"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, SplitText } from "@/lib/gsap/config";
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
        const cards = gsap.utils.toArray<HTMLElement>(
          "[data-story-mobile-card]",
          rootRef.current
        );

        cards.forEach((card) => {
          gsap.fromTo(
            card,
            { autoAlpha: 0, y: 32 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              ease: "power2.out",
              scrollTrigger: {
                trigger: card,
                start: "top 88%",
                once: true,
              },
            }
          );
        });
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
        className={
          reduced
            ? "grid min-w-0 max-w-full grid-cols-1 gap-10"
            : "grid min-w-0 max-w-full grid-cols-1 gap-10 lg:hidden"
        }
      >
        {projects.map((project, index) => (
          <Link
            key={project.id}
            href={`/portfolio/${project.slug}`}
            data-story-mobile-card
            className="group block min-w-0 max-w-full overflow-hidden"
          >
            <div className="relative aspect-[4/3] w-full max-w-full overflow-hidden bg-concrete-dark sm:aspect-[16/10] md:aspect-[4/3]">
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                sizes="(max-width: 1023px) 100vw, 66vw"
                priority={index === 0}
              />
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
    </section>
  );
}
