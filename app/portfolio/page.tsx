import { PageHeader } from "@/components/PageHeader";
import { PortfolioStudio } from "@/components/portfolio/PortfolioStudio";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";

export default function PortfolioPage() {
  return (
    <>
      <PageHeader
        eyebrow="Work"
        title="Portfolio"
        description="Built work, interiors, furniture, and competition entries spanning fifteen years of practice and research."
      />

      <ThresholdDoorway label="PROJECT INDEX" />

      <PortfolioStudio />
    </>
  );
}
