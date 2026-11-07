"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { BlueprintMorphImage } from "@/components/animation/BlueprintMorphImage";
import { ArchitecturalTilt3D } from "@/components/animation/ArchitecturalTilt3D";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import type { ThemeCardProps } from "@/components/theme/slots";
import type { ThemeId } from "@/lib/themes/types";

function mark(index?: number) {
  if (typeof index !== "number") return null;
  return String(index + 1).padStart(2, "0");
}

function SlotImage({
  image,
  className = "",
}: {
  image: string;
  className?: string;
}) {
  if (!image) {
    return <div className={`bg-concrete-dark ${className}`} aria-hidden="true" />;
  }
  return (
    // CMS media hosts are not all registered with the image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" className={`h-full w-full object-cover ${className}`} />
  );
}

function AtelierCard({ title, meta, image, href, index }: ThemeCardProps) {
  const number = mark(index);
  return (
    <ArchitecturalTilt3D className="h-full">
      <Link
        href={href}
        data-theme-slot="card-atelier"
        className="theme-card group flex h-full min-w-0 max-w-full flex-col overflow-hidden surface-card-elevated focus-visible:outline-offset-4"
      >
        <div className="shrink-0 overflow-hidden bg-concrete-dark">
          <ImageFrame className="aspect-[16/10] transition-transform duration-700 ease-out group-hover:scale-[1.025]">
            <BlueprintMorphImage
              src={image}
              alt={title}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-charcoal/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden="true"
            />
          </ImageFrame>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-t border-charcoal/10 p-4 sm:gap-4 sm:p-5">
          <span className="dim-label pt-1">{number ?? "—"}</span>
          <div className="min-w-0">
            <h2 className="break-words font-serif text-xl font-medium leading-tight text-charcoal transition-colors group-hover:text-clay sm:text-2xl">
              {title}
            </h2>
            <p className="label-caps mt-2">{meta}</p>
          </div>
          <span
            className="pt-0.5 text-xl font-light text-charcoal transition-transform duration-300 group-hover:translate-x-1 group-hover:text-clay"
            aria-hidden="true"
          >
            ↗
          </span>
        </div>
      </Link>
    </ArchitecturalTilt3D>
  );
}

function ObsidianCard({ title, meta, href, index }: ThemeCardProps) {
  const number = mark(index);
  return (
    <Link
      href={href}
      data-theme-slot="card-obsidian"
      className="theme-slot-card theme-slot-card-obsidian group"
    >
      {number ? <span className="theme-slot-index">{number}</span> : <span />}
      <span className="min-w-0">
        <h2 className="font-serif text-3xl italic leading-tight sm:text-4xl">{title}</h2>
        <p className="label-caps mt-2">{meta}</p>
      </span>
      <span className="text-clay" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

function CortenCard({ title, meta, image, href, index }: ThemeCardProps) {
  const number = mark(index) ?? "00";
  return (
    <Link
      href={href}
      data-theme-slot="card-corten"
      className="theme-slot-card theme-slot-card-corten group"
    >
      <span className="theme-slot-index">{number}</span>
      <span className="min-w-0">
        <h2 className="font-serif text-2xl font-bold uppercase leading-none tracking-tight">
          {title}
        </h2>
        <p className="label-caps mt-2">{meta}</p>
      </span>
      <span className="theme-slot-thumb">
        <SlotImage image={image} />
      </span>
    </Link>
  );
}

function InstrumentCard({ title, meta, image, href }: ThemeCardProps) {
  return (
    <Link
      href={href}
      data-theme-slot="card-instrument"
      className="theme-slot-card theme-slot-card-instrument group"
    >
      <span className="theme-round-media">
        <SlotImage image={image} />
      </span>
      <p className="mt-4 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-clay">{meta}</p>
      <h2 className="mt-2 font-serif text-xl leading-tight">{title}</h2>
    </Link>
  );
}

function LedgerCard({ title, meta, href, index }: ThemeCardProps) {
  const number = mark(index);
  return (
    <Link
      href={href}
      data-theme-slot="card-ledger"
      className="theme-slot-card theme-slot-card-ledger group"
    >
      <span className="theme-slot-index">{number ?? "§"}</span>
      <h2 className="min-w-0 font-serif text-2xl leading-tight sm:text-[1.75rem]">{title}</h2>
      <p className="label-caps sm:text-right">{meta}</p>
    </Link>
  );
}

function LectureCard({ title, meta, image, href }: ThemeCardProps) {
  return (
    <Link
      href={href}
      data-theme-slot="card-lecture"
      className="theme-slot-card theme-slot-card-lecture group"
    >
      <span className="theme-slot-bleed">
        <SlotImage image={image} className="transition-transform duration-700 group-hover:scale-105" />
      </span>
      <span className="theme-slot-caption">
        <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/75">{meta}</p>
        <h2 className="mt-1 font-serif text-2xl leading-tight text-white">{title}</h2>
      </span>
    </Link>
  );
}

function ArabesqueCard({ title, meta, image, href }: ThemeCardProps) {
  return (
    <Link
      href={href}
      data-theme-slot="card-arabesque"
      className="theme-slot-card theme-slot-card-arabesque group"
    >
      <span className="theme-arch-media">
        <SlotImage image={image} className="transition-transform duration-700 group-hover:scale-105" />
      </span>
      <p className="eyebrow mt-4">{meta}</p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">{title}</h2>
    </Link>
  );
}

function PharaonicCard({ title, meta, image, href }: ThemeCardProps) {
  return (
    <Link
      href={href}
      data-theme-slot="card-pharaonic"
      className="theme-slot-card theme-slot-card-pharaonic group"
    >
      <span className="theme-cornice" aria-hidden="true" />
      <span className="theme-slot-relief">
        <SlotImage image={image} />
      </span>
      <span className="theme-slot-inscription">
        <p className="eyebrow">{meta}</p>
        <h2 className="mt-1 font-serif text-lg uppercase tracking-[0.16em]">{title}</h2>
      </span>
    </Link>
  );
}

export const themeCards: Record<ThemeId, ComponentType<ThemeCardProps>> = {
  atelier: AtelierCard,
  obsidian: ObsidianCard,
  corten: CortenCard,
  instrument: InstrumentCard,
  ledger: LedgerCard,
  lecture: LectureCard,
  arabesque: ArabesqueCard,
  pharaonic: PharaonicCard,
};
