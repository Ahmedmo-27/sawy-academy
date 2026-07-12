import Link from "next/link";
import { BRAND } from "@/lib/branding";

interface WordmarkProps {
  linked?: boolean;
  size?: "sm" | "md";
}

export function Wordmark({ linked = true, size = "md" }: WordmarkProps) {
  const content = (
    <span className="inline-flex min-w-0 max-w-full items-center gap-2 sm:gap-3">
      <span
        className={`shrink-0 font-sans font-medium uppercase tracking-[0.16em] sm:tracking-[0.2em] md:tracking-[0.28em] text-charcoal ${
          size === "sm" ? "text-[0.65rem] sm:text-xs" : "text-[0.7rem] sm:text-xs md:text-sm"
        }`}
      >
        {BRAND.wordmark}
      </span>
      <span
        className="h-3.5 w-px shrink-0 bg-charcoal/30 sm:h-4"
        aria-hidden="true"
      />
      <span
        className={`min-w-0 truncate font-serif font-light tracking-wide text-charcoal-muted ${
          size === "sm" ? "text-sm" : "text-sm sm:text-base"
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
