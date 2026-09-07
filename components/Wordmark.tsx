"use client";

import Link from "next/link";
import { useSiteSettings } from "@/components/cms/SiteContentProvider";
// import { useLocale } from "@/lib/i18n";

interface WordmarkProps {
  linked?: boolean;
  size?: "sm" | "md";
  tone?: "dark" | "light";
}

export function Wordmark({
  linked = true,
  size = "md",
  tone = "dark",
}: WordmarkProps) {
  const { branding } = useSiteSettings();
  // const { locale, t } = useLocale();
  // const customSuffix = branding.wordmarkSuffix;
  // const suffix =
  //   locale === "ar" && (!customSuffix || customSuffix === "Academy")
  //     ? t.wordmark.academy
  //     : customSuffix || "Academy";
  const suffix = branding.wordmarkSuffix || "Academy";
  const primaryTone = tone === "light" ? "text-concrete" : "text-charcoal";
  const secondaryTone =
    tone === "light" ? "text-concrete/70" : "text-charcoal-muted";
  const dividerTone = tone === "light" ? "bg-concrete/30" : "bg-charcoal/30";

  const content = (
    <span className="inline-flex items-center gap-2.5 sm:gap-3 whitespace-nowrap">
      <span
        className={`font-sans font-medium uppercase tracking-[0.28em] ${primaryTone} ${
          size === "sm" ? "text-xs" : "text-sm"
        }`}
      >
        {branding.wordmark}
      </span>
      <span className={`h-4 w-px ${dividerTone}`} aria-hidden="true" />
      <span
        className={`font-serif font-light tracking-wide ${secondaryTone} ${
          size === "sm" ? "text-sm" : "text-base"
        }`}
      >
        {suffix}
      </span>
    </span>
  );

  if (linked) {
    return (
      <Link
        href="/"
        className="group inline-flex min-h-11 shrink-0 items-center cursor-pointer"
      >
        {content}
      </Link>
    );
  }

  return content;
}
