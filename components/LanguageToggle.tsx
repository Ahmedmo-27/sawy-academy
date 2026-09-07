"use client";

// Bilingual Language Toggle (commented out)
/*
import { useLocale } from "@/lib/i18n";

interface LanguageToggleProps {
  className?: string;
  variant?: "compact" | "full";
}

export function LanguageToggle({
  className = "",
  variant = "compact",
}: LanguageToggleProps) {
  const { locale, setLocale } = useLocale();
  const isArabic = locale === "ar";

  if (variant === "full") {
    return (
      <div
        className={`inline-flex items-center gap-1 border border-hairline p-0.5 ${className}`}
        role="group"
        aria-label="Language selection"
      >
        <button
          type="button"
          onClick={() => setLocale("en")}
          aria-pressed={!isArabic}
          className={`min-h-8 px-3 text-xs font-medium uppercase tracking-[0.14em] transition-colors duration-200 ${
            !isArabic
              ? "bg-charcoal text-concrete"
              : "text-charcoal-infill hover:text-charcoal"
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLocale("ar")}
          aria-pressed={isArabic}
          className={`min-h-8 px-3 text-xs font-medium transition-colors duration-200 ${
            isArabic
              ? "bg-charcoal text-concrete"
              : "text-charcoal-infill hover:text-charcoal"
          }`}
        >
          العربية
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLocale(isArabic ? "en" : "ar")}
      aria-label={isArabic ? "Switch to English" : "Switch to Arabic"}
      title={isArabic ? "English" : "العربية"}
      className={`relative inline-flex min-h-11 items-center gap-1.5 px-2 font-sans text-xs tracking-wider transition-colors duration-200 text-charcoal-infill hover:text-charcoal cursor-pointer ${className}`}
    >
      <span
        className={`transition-colors duration-200 ${
          !isArabic ? "font-semibold text-clay" : "text-charcoal-infill/70"
        }`}
      >
        EN
      </span>
      <span className="h-3 w-px bg-hairline" aria-hidden="true" />
      <span
        className={`font-arabic text-[0.8125rem] transition-colors duration-200 ${
          isArabic ? "font-semibold text-clay" : "text-charcoal-infill/70"
        }`}
      >
        ع
      </span>
    </button>
  );
}
*/

export function LanguageToggle() {
  return null;
}
