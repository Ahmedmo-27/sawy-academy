"use client";

import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { SectionCutDivider } from "@/components/decorative/SectionCutDivider";
import { DesignRequestForm } from "@/components/services/DesignRequestForm";
import { ProjectTypeCard } from "@/components/services/ProjectTypeCard";
import { RequestReceived } from "@/components/services/RequestReceived";
import { ResearchRequestForm } from "@/components/services/ResearchRequestForm";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";

type RequestType = "design" | "research";

const requestLabels: Record<RequestType, string> = {
  design: "Design commission",
  research: "Research or collaboration",
};

export function ServicesRequestStudio() {
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [completedType, setCompletedType] = useState<RequestType | null>(null);

  function handleSuccess() {
    if (selectedType) setCompletedType(selectedType);
  }

  function handleReset() {
    setSelectedType(null);
    setCompletedType(null);
  }

  return (
    <Section rhythm="standard" contained={false}>
      <PageContainer className="space-y-12 lg:space-y-16">
        <Reveal variant="structural">
          <div className="max-w-2xl">
            <ScaleBar scale="1:200" className="mb-6 max-w-[140px]" />
            <p className="type-infill leading-relaxed">
              Initiate a new project sheet — select a request type below. Each
              submission is reviewed as a commission brief, not a generic contact
              form.
            </p>
          </div>
        </Reveal>

        <SectionCutDivider label="REQUEST TYPES" />

        {completedType ? (
          <Reveal variant="structural" immediate>
            <div className="max-w-2xl space-y-8">
              <RequestReceived requestLabel={requestLabels[completedType]} />
              <button
                type="button"
                className="action-secondary"
                onClick={handleReset}
              >
                Submit another request
              </button>
            </div>
          </Reveal>
        ) : (
          <>
            <Reveal variant="structural" delay={80}>
              <ThresholdFrame label="Bay 07 — Project type selection">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-hairline mt-4">
                  <ProjectTypeCard
                    sheetRef="Sheet A — Design"
                    title="Request a Design"
                    description="Residential, commercial, interior, or furniture commissions — scope, site, and deliverables defined as a design brief."
                    selected={selectedType === "design"}
                    onSelect={() => setSelectedType("design")}
                  />
                  <ProjectTypeCard
                    sheetRef="Sheet B — Research"
                    title="Request Research or Collaboration"
                    description="Join ongoing scholarship, propose a new investigation, or contribute to an existing research line."
                    selected={selectedType === "research"}
                    onSelect={() => setSelectedType("research")}
                  />
                </div>
              </ThresholdFrame>
            </Reveal>

            {selectedType && (
              <Reveal variant="structural" immediate key={selectedType}>
                <SectionCutDivider
                  label={
                    selectedType === "design"
                      ? "DESIGN BRIEF"
                      : "RESEARCH BRIEF"
                  }
                  className="mb-10"
                />

                <ThresholdFrame
                  label={
                    selectedType === "design"
                      ? "Bay 08 — Design request sheet"
                      : "Bay 09 — Research request sheet"
                  }
                >
                  <div className="hairline-border p-6 lg:p-10 mt-4 w-full">
                    {selectedType === "design" ? (
                      <DesignRequestForm onSuccess={handleSuccess} />
                    ) : (
                      <ResearchRequestForm onSuccess={handleSuccess} />
                    )}
                  </div>
                </ThresholdFrame>
              </Reveal>
            )}
          </>
        )}
      </PageContainer>
    </Section>
  );
}
