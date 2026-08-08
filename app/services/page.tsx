import type { Metadata } from "next";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { ServicesRequestStudio } from "@/components/services/ServicesRequestStudio";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";

export const metadata: Metadata = {
  title: "Architecture Services",
  description:
    "Request architecture design and academic research services from Sawy Academy.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <CmsPageHeader pageKey="services" />

      <ThresholdDoorway label="SERVICE REQUEST" />

      <ServicesRequestStudio />
    </>
  );
}
