import type { Metadata } from "next";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { PortfolioStudio } from "@/components/portfolio/PortfolioStudio";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";

export const metadata: Metadata = {
  title: "Architecture Portfolio",
  description:
    "Explore selected architecture projects and studio work by Prof. Mohamed El Sawy.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <>
      <CmsPageHeader pageKey="portfolio" />

      <ThresholdDoorway label="PROJECT INDEX" />

      <PortfolioStudio />
    </>
  );
}
