"use client";

import { useEffect, useRef } from "react";
import { MediaBay } from "@/components/decorative/MediaBay";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import type { MediaFallbackKind } from "@/components/decorative/MediaFallbackSketch";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { gsap, registerGsap } from "@/lib/gsap/config";
import { createHorizontalScrollId } from "@/lib/gsap/horizontalSections";
import { scheduleScrollRefresh } from "@/lib/gsap/refresh";
import type { ProjectCategory } from "@/lib/api/types";

interface ProjectGalleryStoryProps {
  images: string[];
  title: string;
  category: ProjectCategory | string;
  year: string;
  sheetRef?: string;
  fallback?: MediaFallbackKind;
  className?: string;
}

/** Minimum plates so the pin scrub always has a walkthrough, even with a short gallery. */
const MIN_GALLERY_PLATES = 4;

/** Cycle distinct drafting sketches when a plate has no image (or the asset 404s). */
const PLATE_FALLBACKS: MediaFallbackKind[] = [
  "plan",
  "service",
  "research",
  "product",
  "course",
  "portrait",
];

function buildGalleryPlates(images: string[]): string[] {
  const plates = images.map((src) => src.trim()).filter(Boolean);
  while (plates.length < MIN_GALLERY_PLATES) {
    plates.push("");
  }
  return plates;
}

function plateFallback(
  index: number,
  preferred?: MediaFallbackKind
): MediaFallbackKind {
  if (preferred && index === 0) return preferred;
  return PLATE_FALLBACKS[index % PLATE_FALLBACKS.length];
}

function plateLabel(index: number, total: number): string {
  return `PLATE ${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
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

function ProjectCopyPanel({
  title,
  category,
  year,
  sheetRef,
}: {
  title: string;
  category: string;
  year: string;
  sheetRef?: string;
}) {
  return (
    <div className="flex w-full flex-col justify-start gap-5 lg:h-full lg:min-h-[min(52svh,28rem)] lg:flex-row lg:items-center lg:justify-center lg:gap-12">
      <div className="hairline-border w-full max-w-sm shrink-0 p-4 sm:p-6 lg:p-8">
        <ScaleBar scale="1:50" className="mb-4 max-w-[100px] sm:mb-6 sm:max-w-[120px]" />
        <div className="space-y-4 sm:space-y-6">
          <div>
            <p className="label-caps mb-1.5 sm:mb-2">Sheet</p>
            <p className="dim-label !text-base">{sheetRef || "—"}</p>
          </div>
          <div className="hairline-t pt-4 sm:pt-6">
            <p className="label-caps mb-1.5 sm:mb-2">Project</p>
            <p className="type-title text-xl">{title}</p>
          </div>
          <div className="hairline-t grid grid-cols-2 gap-4 pt-4 sm:gap-6 sm:pt-6">
            <div>
              <p className="label-caps mb-1.5 sm:mb-2">Category</p>
              <p className="type-infill">{category}</p>
            </div>
            <div>
              <p className="label-caps mb-1.5 sm:mb-2">Year</p>
              <p className="type-infill">{year}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="type-lead max-w-xl text-pretty">
        {category} project from the {year} drawing set.
        {sheetRef
          ? ` Sheet ${sheetRef} documents the built work within the academy portfolio index.`
          : " This sheet documents the built work within the academy portfolio index."}
      </p>
    </div>
  );
}

/**
 * Pinned drawing-set walkthrough: scrub through gallery plates, then land
 * on the project description panel in the same scroll sequence.
 */
export function ProjectGalleryStory({
  images,
  title,
  category,
  year,
  sheetRef,
  fallback = "plan",
  className = "",
}: ProjectGalleryStoryProps) {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const plates = buildGalleryPlates(images);
  const imageKey = plates.join("|");

  useEffect(() => {
    if (reduced) return;
    registerGsap();
    const media = gsap.matchMedia();

    media.add("(min-width: 0px)", () => {
      const pin = pinRef.current;
      const track = trackRef.current;
      const progress = progressRef.current;
      if (!pin || !track) return;

      const viewport = track.parentElement;
      if (!viewport) return;

      const getScroll = () =>
        Math.max(0, track.scrollWidth - viewport.clientWidth);

      gsap.set(track, { x: 0, force3D: true });
      if (progress) gsap.set(progress, { scaleX: 0 });

      const panelCount = plates.length + 1;
      const horizontalId = createHorizontalScrollId("project-story");

      const tween = gsap.to(track, {
        x: () => -getScroll(),
        ease: "none",
        scrollTrigger: {
          id: horizontalId,
          trigger: pin,
          start: () => `top ${getNavOffsetPx()}`,
          end: () =>
            `+=${Math.max(
              getScroll() * 1.2,
              viewport.clientWidth * panelCount * 0.55
            )}`,
          pin: true,
          scrub: true,
          snap: {
            snapTo: 1 / Math.max(panelCount - 1, 1),
            duration: 0.2,
            ease: "power1.inOut",
          },
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (!progress) return;
            progress.style.transform = `scaleX(${self.progress})`;
          },
        },
      });

      const onLoad = () => scheduleScrollRefresh(120);
      const imgs = Array.from(track.querySelectorAll("img"));
      imgs.forEach((img) => {
        if (!img.complete) img.addEventListener("load", onLoad, { once: true });
      });
      scheduleScrollRefresh(120);

      return () => {
        imgs.forEach((img) => img.removeEventListener("load", onLoad));
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(track, { clearProps: "transform" });
        if (progress) progress.style.transform = "scaleX(0)";
        scheduleScrollRefresh();
      };
    });

    return () => media.revert();
  }, [reduced, imageKey, plates.length]);

  if (reduced) {
    return (
      <div className={`space-y-10 ${className}`}>
        <ul
          className="grid grid-cols-1 gap-6 sm:grid-cols-2"
          aria-label={`${title} image gallery`}
        >
          {plates.map((src, index) => (
            <li key={`plate-${index}-${src || "placeholder"}`}>
              <figure>
                <MediaBay
                  src={src || null}
                  alt={
                    src
                      ? `${title}, image ${index + 1}`
                      : `${title}, placeholder plate ${index + 1}`
                  }
                  className="aspect-[4/3] sm:aspect-[4/5]"
                  fallback={plateFallback(index, fallback)}
                  fallbackLabel={plateLabel(index, plates.length)}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                />
                <figcaption className="label-caps mt-3 text-charcoal-infill">
                  Plate {String(index + 1).padStart(2, "0")} /{" "}
                  {String(plates.length).padStart(2, "0")}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
        <ProjectCopyPanel
          title={title}
          category={category}
          year={year}
          sheetRef={sheetRef}
        />
      </div>
    );
  }

  return (
    <div className={`project-gallery-story ${className}`}>
      <div
        ref={pinRef}
        data-scroll-axis="x"
        className="relative flex h-[calc(100svh-var(--nav-height))] w-full flex-col overscroll-x-contain"
      >
        {/*
          Side padding keeps plate 01 centered at scrub progress 0.
          Do not use justify-center on the pin — that centers the whole
          wide track and lands mid-gallery before any scroll.
        */}
        <div className="relative flex min-h-0 flex-1 items-center overflow-hidden">
          <div
            ref={trackRef}
            className="flex w-max flex-row items-center gap-6 pl-[5vw] pr-[5vw] will-change-transform sm:gap-8 lg:gap-10"
            aria-label={`${title} drawing set`}
          >
            {plates.map((src, index) => (
              <figure
                key={`plate-${index}-${src || "placeholder"}`}
                data-story-plate
                className="flex w-[min(90vw,calc((100svh-var(--nav-height)-5.5rem)*1.6))] shrink-0 flex-col"
              >
                <MediaBay
                  src={src || null}
                  alt={
                    src
                      ? `${title}, image ${index + 1}`
                      : `${title}, placeholder plate ${index + 1}`
                  }
                  className="aspect-[16/10] w-full"
                  fallback={plateFallback(index, fallback)}
                  fallbackLabel={plateLabel(index, plates.length)}
                  morph={Boolean(src) && index === 0}
                  sizes="90vw"
                />
                <figcaption className="label-caps mt-3 shrink-0 text-charcoal-infill">
                  Plate {String(index + 1).padStart(2, "0")} /{" "}
                  {String(plates.length).padStart(2, "0")}
                </figcaption>
              </figure>
            ))}

            <div
              className="flex w-[min(92vw,48rem)] shrink-0 items-start overflow-y-auto bg-concrete px-4 py-5 sm:w-[min(88vw,56rem)] sm:items-center sm:px-8 sm:py-6 lg:w-[min(72vw,60rem)]"
              data-story-copy
            >
              <ProjectCopyPanel
                title={title}
                category={category}
                year={year}
                sheetRef={sheetRef}
              />
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none flex shrink-0 justify-center pb-3 pt-4 sm:pb-4 sm:pt-5"
          aria-hidden="true"
        >
          <div className="h-px w-16 overflow-hidden bg-hairline sm:w-20">
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
