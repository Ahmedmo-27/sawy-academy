"use client";

import Image from "next/image";
import { BlueprintMorphImage } from "@/components/animation/BlueprintMorphImage";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import {
  MediaFallbackSketch,
  type MediaFallbackKind,
} from "@/components/decorative/MediaFallbackSketch";

interface MediaBayProps {
  src?: string | null;
  alt: string;
  /** Aspect / size classes applied to ImageFrame (e.g. aspect-[4/3] sm:aspect-[4/5]). */
  className?: string;
  fallback?: MediaFallbackKind;
  fallbackLabel?: string;
  priority?: boolean;
  /** Use BlueprintMorphImage wireframe reveal when a src is present. */
  morph?: boolean;
  revealOnLoad?: boolean;
  sizes?: string;
  objectPosition?: string;
}

export function MediaBay({
  src,
  alt,
  className = "aspect-[4/3] sm:aspect-[4/5]",
  fallback = "plan",
  fallbackLabel,
  priority = false,
  morph = false,
  revealOnLoad = false,
  sizes = "(min-width: 1024px) 40rem, 100vw",
  objectPosition = "center",
}: MediaBayProps) {
  const hasSrc = Boolean(src?.trim());

  return (
    <ImageFrame className={className}>
      {hasSrc && morph ? (
        <BlueprintMorphImage
          src={src!}
          alt={alt}
          sizes={sizes}
          priority={priority}
          revealOnLoad={revealOnLoad}
          objectPosition={objectPosition}
        />
      ) : hasSrc ? (
        <Image
          src={src!}
          alt={alt}
          fill
          className="object-cover"
          style={{ objectPosition }}
          sizes={sizes}
          priority={priority}
        />
      ) : (
        <MediaFallbackSketch kind={fallback} label={fallbackLabel} />
      )}
    </ImageFrame>
  );
}
