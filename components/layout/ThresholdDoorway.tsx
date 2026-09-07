"use client";

import { SectionCutDivider } from "@/components/decorative/SectionCutDivider";
import { BlueprintPathDraw } from "@/components/animation/BlueprintPathDraw";
// import { useLocale, type Translations } from "@/lib/i18n";
import { PageContainer } from "./PageContainer";

interface ThresholdDoorwayProps {
  label?: string;
  className?: string;
}

/*
const THRESHOLD_MAP: Record<string, keyof Translations["thresholds"]> = {
  ENTRANCE: "entrance",
  PHILOSOPHY: "philosophy",
  PORTFOLIO: "portfolio",
  COURSES: "courses",
  PRODUCTS: "products",
  RESEARCH: "research",
  CONTACT: "contact",
  PRACTICE: "practice",
  "STUDENT THRESHOLD": "studentThreshold",
  "SITE FOOTER": "siteFooter",
};
*/

/** Colonnade passage between major spaces */
export function ThresholdDoorway({ label, className = "" }: ThresholdDoorwayProps) {
  // const { locale, t } = useLocale();
  // const normalizedKey = label?.trim().toUpperCase();
  // const localizedLabel =
  //   locale === "ar" && normalizedKey && normalizedKey in THRESHOLD_MAP
  //     ? t.thresholds[THRESHOLD_MAP[normalizedKey]]
  //     : label;

  return (
    <div
      className={`section-compressed bg-concrete-dark/30 ${className}`}
      aria-hidden={!label}
    >
      <PageContainer className="py-4">
        <BlueprintPathDraw className="mb-2" />
        <SectionCutDivider label={label} />
      </PageContainer>
    </div>
  );
}
