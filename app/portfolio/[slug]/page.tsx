"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { GsapReveal, GsapStagger } from "@/components/animation/GsapReveal";
import { HorizontalPinGallery } from "@/components/animation/HorizontalPinGallery";
import { SplitTextReveal } from "@/components/animation/SplitTextReveal";
import { GridColumns } from "@/components/decorative/GridColumns";
import { MediaBay } from "@/components/decorative/MediaBay";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { apiGet } from "@/lib/api/client";
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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<Project>(`/api/portfolio/${slug}`, undefined, {
      onProgress: (value) => {
        if (!cancelled) setProgress(value);
      },
    })
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
        <SectionLoader
          label="Loading project…"
          stepLabel="Fetching project sheet"
          progress={progress}
          fullScreen
        />
      </PageContainer>
    );
  }

  const gallery =
    project.gallery && project.gallery.length > 0
      ? project.gallery
      : [project.image];
  const showBeforeAfter = Boolean(project.beforeImage || project.afterImage);

  return (
    <>
      <header className="relative overflow-hidden">
        <GridColumns />
        <PageContainer className="relative z-10 pt-24 lg:pt-32 pb-0">
          <GsapReveal type="text" immediate>
            <p className="eyebrow mb-3">Portfolio · {project.sheetRef}</p>
          </GsapReveal>
          <SplitTextReveal type="lines" immediate>
            <h1 className="type-display max-w-4xl mb-8">{project.title}</h1>
          </SplitTextReveal>

          <ThresholdFrame label={`Sheet — ${project.sheetRef}`}>
            <MediaBay
              src={project.image}
              alt={project.title}
              className="aspect-[16/10] lg:aspect-[21/9] mt-4"
              fallback="plan"
              morph
              priority
              revealOnLoad
              sizes="100vw"
            />
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
              <GsapReveal type="text">
                <p className="type-lead max-w-xl">
                  {project.category} project from the {project.year} drawing set.
                  Sheet {project.sheetRef} documents the built work within the
                  academy portfolio index.
                </p>
              </GsapReveal>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section rhythm="standard" contained={false}>
        <PageContainer>
          <ThresholdFrame label="Drawing set">
            <div className="pt-6">
              <HorizontalPinGallery>
                {gallery.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="w-[min(90vw,28rem)] shrink-0 sm:w-[min(48vw,36rem)]"
                  >
                    <MediaBay
                      src={src}
                      alt={`${project.title} plate ${index + 1}`}
                      className="aspect-[4/3] sm:aspect-[4/5]"
                      fallback="plan"
                      morph
                      sizes="(min-width: 1024px) 36rem, 90vw"
                    />
                  </div>
                ))}
              </HorizontalPinGallery>
            </div>
          </ThresholdFrame>
        </PageContainer>
      </Section>

      {showBeforeAfter && (
        <Section rhythm="intimate" contained={false}>
          <PageContainer>
            <ThresholdFrame label="Before / After">
              <GsapStagger className="grid grid-cols-1 gap-px bg-hairline pt-6 md:grid-cols-2">
                <div className="bg-concrete p-5 sm:p-6">
                  <p className="label-caps mb-3">Before</p>
                  <MediaBay
                    src={project.beforeImage}
                    alt={`${project.title} before`}
                    className="aspect-[4/3]"
                    fallback="plan"
                    morph
                  />
                </div>
                <div className="bg-concrete p-5 sm:p-6">
                  <p className="label-caps mb-3">After</p>
                  <MediaBay
                    src={project.afterImage}
                    alt={`${project.title} after`}
                    className="aspect-[4/3]"
                    fallback="plan"
                    morph
                  />
                </div>
              </GsapStagger>
            </ThresholdFrame>
          </PageContainer>
        </Section>
      )}
    </>
  );
}
