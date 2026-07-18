import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { PortfolioStudio } from "@/components/portfolio/PortfolioStudio";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";

export default function PortfolioPage() {
  return (
    <>
      <CmsPageHeader pageKey="portfolio" />

      <ThresholdDoorway label="PROJECT INDEX" />

      <PortfolioStudio />
    </>
  );
}
