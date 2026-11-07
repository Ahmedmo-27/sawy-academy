"use client";

import type { ComponentType } from "react";
import { BlurTextReveal } from "@/components/animation/BlurTextReveal";
import { DecryptedText } from "@/components/animation/DecryptedText";
import { Reveal } from "@/components/Reveal";
import type { ThemeHeaderProps } from "@/components/theme/slots";
import type { ThemeId } from "@/lib/themes/types";

/**
 * A passed description, including an empty string, marks a page title (h1).
 * Section titles omit it and render as h2 so the homepage keeps one h1.
 */
function SlotTitle({
  title,
  description,
  className = "",
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  const page = description !== undefined;
  const Tag = page ? "h1" : "h2";
  return <Tag className={`${page ? "type-display" : "type-heading"} ${className}`}>{title}</Tag>;
}

function Lead({ description }: { description?: string }) {
  if (!description?.trim()) return null;
  return <p className="type-lead mt-6 max-w-xl">{description}</p>;
}

function AtelierHeader({ eyebrow, title, description }: ThemeHeaderProps) {
  const page = description !== undefined;
  const Tag = page ? "h1" : "h2";
  return (
    <div data-theme-slot="header-atelier" className="theme-slot-header min-w-0">
      <Reveal variant="infill" immediate={page}>
        <p className="eyebrow mb-3">
          <DecryptedText text={eyebrow} animateOn="view" speed={35} maxIterations={8} />
        </p>
      </Reveal>
      <Reveal variant="hero" immediate={page} delay={80}>
        <Tag className={`${page ? "type-display" : "type-heading"} max-w-4xl`}>
          <BlurTextReveal text={title} />
        </Tag>
      </Reveal>
      {description?.trim() ? (
        <Reveal variant="infill" immediate={page} delay={200}>
          <Lead description={description} />
        </Reveal>
      ) : null}
    </div>
  );
}

function ObsidianHeader({ eyebrow, title, description }: ThemeHeaderProps) {
  return (
    <div
      data-theme-slot="header-obsidian"
      className="theme-slot-header flex min-w-0 items-stretch gap-5 sm:gap-8"
    >
      <p className="theme-folio-vertical hidden sm:flex">{eyebrow}</p>
      <div className="min-w-0">
        <p className="eyebrow mb-3 sm:hidden">{eyebrow}</p>
        <SlotTitle title={title} description={description} className="max-w-4xl italic" />
        <Lead description={description} />
      </div>
    </div>
  );
}

function CortenHeader({ eyebrow, title, description }: ThemeHeaderProps) {
  return (
    <div data-theme-slot="header-corten" className="theme-slot-header min-w-0">
      <div className="theme-stamp-plate">
        <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.22em]">
          {eyebrow}
        </p>
        <SlotTitle title={title} description={description} className="max-w-4xl uppercase" />
      </div>
      <Lead description={description} />
    </div>
  );
}

function InstrumentHeader({ eyebrow, title, description }: ThemeHeaderProps) {
  return (
    <div
      data-theme-slot="header-instrument"
      className="theme-slot-header mx-auto min-w-0 max-w-3xl text-center"
    >
      <p className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.28em] text-clay">
        {eyebrow}
      </p>
      <SlotTitle title={title} description={description} className="mx-auto max-w-3xl" />
      <Lead description={description} />
    </div>
  );
}

function LedgerHeader({ eyebrow, title, description }: ThemeHeaderProps) {
  return (
    <div data-theme-slot="header-ledger" className="theme-slot-header min-w-0">
      <div className="theme-nameplate">
        <span>Sawy Academy</span>
        <span className="theme-nameplate-rule" aria-hidden="true" />
        <span>{eyebrow}</span>
      </div>
      <div className="theme-nameplate-bar" aria-hidden="true" />
      <SlotTitle title={title} description={description} className="max-w-4xl" />
      <Lead description={description} />
    </div>
  );
}

function LectureHeader({ eyebrow, title, description }: ThemeHeaderProps) {
  return (
    <div data-theme-slot="header-lecture" className="theme-slot-header min-w-0">
      <p className="mb-4 text-[0.72rem] uppercase tracking-[0.42em] text-clay">{eyebrow}</p>
      <SlotTitle title={title} description={description} className="max-w-5xl font-normal" />
      <span className="theme-chapter-dash" aria-hidden="true" />
      <Lead description={description} />
    </div>
  );
}

function ArabesqueHeader({ eyebrow, title, description }: ThemeHeaderProps) {
  return (
    <div
      data-theme-slot="header-arabesque"
      className="theme-slot-header theme-iwan-header mx-auto min-w-0 max-w-3xl text-center"
    >
      <svg className="theme-iwan-arch" viewBox="0 0 320 86" fill="none" aria-hidden="true">
        <path d="M12 84 V40 Q160 -6 308 40 V84" stroke="currentColor" strokeWidth="1.4" />
        <path d="M36 84 V48 Q160 14 284 48 V84" stroke="currentColor" strokeWidth="1" />
      </svg>
      <p className="eyebrow mb-3">{eyebrow}</p>
      <SlotTitle title={title} description={description} className="mx-auto max-w-3xl" />
      <Lead description={description} />
    </div>
  );
}

function PharaonicHeader({ eyebrow, title, description }: ThemeHeaderProps) {
  return (
    <div
      data-theme-slot="header-pharaonic"
      className="theme-slot-header mx-auto min-w-0 max-w-3xl text-center"
    >
      <p className="theme-cartouche-label mb-5">{eyebrow}</p>
      <SlotTitle
        title={title}
        description={description}
        className="mx-auto max-w-3xl uppercase tracking-[0.14em]"
      />
      <Lead description={description} />
    </div>
  );
}

export const themeHeaders: Record<ThemeId, ComponentType<ThemeHeaderProps>> = {
  atelier: AtelierHeader,
  obsidian: ObsidianHeader,
  corten: CortenHeader,
  instrument: InstrumentHeader,
  ledger: LedgerHeader,
  lecture: LectureHeader,
  arabesque: ArabesqueHeader,
  pharaonic: PharaonicHeader,
};
