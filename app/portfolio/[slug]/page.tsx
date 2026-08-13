"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { GsapReveal, GsapStagger } from "@/components/animation/GsapReveal";
import { SplitTextReveal } from "@/components/animation/SplitTextReveal";
import { GridColumns } from "@/components/decorative/GridColumns";
import { MediaBay } from "@/components/decorative/MediaBay";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { ProjectGalleryStory } from "@/components/portfolio/ProjectGalleryStory";
import { AsyncState } from "@/components/feedback/AsyncState";
import { ApiClientError, apiGet } from "@/lib/api/client";
import type { Project } from "@/lib/api/types";

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">(
    "loading"
  );
  const [progress, setProgress] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

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
      .catch((error) => {
        if (cancelled) return;
        setStatus(
          error instanceof ApiClientError && error.status === 404
            ? "missing"
            : "error"
        );
      });
    return () => {
      cancelled = true;
    };
  }, [slug, reloadKey]);

  if (status === "missing") notFound();

  if (status === "error") {
    return (
      <PageContainer className="pt-32 pb-20">
        <AsyncState
          kind="error"
          title="The project sheet could not be loaded"
          message="Check your connection and try opening this project again."
          onRetry={() => {
            setStatus("loading");
            setReloadKey((value) => value + 1);
          }}
          actionHref="/portfolio"
          actionLabel="Portfolio index"
        />
      </PageContainer>
    );
  }

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
      <header className="page-header-warm relative overflow-hidden">
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

      <Section rhythm="compressed" contained={false} className="overflow-hidden">
        <PageContainer>
          <p className="label-caps text-charcoal-infill">Drawing set</p>
        </PageContainer>
        <div className="mt-4">
          <ProjectGalleryStory
            images={gallery}
            title={project.title}
            category={project.category}
            year={project.year}
            sheetRef={project.sheetRef}
          />
        </div>
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
