import Link from "next/link";
import { BRAND } from "@/lib/branding";

interface WordmarkProps {
  linked?: boolean;
  size?: "sm" | "md";
}

export function Wordmark({ linked = true, size = "md" }: WordmarkProps) {
  const content = (
    <span className="inline-flex items-center gap-2.5 sm:gap-3">
      <span
        className={`font-sans font-medium uppercase tracking-[0.2em] sm:tracking-[0.28em] text-charcoal ${
          size === "sm" ? "text-[0.65rem] sm:text-xs" : "text-xs sm:text-sm"
        }`}
      >
        {BRAND.wordmark}
      </span>
      <span
        className="h-4 w-px bg-charcoal/30"
        aria-hidden="true"
      />
      <span
        className={`font-serif font-light tracking-wide text-charcoal-muted ${
          size === "sm" ? "text-sm" : "text-base"
        }`}
      >
        Academy
      </span>
    </span>
  );

  if (linked) {
    return (
      <Link href="/" className="group cursor-pointer">
        {content}
      </Link>
    );
  }

  return content;
}
