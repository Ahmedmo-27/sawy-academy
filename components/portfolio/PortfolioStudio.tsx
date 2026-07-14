"use client";

import { useMemo, useState } from "react";
import { GsapStagger } from "@/components/animation/GsapReveal";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import {
  portfolioProjects,
  portfolioFilters,
} from "@/lib/data/portfolio";

const spanMap = {
  tall: "col-span-full sm:col-span-1 lg:col-span-4 lg:row-span-2",
  wide: "col-span-full lg:col-span-8",
  square: "col-span-full sm:col-span-1 lg:col-span-4",
};

const aspectMap = {
  tall: "aspect-[3/4]",
  wide: "aspect-[16/9] lg:aspect-[2/1]",
  square: "aspect-square",
};

type Filter = (typeof portfolioFilters)[number];

export function PortfolioStudio() {
  const [active, setActive] = useState<Filter>("All");

  const filtered = useMemo(() => {
    if (active === "All") return portfolioProjects;
    return portfolioProjects.filter((p) => p.category === active);
  }, [active]);

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
                      sheetRef={project.sheetRef}
                      href={`/portfolio/${project.slug}`}
                      aspectClass={aspectMap[aspect]}
                    />
                  </div>
                );
              })}
            </GsapStagger>
            {filtered.length === 0 && (
              <p className="type-body py-16">No projects in this category.</p>
            )}
          </ThresholdFrame>
        </PageContainer>
      </Section>
    </>
  );
}
