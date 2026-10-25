"use client";

import { ImageFrame } from "@/components/decorative/ImageFrame";
import { MediaBay } from "@/components/decorative/MediaBay";
import type { MediaFallbackKind } from "@/components/decorative/MediaFallbackSketch";

interface ResearchCardMediaProps {
  pdfUrl?: string | null;
  image?: string | null;
  alt: string;
  className?: string;
  fallback?: MediaFallbackKind;
  fallbackLabel?: string;
  priority?: boolean;
  morph?: boolean;
  revealOnLoad?: boolean;
  sizes?: string;
  objectPosition?: string;
}

function buildPdfEmbedUrl(value?: string | null) {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const fragment = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    const params = new URLSearchParams(fragment);
    params.set("toolbar", "0");
    params.set("navpanes", "0");
    params.set("scrollbar", "0");
    return `${url.origin}${url.pathname}${url.search}#${params.toString()}`;
  } catch {
    return null;
  }
}

export function ResearchCardMedia({
  pdfUrl,
  image,
  alt,
  className = "aspect-[4/3] sm:aspect-[4/5]",
  fallback = "research",
  fallbackLabel,
  priority = false,
  morph = false,
  revealOnLoad = false,
  sizes = "(min-width: 1024px) 40rem, 100vw",
  objectPosition = "center",
}: ResearchCardMediaProps) {
  const embedUrl = buildPdfEmbedUrl(pdfUrl);

  if (!embedUrl) {
    return (
      <MediaBay
        src={image}
        alt={alt}
        className={className}
        fallback={fallback}
        fallbackLabel={fallbackLabel}
        priority={priority}
        morph={morph}
        revealOnLoad={revealOnLoad}
        sizes={sizes}
        objectPosition={objectPosition}
      />
    );
  }

  return (
    <ImageFrame className={className}>
      <div className="absolute inset-0 bg-concrete-dark/30" aria-hidden="true" />
      <iframe
        src={embedUrl}
        title={`${alt} PDF preview`}
        className="absolute inset-0 h-full w-full bg-white"
        loading={priority ? "eager" : "lazy"}
      />
      <span className="dim-label absolute bottom-3 left-3 text-[0.55rem] z-10">
        PDF
      </span>
    </ImageFrame>
  );
}
