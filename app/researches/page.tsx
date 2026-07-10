import { PageHeader } from "@/components/PageHeader";
import { ResearchStudio } from "@/components/researches/ResearchStudio";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { BRAND } from "@/lib/branding";

export default function ResearchesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Scholarship"
        title="Researches"
        description={`Published papers, conference proceedings, and ongoing investigations by ${BRAND.professor}.`}
      />

      <ThresholdDoorway label="BIBLIOGRAPHY INDEX" />

      <ResearchStudio />
    </>
  );
}
