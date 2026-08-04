import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { ResearchStudio } from "@/components/researches/ResearchStudio";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";

export default function ResearchesPage() {
  return (
    <>
      <CmsPageHeader pageKey="researches" />

      <ThresholdDoorway label="BIBLIOGRAPHY INDEX" />

      <ResearchStudio />
    </>
  );
}
