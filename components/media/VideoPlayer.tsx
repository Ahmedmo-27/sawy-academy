"use client";

import { useEffect, useId, useMemo, useState } from "react";

interface VideoPlayerProps {
  embedUrl: string;
  title: string;
  watermarkText: string;
}

const WATERMARK_POSITIONS = [
  "left-[5%] top-[8%]",
  "right-[5%] top-[12%]",
  "left-[8%] top-[58%]",
  "right-[8%] top-[54%]",
] as const;

function safeYouTubeEmbedUrl(value: string, autoplay: boolean) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "www.youtube-nocookie.com" ||
      !/^\/embed\/[A-Za-z0-9_-]{11}$/.test(url.pathname)
    ) {
      return null;
    }

    url.searchParams.set("modestbranding", "1");
    url.searchParams.set("rel", "0");
    url.searchParams.set("disablekb", "0");
    url.searchParams.set("fs", "1");
    if (autoplay) url.searchParams.set("autoplay", "1");
    return url.toString();
  } catch {
    return null;
  }
}

export function VideoPlayer({
  embedUrl,
  title,
  watermarkText,
}: VideoPlayerProps) {
  const headingId = useId();
  const [activated, setActivated] = useState(false);
  const [watermarkPosition, setWatermarkPosition] = useState(0);
  const playerUrl = useMemo(
    () => safeYouTubeEmbedUrl(embedUrl, activated),
    [embedUrl, activated]
  );

  useEffect(() => {
    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reducedMotion) return;

    const interval = window.setInterval(() => {
      setWatermarkPosition((current) => {
        let next = Math.floor(Math.random() * WATERMARK_POSITIONS.length);
        if (next === current) {
          next = (current + 1) % WATERMARK_POSITIONS.length;
        }
        return next;
      });
    }, 45_000);

    return () => window.clearInterval(interval);
  }, []);

  if (!playerUrl) {
    return (
      <div className="hairline-border p-6 type-infill" role="alert">
        This recording is temporarily unavailable.
      </div>
    );
  }

  return (
    <section aria-labelledby={headingId}>
      <p id={headingId} className="label-caps mb-3">
        Lesson recording
      </p>

      <div
        className="relative aspect-video w-full overflow-hidden bg-charcoal select-none"
        draggable={false}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
        role="group"
        aria-label={`${title} protected video player`}
      >
        {activated ? (
          <>
            <iframe
              src={playerUrl}
              title={`${title} video`}
              className="absolute inset-0 h-full w-full border-0 bg-charcoal"
              loading="lazy"
              draggable={false}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />

            <div
              className="absolute inset-x-0 top-0 bottom-16 z-10"
              onContextMenu={(event) => event.preventDefault()}
              onDragStart={(event) => event.preventDefault()}
              draggable={false}
              aria-hidden="true"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <button
              type="button"
              className="action-primary min-h-11"
              onClick={() => setActivated(true)}
            >
              Load lesson recording
            </button>
          </div>
        )}

        <span
          className={`pointer-events-none absolute z-20 max-w-[70%] truncate font-sans text-xs text-concrete opacity-20 mix-blend-difference transition-[top,left,right] duration-1000 ${WATERMARK_POSITIONS[watermarkPosition]}`}
          aria-hidden="true"
        >
          {watermarkText}
        </span>
      </div>
    </section>
  );
}
