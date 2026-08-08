"use client";

import { useEffect, useMemo, useState } from "react";
import { GsapStagger } from "@/components/animation/GsapReveal";
import { FeaturedProjectStory } from "@/components/portfolio/FeaturedProjectStory";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { AsyncState } from "@/components/feedback/AsyncState";
import { apiGet } from "@/lib/api/client";
import type { Project, ProjectCategory } from "@/lib/api/types";
import { fuzzySearch } from "@/lib/search/fuzzy";

const portfolioFilters = [
  "All",
  "Buildings",
  "Interiors",
  "Furniture",
  "Competitions",
] as const;

const spanMap = {
  tall: "col-span-12 md:col-span-6 lg:col-span-5",
  wide: "col-span-12 lg:col-span-7",
  square: "col-span-12 md:col-span-6 lg:col-span-5",
};

const aspectMap = {
  tall: "aspect-[4/5]",
  wide: "aspect-[16/10]",
  square: "aspect-[4/5] lg:aspect-square",
};

type Filter = (typeof portfolioFilters)[number];

export function PortfolioStudio() {
  const [active, setActive] = useState<Filter>("All");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedFilter = params.get("category");
    if (portfolioFilters.includes(requestedFilter as Filter)) {
      setActive(requestedFilter as Filter);
    }
    setQuery(params.get("q") ?? "");
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    apiGet<Project[]>("/api/portfolio", { limit: 500 }, {
      onProgress: (value) => {
        if (!cancelled) setProgress(value);
      },
    })
      .then((data) => {
        if (!cancelled) {
          setProjects(
            [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjects([]);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const featured = useMemo(() => projects.slice(0, 4), [projects]);

  const filtered = useMemo(() => {
    const categoryItems =
      active === "All"
        ? projects
        : projects.filter((p) => p.category === (active as ProjectCategory));
    if (!query.trim()) return categoryItems;
    return fuzzySearch(categoryItems, query, (project) => [
      project.title,
      project.category,
      project.year,
      project.sheetRef,
    ]);
  }, [active, projects, query]);

  function updateFilters(nextFilter: Filter, nextQuery = query) {
    setActive(nextFilter);
    setQuery(nextQuery);
    const params = new URLSearchParams(window.location.search);
    if (nextFilter === "All") params.delete("category");
    else params.set("category", nextFilter);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    else params.delete("q");
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  }

  return (
    <>
      {!loading && featured.length > 0 && (
        <PageContainer>
          <FeaturedProjectStory
            projects={featured}
            totalProjects={projects.length}
          />
        </PageContainer>
      )}

      <section className="z-20 border-y border-hairline bg-concrete/95 nav-blur lg:sticky lg:top-[var(--nav-height)]">
        <PageContainer>
          <div className="flex min-h-[44px] min-w-0 items-center justify-between gap-3 py-2 sm:gap-4 sm:py-0">
            <p className="label-caps min-w-0 truncate">
              {active === "All" ? "All projects" : active}
              {query.trim() ? ` · “${query.trim()}”` : ""}
            </p>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="portfolio-filters"
              className="flex min-h-8 shrink-0 items-center gap-3 border-l border-hairline pl-3 text-charcoal transition-colors hover:text-clay sm:pl-4"
            >
              <span
                className="eyebrow text-current"
              >
                Filter
              </span>
              <span
                className={`text-base transition-transform duration-300 ${
                  filtersOpen ? "rotate-45" : ""
                }`}
                aria-hidden="true"
              >
                +
              </span>
            </button>
          </div>

          {filtersOpen && (
            <div
              id="portfolio-filters"
              className="grid grid-cols-1 gap-3 border-t border-hairline py-3 lg:grid-cols-[1fr_18rem] lg:items-end lg:gap-8"
            >
              <nav
                className="flex min-w-0 gap-5 overflow-x-auto overscroll-x-contain sm:gap-7"
                aria-label="Filter projects"
              >
                {portfolioFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => updateFilters(filter)}
                    aria-pressed={active === filter}
                    className={`eyebrow shrink-0 py-2 transition-colors duration-200 ${
                      active === filter
                        ? "text-clay"
                        : "text-charcoal-infill hover:text-charcoal"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </nav>
              <label className="relative block">
                <span className="sr-only">Search projects</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => updateFilters(active, event.target.value)}
                  className="w-full border-0 border-b border-hairline bg-transparent py-2 pr-8 text-sm text-charcoal placeholder:text-charcoal-infill/60 focus:border-clay"
                  placeholder="Search the archive"
                />
                <span
                  className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-charcoal-infill"
                  aria-hidden="true"
                >
                  ⌕
                </span>
              </label>
            </div>
          )}
        </PageContainer>
      </section>

      <Section rhythm="atrium" contained={false}>
        <PageContainer>
          <div className="mb-10 grid grid-cols-1 gap-4 border-b border-charcoal pb-4 sm:grid-cols-2 sm:items-end">
            <div>
              <p className="eyebrow mb-2 text-clay">Complete archive</p>
              <h2 className="font-serif text-3xl font-light sm:text-4xl">
                {active === "All" ? "All projects" : active}
              </h2>
            </div>
            <p
              className="label-caps sm:text-right"
              aria-live="polite"
            >
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
              {query.trim() ? ` for “${query.trim()}”` : ""}
            </p>
          </div>

          {loading ? (
            <SectionLoader
              label="Loading projects…"
              stepLabel="Fetching portfolio"
              progress={progress}
            />
          ) : loadError ? (
            <AsyncState
              kind="error"
              title="The portfolio could not be loaded"
              message="Check your connection and try the project index again."
              onRetry={() => setReloadKey((value) => value + 1)}
            />
          ) : (
            <>
              <GsapStagger
                key={filtered.map((p) => p.id).join("-")}
                className="grid min-w-0 max-w-full grid-cols-12 gap-x-0 gap-y-10 sm:gap-x-5 sm:gap-y-12 lg:gap-x-10 lg:gap-y-16"
              >
                {filtered.map((project) => {
                  const aspect = project.aspect ?? "square";
                  return (
                    <div
                      key={project.id}
                      className={`min-w-0 max-w-full ${spanMap[aspect]}`}
                    >
                      <ProjectCard
                        title={project.title}
                        category={project.category}
                        year={project.year}
                        image={project.image}
                        sheetRef={project.sheetRef ?? ""}
                        href={`/portfolio/${project.slug}`}
                        aspectClass={aspectMap[aspect]}
                        index={projects.findIndex((item) => item.id === project.id)}
                      />
                    </div>
                  );
                })}
              </GsapStagger>
              {filtered.length === 0 && (
                <AsyncState
                  className="mt-6"
                  title="No matching projects"
                  message="Try a different search term or project category."
                  onRetry={() => updateFilters("All", "")}
                />
              )}
            </>
          )}
        </PageContainer>
      </Section>
    </>
  );
}
