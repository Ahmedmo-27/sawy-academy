"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { MediaBay } from "@/components/decorative/MediaBay";
import type { MediaFallbackKind } from "@/components/decorative/MediaFallbackSketch";

interface MediaGalleryProps {
  images: string[];
  title: string;
  fallback?: MediaFallbackKind;
}

export function MediaGallery({
  images,
  title,
  fallback = "plan",
}: MediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [lightboxFailed, setLightboxFailed] = useState(false);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const activeImage = activeIndex === null ? null : images[activeIndex];

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setLightboxFailed(false);
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "Tab") {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href]"
        );
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current === null ? current : (current - 1 + images.length) % images.length
        );
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current === null ? current : (current + 1) % images.length
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      openerRef.current?.focus();
    };
  }, [activeIndex, images.length]);

  if (images.length === 0) return null;

  return (
    <>
      <ul
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-2 sm:overflow-visible"
        aria-label={`${title} image gallery`}
      >
        {images.map((src, index) => (
          <li
            key={`${src}-${index}`}
            className="w-[84vw] max-w-[28rem] shrink-0 snap-center sm:w-auto sm:max-w-none"
          >
            <figure>
              <button
                ref={index === activeIndex ? openerRef : undefined}
                type="button"
                className="block w-full cursor-zoom-in text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay"
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setActiveIndex(index);
                }}
                aria-label={`Open ${title} image ${index + 1} full screen`}
              >
                <MediaBay
                  src={src}
                  alt={`${title}, image ${index + 1}`}
                  className="aspect-[4/3] sm:aspect-[4/5]"
                  fallback={fallback}
                  sizes="(min-width: 1024px) 40vw, 84vw"
                />
              </button>
              <figcaption className="label-caps mt-3 text-charcoal-infill">
                Plate {String(index + 1).padStart(2, "0")} /{" "}
                {String(images.length).padStart(2, "0")}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {activeImage && activeIndex !== null && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[100] flex flex-col bg-charcoal/95 p-4 text-concrete sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveIndex(null);
          }}
        >
          <div className="flex min-h-11 items-center justify-between gap-4">
            <p id={titleId} className="label-caps text-concrete">
              {title} · {activeIndex + 1} / {images.length}
            </p>
            <button
              ref={closeRef}
              type="button"
              className="action-secondary min-h-11 px-3 text-concrete"
              onClick={() => setActiveIndex(null)}
            >
              Close
            </button>
          </div>

          <div className="relative my-4 min-h-0 flex-1">
            {lightboxFailed ? (
              <div className="grid h-full place-items-center hairline-border border-concrete/30">
                <p className="type-body text-concrete">
                  This image could not be displayed.
                </p>
              </div>
            ) : (
              <Image
                src={activeImage}
                alt={`${title}, full-screen image ${activeIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
                onError={() => setLightboxFailed(true)}
              />
            )}
          </div>

          {images.length > 1 && (
            <div className="flex justify-between gap-4">
              <button
                type="button"
                className="action-secondary min-h-11 px-3 text-concrete"
                onClick={() =>
                  setActiveIndex((activeIndex - 1 + images.length) % images.length)
                }
                aria-label="Previous image"
              >
                ← Previous
              </button>
              <button
                type="button"
                className="action-secondary min-h-11 px-3 text-concrete"
                onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
                aria-label="Next image"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
