"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GridColumns } from "@/components/decorative/GridColumns";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { getResearch } from "@/lib/api/research";
import type { Research } from "@/lib/api/types";

interface ResearchDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function ResearchDetailPage({ params }: ResearchDetailPageProps) {
  const { slug } = use(params);
  const [research, setResearch] = useState<Research | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    "loading"
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getResearch(slug, {
      onProgress: (value) => {
        if (!cancelled) setProgress(value);
      },
    })
      .then((data) => {
        if (cancelled) return;
        setResearch(data);
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

  if (status === "loading" || !research) {
    return (
      <PageContainer className="pt-32 pb-20">
        <SectionLoader
          label="Loading research…"
          stepLabel="Fetching publication sheet"
          progress={progress}
        />
      </PageContainer>
    );
  }

  const paragraphs = research.abstract.split(/\n\n+/).filter(Boolean);

  return (
    <>
      <header className="relative overflow-hidden">
        <GridColumns />
        <PageContainer className="relative z-10 pt-24 lg:pt-32 pb-8 lg:pb-12">
          <p className="eyebrow mb-3">
            Research · {research.category} · {research.year}
          </p>
          <h1 className="type-display max-w-4xl mb-8">{research.title}</h1>

          <div className="hairline-border p-6 lg:p-8 max-w-2xl bg-concrete/80">
            <ScaleBar scale="1:50" className="mb-6 max-w-[120px]" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <p className="label-caps mb-2">Category</p>
                <p className="type-infill">{research.category}</p>
              </div>
              <div>
                <p className="label-caps mb-2">Year</p>
                <p className="type-infill">{research.year}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="label-caps mb-2">Venue</p>
                <p className="type-infill">{research.venue}</p>
              </div>
            </div>
          </div>
        </PageContainer>
      </header>

      <ThresholdDoorway label={research.slug} />

      <Section rhythm="standard" contained={false}>
        <PageContainer>
          <ThresholdFrame label={`Abstract — ${research.title}`}>
            <article className="hairline-border p-6 lg:p-10 mt-4 max-w-3xl">
              <div className="space-y-6">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)} className="type-body">
                    {paragraph}
                  </p>
                ))}
              </div>

              {research.collaborators && (
                <div className="mt-10 hairline-t pt-8">
                  <p className="label-caps mb-2">Collaborators</p>
                  <p className="type-infill">{research.collaborators}</p>
                </div>
              )}

              <div className="mt-12">
                <Link href="/researches" className="action-secondary">
                  ← Research index
                </Link>
              </div>
            </article>
          </ThresholdFrame>
        </PageContainer>
      </Section>
    </>
  );
}
