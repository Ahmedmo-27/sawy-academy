"use client";

import { useEffect, useState } from "react";
import { GsapReveal, GsapStagger } from "@/components/animation/GsapReveal";
import { HorizontalPinGallery } from "@/components/animation/HorizontalPinGallery";
import { Magnetic } from "@/components/animation/Magnetic";
import { MediaBay } from "@/components/decorative/MediaBay";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { SectionCutDivider } from "@/components/decorative/SectionCutDivider";
import { DesignRequestForm } from "@/components/services/DesignRequestForm";
import { ProjectTypeCard } from "@/components/services/ProjectTypeCard";
import { RequestReceived } from "@/components/services/RequestReceived";
import { ResearchRequestForm } from "@/components/services/ResearchRequestForm";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { useSiteSettings } from "@/components/cms/SiteContentProvider";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { listProjects } from "@/lib/api/portfolio";
import type { Project } from "@/lib/api/types";

type RequestType = "design" | "research";

const requestLabels: Record<RequestType, string> = {
  design: "Design commission",
  research: "Research or collaboration",
};

const PROCESS_STEPS = [
  {
    key: "processBriefImageUrl" as const,
    label: "Brief",
    copy: "Scope, site, and intent recorded as a commission sheet.",
  },
  {
    key: "processReviewImageUrl" as const,
    label: "Review",
    copy: "Iterative critique with drawings and reference plates.",
  },
  {
    key: "processDeliveryImageUrl" as const,
    label: "Delivery",
    copy: "Final set issued — plans, details, and coordination notes.",
  },
];

export function ServicesRequestStudio() {
  const { settings } = useSiteSettings();
  const servicesPage = settings.servicesPage;
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [completedType, setCompletedType] = useState<RequestType | null>(null);
  const [examples, setExamples] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((projects) => {
        if (!cancelled) setExamples(projects.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setExamples([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        <GsapReveal type="text">
          <div className="max-w-2xl">
            <ScaleBar scale="1:200" className="mb-6 max-w-[140px]" />
            <p className="type-infill leading-relaxed">
              Initiate a new project sheet — select a request type below. Each
              submission is reviewed as a commission brief, not a generic contact
              form.
            </p>
          </div>
        </GsapReveal>

        <SectionCutDivider label="REQUEST TYPES" />

        {completedType ? (
          <GsapReveal type="card" immediate>
            <div className="max-w-2xl space-y-8">
              <RequestReceived requestLabel={requestLabels[completedType]} />
              <Magnetic>
                <button
                  type="button"
                  className="action-secondary"
                  onClick={handleReset}
                >
                  Submit another request
                </button>
              </Magnetic>
            </div>
          </GsapReveal>
        ) : (
          <>
            <GsapReveal type="card" delay={0.06}>
              <ThresholdFrame label="Bay 07 — Project type selection">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-hairline mt-4">
                  <ProjectTypeCard
                    sheetRef="Sheet A — Design"
                    title="Request a Design"
                    description="Residential, commercial, interior, or furniture commissions — scope, site, and deliverables defined as a design brief."
                    selected={selectedType === "design"}
                    onSelect={() => setSelectedType("design")}
                    imageUrl={servicesPage?.designImageUrl}
                    fallback="service"
                  />
                  <ProjectTypeCard
                    sheetRef="Sheet B — Research"
                    title="Request Research or Collaboration"
                    description="Join ongoing scholarship, propose a new investigation, or contribute to an existing research line."
                    selected={selectedType === "research"}
                    onSelect={() => setSelectedType("research")}
                    imageUrl={servicesPage?.researchImageUrl}
                    fallback="research"
                  />
                </div>
              </ThresholdFrame>
            </GsapReveal>

            <ThresholdFrame label="Bay 07.5 — Process">
              <GsapStagger className="grid grid-cols-1 gap-px bg-hairline pt-6 md:grid-cols-3">
                {PROCESS_STEPS.map((step) => (
                  <div key={step.key} className="bg-concrete p-6 sm:p-7">
                    <MediaBay
                      src={servicesPage?.[step.key]}
                      alt={step.label}
                      className="aspect-[4/3] mb-4"
                      fallback="plan"
                      morph
                    />
                    <p className="label-caps mb-2">{step.label}</p>
                    <p className="type-infill leading-relaxed">{step.copy}</p>
                  </div>
                ))}
              </GsapStagger>
            </ThresholdFrame>

            {examples.length > 0 && (
              <ThresholdFrame label="Bay 07.6 — Example commissions">
                <div className="pt-6">
                  <HorizontalPinGallery>
                    {examples.map((project) => (
                      <div
                        key={project.id}
                        className="w-[min(88vw,24rem)] shrink-0 bg-concrete sm:w-[min(42vw,26rem)]"
                      >
                        <ProjectCard
                          title={project.title}
                          category={project.category}
                          year={project.year}
                          image={project.image}
                          sheetRef={project.sheetRef ?? ""}
                          href={`/portfolio/${project.slug}`}
                        />
                      </div>
                    ))}
                  </HorizontalPinGallery>
                </div>
              </ThresholdFrame>
            )}

            {selectedType && (
              <GsapReveal type="card" immediate key={selectedType}>
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
              </GsapReveal>
            )}
          </>
        )}
      </PageContainer>
    </Section>
  );
}
