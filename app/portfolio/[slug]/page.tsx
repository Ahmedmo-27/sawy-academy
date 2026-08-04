"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { BlueprintMorphImage } from "@/components/animation/BlueprintMorphImage";
import { GridColumns } from "@/components/decorative/GridColumns";
import { ImageFrame } from "@/components/decorative/ImageFrame";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { getProject } from "@/lib/api/portfolio";
import type { Project } from "@/lib/api/types";

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;
    getProject(slug)
      .then((data) => {
        if (cancelled) return;
        setProject(data);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === "missing") notFound();

  if (status === "loading" || !project) {
    return (
      <PageContainer className="pt-32 pb-20">
        <p className="label-caps text-charcoal-infill">Loading project…</p>
      </PageContainer>
    );
  }

  return (
    <>
      <header className="relative overflow-hidden">
        <GridColumns />
        <PageContainer className="relative z-10 pt-24 lg:pt-32 pb-0">
          <p className="eyebrow mb-3">Portfolio · {project.sheetRef}</p>
          <h1 className="type-display max-w-4xl mb-8">{project.title}</h1>

          <ThresholdFrame label={`Sheet — ${project.sheetRef}`}>
            <ImageFrame className="aspect-[16/10] lg:aspect-[21/9] mt-4">
              <BlueprintMorphImage
                src={project.image}
                alt={project.title}
                sizes="100vw"
                priority
                revealOnLoad
              />
            </ImageFrame>
          </ThresholdFrame>
        </PageContainer>
      </header>

      <ThresholdDoorway label={project.sheetRef || project.slug} />

      <Section rhythm="standard" contained={false}>
        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <div className="hairline-border p-6 lg:p-8">
                <ScaleBar scale="1:50" className="mb-6 max-w-[120px]" />
                <div className="space-y-6">
                  <div>
                    <p className="label-caps mb-2">Sheet</p>
                    <p className="dim-label !text-base">{project.sheetRef}</p>
                  </div>
                  <div className="hairline-t pt-6">
                    <p className="label-caps mb-2">Project</p>
                    <p className="type-title text-xl">{project.title}</p>
                  </div>
                  <div className="hairline-t pt-6 grid grid-cols-2 gap-6">
                    <div>
                      <p className="label-caps mb-2">Category</p>
                      <p className="type-infill">{project.category}</p>
                    </div>
                    <div>
                      <p className="label-caps mb-2">Year</p>
                      <p className="type-infill">{project.year}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="type-lead max-w-xl">
                {project.category} project from the {project.year} drawing set.
                Sheet {project.sheetRef} documents the built work within the
                academy portfolio index.
              </p>
            </div>
          </div>
        </PageContainer>
      </Section>
    </>
  );
}
