"use client";

import { useMemo, useState } from "react";

function safeVideoUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function embedUrl(url: URL): string | null {
  if (url.hostname === "youtu.be") {
    return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
  }
  if (url.hostname.endsWith("youtube.com")) {
    const id = url.searchParams.get("v");
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (url.hostname.endsWith("vimeo.com")) {
    const id = url.pathname.split("/").filter(Boolean).at(-1);
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

export function LessonVideo({
  videoUrl,
  title,
  poster,
}: {
  videoUrl: string;
  title: string;
  poster?: string;
}) {
  const [activated, setActivated] = useState(false);
  const url = useMemo(() => safeVideoUrl(videoUrl), [videoUrl]);
  const embed = useMemo(() => (url ? embedUrl(url) : null), [url]);
  const isDirectVideo = Boolean(
    url && /\.(mp4|webm|ogg)$/i.test(url.pathname)
  );

  if (!url) return null;

  return (
    <section className="mt-10 hairline-t pt-8" aria-labelledby="lesson-video-title">
      <p id="lesson-video-title" className="label-caps mb-3">
        Reference recording
      </p>

      {isDirectVideo ? (
        <video
          controls
          preload="metadata"
          poster={poster}
          className="aspect-video w-full bg-charcoal"
          aria-label={`${title} video`}
        >
          <source src={url.toString()} />
          Your browser cannot play this video.
        </video>
      ) : embed && activated ? (
        <iframe
          src={embed}
          title={`${title} video`}
          className="aspect-video w-full bg-charcoal"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : embed ? (
        <div className="flex aspect-video items-center justify-center hairline-border bg-charcoal/90 p-6 text-center">
          <button
            type="button"
            className="action-primary min-h-11"
            onClick={() => setActivated(true)}
          >
            Load video player
          </button>
        </div>
      ) : null}

      <a
        href={url.toString()}
        target="_blank"
        rel="noopener noreferrer"
        className="action-secondary mt-4 inline-flex min-h-11 items-center"
      >
        Open video in a new tab
      </a>
    </section>
  );
}
