import { PageHeader } from "@/components/PageHeader";
import { ServicesRequestStudio } from "@/components/services/ServicesRequestStudio";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Practice"
        title="Services"
        description="Commission design work or propose research collaboration — each request opens as a new project sheet."
      />

      <ThresholdDoorway label="SERVICE REQUEST" />

      <ServicesRequestStudio />
    </>
  );
}
