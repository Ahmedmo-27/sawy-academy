"use client";

import Link from "next/link";
import { useSiteSettings } from "@/components/cms/SiteContentProvider";

interface WordmarkProps {
  linked?: boolean;
  size?: "sm" | "md";
}

export function Wordmark({ linked = true, size = "md" }: WordmarkProps) {
  const { branding } = useSiteSettings();
  const suffix = branding.wordmarkSuffix || "Academy";

  const content = (
    <span className="inline-flex items-center gap-2.5 sm:gap-3 whitespace-nowrap">
      <span
        className={`font-sans font-medium uppercase tracking-[0.28em] text-charcoal ${
          size === "sm" ? "text-xs" : "text-sm"
        }`}
      >
        {branding.wordmark}
      </span>
      <span className="h-4 w-px bg-charcoal/30" aria-hidden="true" />
      <span
        className={`font-serif font-light tracking-wide text-charcoal-muted ${
          size === "sm" ? "text-sm" : "text-base"
        }`}
      >
        {suffix}
      </span>
    </span>
  );

  if (linked) {
    return (
      <Link href="/" className="group inline-flex shrink-0 cursor-pointer">
        {content}
      </Link>
    );
  }

  return content;
}
