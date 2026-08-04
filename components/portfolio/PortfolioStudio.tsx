"use client";

import { useEffect, useMemo, useState } from "react";
import { GsapStagger } from "@/components/animation/GsapReveal";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { listProjects } from "@/lib/api/portfolio";
import type { Project, ProjectCategory } from "@/lib/api/types";

const portfolioFilters = [
  "All",
  "Buildings",
  "Interiors",
  "Furniture",
  "Competitions",
] as const;

const spanMap = {
  tall: "col-span-12 md:col-span-6 lg:col-span-4 lg:row-span-2",
  wide: "col-span-12 lg:col-span-8",
  square: "col-span-12 md:col-span-6 lg:col-span-4",
};

const aspectMap = {
  tall: "aspect-[3/4]",
  wide: "aspect-[16/9] lg:aspect-[2/1]",
  square: "aspect-square",
};

type Filter = (typeof portfolioFilters)[number];

export function PortfolioStudio() {
  const [active, setActive] = useState<Filter>("All");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((data) => {
        if (!cancelled) {
          setProjects(
            [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          );
        }
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (active === "All") return projects;
    return projects.filter((p) => p.category === (active as ProjectCategory));
  }, [active, projects]);

  return (
    <>
      <Section rhythm="compressed" contained={false} className="hairline-b">
        <PageContainer>
          <nav
            className="flex flex-wrap gap-x-8 gap-y-2 py-2"
            aria-label="Filter projects"
          >
            {portfolioFilters.map((filter) => (
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

      <Section rhythm="atrium" contained={false}>
        <PageContainer>
          <ThresholdFrame label="Bay 02 — Project Grid">
            {loading ? (
              <p className="type-body py-16">Loading projects…</p>
            ) : (
              <>
                <GsapStagger
                  key={filtered.map((p) => p.id).join("-")}
                  className="bay-grid pt-6 auto-rows-fr"
                >
                  {filtered.map((project) => {
                    const aspect = project.aspect ?? "square";
                    return (
                      <div
                        key={project.id}
                        className={`${spanMap[aspect]} bg-concrete`}
                      >
                        <ProjectCard
                          title={project.title}
                          category={project.category}
                          year={project.year}
                          image={project.image}
                          sheetRef={project.sheetRef ?? ""}
                          href={`/portfolio/${project.slug}`}
                          aspectClass={aspectMap[aspect]}
                        />
                      </div>
                    );
                  })}
                </GsapStagger>
                {filtered.length === 0 && (
                  <p className="type-body py-16">
                    No projects in this category.
                  </p>
                )}
              </>
            )}
          </ThresholdFrame>
        </PageContainer>
      </Section>
    </>
  );
}
