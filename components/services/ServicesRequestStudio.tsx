"use client";

import { useEffect, useState } from "react";
import { GsapReveal, GsapStagger } from "@/components/animation/GsapReveal";
import { HorizontalPinGallery } from "@/components/animation/HorizontalPinGallery";
import { Magnetic } from "@/components/animation/Magnetic";
import { SplitTextReveal } from "@/components/animation/SplitTextReveal";
import { MediaBay } from "@/components/decorative/MediaBay";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { DesignRequestForm } from "@/components/services/DesignRequestForm";
import { ProjectTypeCard } from "@/components/services/ProjectTypeCard";
import { RequestReceived } from "@/components/services/RequestReceived";
import { ResearchRequestForm } from "@/components/services/ResearchRequestForm";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { useSiteSettings } from "@/components/cms/SiteContentProvider";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
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
    number: "01",
    label: "Brief",
    annotation: "Scope / Site / Intent",
    copy: "Scope, site, and intent recorded as a commission sheet.",
  },
  {
    key: "processReviewImageUrl" as const,
    number: "02",
    label: "Review",
    annotation: "Draw / Test / Refine",
    copy: "Iterative critique with drawings and reference plates.",
  },
  {
    key: "processDeliveryImageUrl" as const,
    number: "03",
    label: "Delivery",
    annotation: "Issue / Coordinate / Archive",
    copy: "Final set issued — plans, details, and coordination notes.",
  },
];

function RoomHeader({
  room,
  eyebrow,
  title,
  copy,
}: {
  room: string;
  eyebrow: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="mb-10 grid grid-cols-1 gap-5 lg:mb-14 lg:grid-cols-12 lg:gap-6">
      <p className="dim-label pt-1 lg:col-span-2">{room}</p>
      <div className="lg:col-span-6">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <SplitTextReveal type="lines">
          <h2 className="type-heading text-balance">{title}</h2>
        </SplitTextReveal>
      </div>
      {copy ? (
        <GsapReveal type="text" delay={0.08} className="lg:col-span-4 lg:pt-7">
          <p className="type-infill max-w-md leading-relaxed">{copy}</p>
        </GsapReveal>
      ) : null}
    </div>
  );
}

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
    <>
      <Section id="service-approach" rhythm="standard">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8">
            <GsapReveal type="text">
              <p className="dim-label mb-5">ROOM 07 — PRACTICE</p>
            </GsapReveal>
            <SplitTextReveal type="lines">
              <h2 className="type-heading max-w-2xl text-balance">
                Every commission begins with a considered brief.
              </h2>
            </SplitTextReveal>
            <GsapReveal type="text" delay={0.1}>
              <p className="type-lead mt-6 max-w-xl">
                Move through the studio, choose the path that fits the work, and
                open a project sheet for review.
              </p>
            </GsapReveal>
          </div>

          <GsapReveal
            type="card"
            delay={0.14}
            className="lg:col-span-3 lg:col-start-10"
          >
            <ThresholdFrame label="Practice note">
              <div className="mt-4 bg-concrete-dark/45 p-6 sm:p-8">
                <ScaleBar scale="1:200" className="mb-7 max-w-[140px]" />
                <p className="type-infill leading-relaxed">
                  Each submission is reviewed as a commission brief, not a
                  generic contact form.
                </p>
              </div>
            </ThresholdFrame>
          </GsapReveal>
        </div>
      </Section>

      {completedType ? (
        <>
          <ThresholdDoorway label="SUBMISSION FILED" />
          <Section rhythm="standard">
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
          </Section>
        </>
      ) : (
        <>
          <ThresholdDoorway label="REQUEST PATHS" />

          <Section id="request-paths" rhythm="atrium">
            <RoomHeader
              room="ROOM 07.1"
              eyebrow="Choose a path"
              title="What kind of work are we beginning?"
              copy="Select one project sheet. The choice only changes the brief you will complete; the studio review process remains the same."
            />

            <ThresholdFrame label="Two entries — one studio">
              <GsapStagger className="mt-4 grid grid-cols-1 gap-px bg-hairline lg:grid-cols-2">
                <ProjectTypeCard
                  index="A"
                  sheetRef="Sheet A — Design"
                  title="Request a Design"
                  description="Residential, commercial, interior, or furniture commissions — scope, site, and deliverables defined as a design brief."
                  details={["Architecture", "Interiors", "Furniture"]}
                  selected={selectedType === "design"}
                  onSelect={() => setSelectedType("design")}
                  imageUrl={servicesPage?.designImageUrl}
                  fallback="service"
                />
                <ProjectTypeCard
                  index="B"
                  sheetRef="Sheet B — Research"
                  title="Research or Collaboration"
                  description="Join ongoing scholarship, propose a new investigation, or contribute to an existing research line."
                  details={["Scholarship", "Partnership", "Publication"]}
                  selected={selectedType === "research"}
                  onSelect={() => setSelectedType("research")}
                  imageUrl={servicesPage?.researchImageUrl}
                  fallback="research"
                />
              </GsapStagger>
            </ThresholdFrame>

            {selectedType ? (
              <GsapReveal type="card" immediate key={selectedType}>
                <div
                  className="mt-px flex flex-col gap-5 bg-charcoal px-6 py-5 text-concrete sm:flex-row sm:items-center sm:justify-between lg:px-8"
                  role="status"
                >
                  <div>
                    <p className="label-caps !text-concrete/55">Selected sheet</p>
                    <p className="mt-1 font-serif text-xl">
                      {requestLabels[selectedType]}
                    </p>
                  </div>
                  <a
                    href="#request-brief"
                    className="action-secondary self-start !text-concrete after:!bg-clay-muted sm:self-auto"
                  >
                    Continue to brief
                  </a>
                </div>
              </GsapReveal>
            ) : null}
          </Section>

          <ThresholdDoorway label="WORKING METHOD" />

          <Section id="working-method" rhythm="standard">
            <RoomHeader
              room="ROOM 07.2"
              eyebrow="The working method"
              title="A measured route from question to issue."
              copy="Each stage leaves a clear record. Expectations, references, and decisions remain visible from the first conversation to the final set."
            />

            <ThresholdFrame label="Sequence 01—03">
              <GsapStagger className="mt-4 divide-y divide-hairline border-y border-hairline">
                {PROCESS_STEPS.map((step, index) => (
                  <article
                    key={step.key}
                    className="grid grid-cols-1 gap-7 py-8 lg:grid-cols-12 lg:items-center lg:gap-6 lg:py-10"
                  >
                    <div
                      className={`lg:col-span-5 ${
                        index % 2 === 1 ? "lg:order-2 lg:col-start-8" : ""
                      }`}
                    >
                      <MediaBay
                        src={servicesPage?.[step.key]}
                        alt={`${step.label} stage`}
                        className="aspect-[16/10]"
                        fallback="plan"
                        morph
                      />
                    </div>
                    <div
                      className={`lg:col-span-5 ${
                        index % 2 === 1
                          ? "lg:order-1 lg:col-start-2"
                          : "lg:col-start-7"
                      }`}
                    >
                      <div className="flex items-start gap-5 sm:gap-7">
                        <span className="font-serif text-4xl font-light text-clay/70">
                          {step.number}
                        </span>
                        <div className="pt-1">
                          <p className="label-caps mb-3">{step.annotation}</p>
                          <h3 className="type-title">{step.label}</h3>
                          <p className="type-infill mt-4 max-w-sm leading-relaxed">
                            {step.copy}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </GsapStagger>
            </ThresholdFrame>
          </Section>

          {examples.length > 0 ? (
            <>
              <ThresholdDoorway label="BUILT RECORD" />
              <Section id="example-commissions" rhythm="standard">
                <RoomHeader
                  room="ROOM 07.3"
                  eyebrow="Example commissions"
                  title="Selected work from the studio archive."
                  copy="A short record of projects carried through the same process of definition, testing, and resolution."
                />
                <ThresholdFrame label="Archive sheets">
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
              </Section>
            </>
          ) : null}

          {selectedType ? (
            <>
              <ThresholdDoorway
                label={
                  selectedType === "design"
                    ? "DESIGN BRIEF"
                    : "RESEARCH BRIEF"
                }
              />
              <Section id="request-brief" rhythm="atrium">
                <RoomHeader
                  room={selectedType === "design" ? "ROOM 08" : "ROOM 09"}
                  eyebrow="Open project sheet"
                  title={
                    selectedType === "design"
                      ? "Define the design commission."
                      : "Set out the research question."
                  }
                  copy="Complete the fields that are relevant now. The submission becomes the first working record for studio review."
                />

                <div className="grid grid-cols-1 gap-px bg-hairline lg:grid-cols-12">
                  <aside className="bg-concrete-dark/55 p-6 sm:p-8 lg:col-span-4 lg:p-10">
                    <div className="lg:sticky lg:top-28">
                      <ScaleBar scale="1:50" className="mb-8 max-w-[130px]" />
                      <p className="label-caps mb-3">Active sheet</p>
                      <p className="type-title">{requestLabels[selectedType]}</p>
                      <p className="type-infill mt-4 max-w-xs leading-relaxed">
                        Your details are reviewed as a project brief and followed
                        up during office hours.
                      </p>
                      <button
                        type="button"
                        className="action-secondary mt-8"
                        onClick={() => setSelectedType(null)}
                      >
                        Change request type
                      </button>
                    </div>
                  </aside>

                  <div className="bg-concrete p-6 sm:p-8 lg:col-span-8 lg:p-10">
                    <ThresholdFrame
                      label={
                        selectedType === "design"
                          ? "Sheet A — Design request"
                          : "Sheet B — Research request"
                      }
                    >
                      <div className="mt-4" key={selectedType}>
                        {selectedType === "design" ? (
                          <DesignRequestForm onSuccess={handleSuccess} />
                        ) : (
                          <ResearchRequestForm onSuccess={handleSuccess} />
                        )}
                      </div>
                    </ThresholdFrame>
                  </div>
                </div>
              </Section>
            </>
          ) : (
            <Section rhythm="intimate">
              <GsapReveal type="text">
                <div className="flex flex-col items-start justify-between gap-6 border-y border-hairline py-8 sm:flex-row sm:items-center">
                  <div>
                    <p className="eyebrow mb-2">Ready to begin?</p>
                    <p className="type-title">Choose a request path to open a brief.</p>
                  </div>
                  <Magnetic>
                    <a href="#request-paths" className="action-primary">
                      Return to request paths
                    </a>
                  </Magnetic>
                </div>
              </GsapReveal>
            </Section>
          )}
        </>
      )}
    </>
  );
}
