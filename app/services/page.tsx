import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { ServicesRequestStudio } from "@/components/services/ServicesRequestStudio";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";

export default function ServicesPage() {
  return (
    <>
      <CmsPageHeader pageKey="services" />

      <ThresholdDoorway label="SERVICE REQUEST" />

      <ServicesRequestStudio />
    </>
  );
}
