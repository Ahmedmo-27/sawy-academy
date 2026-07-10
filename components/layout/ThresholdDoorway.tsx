import { SectionCutDivider } from "@/components/decorative/SectionCutDivider";
import { BlueprintPathDraw } from "@/components/animation/BlueprintPathDraw";
import { PageContainer } from "./PageContainer";

interface ThresholdDoorwayProps {
  label?: string;
  className?: string;
}

/** Colonnade passage between major spaces */
export function ThresholdDoorway({ label, className = "" }: ThresholdDoorwayProps) {
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
