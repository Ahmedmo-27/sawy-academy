"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { apiGet } from "@/lib/api/client";
import type { Research, ResearchCategory } from "@/lib/api/types";

const researchFilters = [
  "All",
  "Published",
  "Conference",
  "Ongoing",
  "Book",
] as const;

type Filter = (typeof researchFilters)[number];

export function ResearchStudio() {
  const [active, setActive] = useState<Filter>("All");
  const [researches, setResearches] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<Research[]>("/api/research", undefined, {
      onProgress: (value) => {
        if (!cancelled) setProgress(value);
      },
    })
      .then((data) => {
        if (!cancelled) setResearches(data);
      })
      .catch(() => {
        if (!cancelled) setResearches([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (active === "All") return researches;
    return researches.filter(
      (item) => item.category === (active as ResearchCategory)
    );
  }, [active, researches]);

  return (
    <>
      <Section rhythm="compressed" contained={false} className="hairline-b">
        <PageContainer>
          <nav
            className="flex flex-wrap gap-x-8 gap-y-2 py-2"
            aria-label="Filter research"
          >
            {researchFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActive(filter)}
                aria-pressed={active === filter}
                className={`eyebrow py-2 transition-colors duration-200 ${
                  active === filter
                    ? "text-clay"
                    : "text-charcoal-infill hover:text-charcoal"
                }`}
              >
                {filter}
              </button>
            ))}
          </nav>
        </PageContainer>
      </Section>

      <Section rhythm="standard" contained={false}>
        <PageContainer>
          <div className="max-w-3xl">
            {loading && (
              <SectionLoader
                label="Loading research…"
                stepLabel="Fetching publications"
                progress={progress}
              />
            )}
            {!loading &&
              filtered.map((item, i) => (
                <Reveal key={item.id} variant="grid" delay={i * 50}>
                  <article
                    className={`py-10 ${i > 0 ? "hairline-t" : ""} relative`}
                  >
                    <span className="label-caps text-clay absolute top-10 right-0 hidden lg:block">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
                      <div className="lg:col-span-3 flex gap-4 lg:flex-col lg:gap-2">
                        <span className="label-caps">{item.category}</span>
                        <span className="label-caps">{item.year}</span>
                      </div>

                      <div className="lg:col-span-9 lg:pr-16">
                        <h2 className="type-title mb-3 leading-snug">
                          <Link
                            href={`/researches/${item.slug}`}
                            className="hover:text-clay transition-colors duration-200"
                          >
                            {item.title}
                          </Link>
                        </h2>
                        <p className="label-caps mb-4">{item.venue}</p>
                        <p className="type-infill leading-relaxed mb-4">
                          {item.abstract}
                        </p>
                        {item.collaborators && (
                          <p className="type-infill">
                            <span className="label-caps mr-2">With</span>
                            {item.collaborators}
                          </p>
                        )}
                        <Link
                          href={`/researches/${item.slug}`}
                          className="action-secondary mt-4 inline-block"
                        >
                          Open research sheet
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            {!loading && filtered.length === 0 && (
              <p className="type-body py-16">No entries in this category.</p>
            )}
          </div>
        </PageContainer>
      </Section>
    </>
  );
}
