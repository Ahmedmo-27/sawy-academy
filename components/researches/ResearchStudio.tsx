"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GsapStagger } from "@/components/animation/GsapReveal";
import { MediaBay } from "@/components/decorative/MediaBay";
import { PageContainer } from "@/components/layout/PageContainer";
import { Section } from "@/components/layout/Section";
import { SectionLoader } from "@/components/feedback/SectionLoader";
import { AsyncState } from "@/components/feedback/AsyncState";
import { listResearchPage } from "@/lib/api/research";
import type {
  ResearchCategory,
  ResearchPage,
  ResearchSort,
} from "@/lib/api/types";

const researchFilters = [
  "All",
  "Published",
  "Conference",
  "Ongoing",
  "Book",
] as const;
const sortOptions: Array<{ value: ResearchSort; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
];
const PAGE_SIZE = 8;

type Filter = (typeof researchFilters)[number];

interface ResearchStudioProps {
  initialPage: ResearchPage;
  initialQuery?: string;
  initialCategory?: Filter;
  initialSort?: ResearchSort;
  initialError?: boolean;
}

function excerpt(value: string, length = 280) {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trimEnd().replace(/[.,;:!?-]*$/, "")}…`;
}

function readLocationState() {
  const params = new URLSearchParams(window.location.search);
  const requestedCategory = params.get("category");
  const requestedSort = params.get("sort");
  return {
    query: params.get("q") ?? "",
    category: researchFilters.includes(requestedCategory as Filter)
      ? (requestedCategory as Filter)
      : "All",
    sort: sortOptions.some((option) => option.value === requestedSort)
      ? (requestedSort as ResearchSort)
      : "newest",
  };
}

export function ResearchStudio({
  initialPage,
  initialQuery = "",
  initialCategory = "All",
  initialSort = "newest",
  initialError = false,
}: ResearchStudioProps) {
  const [active, setActive] = useState<Filter>(initialCategory);
  const [researchPage, setResearchPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState(initialError);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<ResearchSort>(initialSort);
  const firstRender = useRef(true);
  const requestId = useRef(0);

  const loadPage = useCallback(
    async (
      page: number,
      options: {
        append?: boolean;
        query?: string;
        category?: Filter;
        sort?: ResearchSort;
      } = {}
    ) => {
      const id = ++requestId.current;
      const nextQuery = options.query ?? query;
      const nextCategory = options.category ?? active;
      const nextSort = options.sort ?? sort;
      setLoading(true);
      setLoadError(false);
      setProgress(0);
      try {
        const result = await listResearchPage(
          {
            q: nextQuery.trim() || undefined,
            category:
              nextCategory === "All"
                ? undefined
                : (nextCategory as ResearchCategory),
            sort: nextSort,
            page,
            limit: PAGE_SIZE,
          },
          { onProgress: setProgress }
        );
        if (id !== requestId.current) return;
        setResearchPage((current) => {
          if (!options.append) return result;
          const seen = new Set(current.items.map((item) => item.id));
          return {
            ...result,
            items: [
              ...current.items,
              ...result.items.filter((item) => !seen.has(item.id)),
            ],
          };
        });
      } catch {
        if (id === requestId.current) setLoadError(true);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [active, query, sort]
  );

  useEffect(() => {
    const onPopState = () => {
      const next = readLocationState();
      setQuery(next.query);
      setActive(next.category);
      setSort(next.sort);
      void loadPage(1, next);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [loadPage]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (active === "All") params.delete("category");
    else params.set("category", active);
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    if (sort === "newest") params.delete("sort");
    else params.set("sort", sort);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${params.size ? `?${params}` : ""}`
    );

    const timer = window.setTimeout(() => {
      void loadPage(1);
    }, query ? 350 : 0);
    return () => window.clearTimeout(timer);
  }, [active, loadPage, query, sort]);

  function clearFilters() {
    setQuery("");
    setActive("All");
    setSort("newest");
  }

  return (
    <>
      <Section rhythm="compressed" contained={false} className="hairline-b">
        <PageContainer>
          <div className="grid gap-5 pt-5 md:grid-cols-[minmax(0,1fr)_14rem] md:items-end">
            <label className="block">
              <span className="label-caps mb-2 block">Search research</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="form-control max-w-xl"
                placeholder="Title, author, DOI, venue, or topic"
              />
            </label>
            <label className="block">
              <span className="label-caps mb-2 block">Sort research</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as ResearchSort)}
                className="form-control"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <nav
            className="flex flex-wrap gap-x-8 gap-y-3 py-3"
            aria-label="Filter research"
          >
            {researchFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActive(filter)}
                aria-pressed={active === filter}
                className={`eyebrow min-h-11 py-2 transition-colors duration-200 ${
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
          <p className="label-caps mb-3" aria-live="polite" aria-atomic="true">
            {loading
              ? "Updating research results…"
              : `${researchPage.total} ${
                  researchPage.total === 1 ? "result" : "results"
                }`}
          </p>

          {loading && researchPage.items.length === 0 && (
            <SectionLoader
              label="Loading research…"
              stepLabel="Fetching publications"
              progress={progress}
            />
          )}
          {loadError && (
            <AsyncState
              kind="error"
              title="The research index could not be loaded"
              message="Check your connection and try loading the bibliography again."
              onRetry={() => void loadPage(1)}
            />
          )}
          {!loadError && researchPage.items.length > 0 && (
            <>
              <GsapStagger
                key={researchPage.items.map((item) => item.id).join("-")}
                className="space-y-0"
              >
                {researchPage.items.map((item, i) => (
                  <article
                    key={item.id}
                    className={`relative py-10 ${i > 0 ? "hairline-t" : ""}`}
                  >
                    <span className="label-caps absolute right-0 top-10 hidden text-clay lg:block">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                      <div className="lg:col-span-3">
                        <MediaBay
                          src={item.image}
                          alt={item.title}
                          className="aspect-[4/3] max-w-[18rem] sm:aspect-[4/5] sm:max-w-[14rem]"
                          fallback="research"
                          morph
                        />
                        <div className="mt-4 flex gap-4 lg:flex-col lg:gap-2">
                          <span className="label-caps">{item.category}</span>
                          <span className="label-caps">{item.year}</span>
                        </div>
                      </div>

                      <div className="lg:col-span-9 lg:pr-16">
                        <h2 className="type-title mb-3 leading-snug">
                          <Link
                            href={`/researches/${item.slug}`}
                            className="transition-colors duration-200 hover:text-clay"
                          >
                            {item.title}
                          </Link>
                        </h2>
                        <p className="label-caps mb-4">{item.venue}</p>
                        <p className="type-infill mb-4 leading-relaxed">
                          {excerpt(item.abstract)}
                        </p>
                        {(item.authors?.length || item.collaborators) && (
                          <p className="type-infill">
                            <span className="label-caps mr-2">
                              {item.authors?.length ? "By" : "With"}
                            </span>
                            {item.authors?.length
                              ? item.authors.join(", ")
                              : item.collaborators}
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
                ))}
              </GsapStagger>
              {researchPage.hasMore && (
                <div className="hairline-t pt-8 text-center">
                  <button
                    type="button"
                    className="action-primary min-h-11"
                    disabled={loading}
                    onClick={() =>
                      void loadPage(researchPage.page + 1, { append: true })
                    }
                  >
                    {loading ? "Loading…" : "Load more research"}
                  </button>
                </div>
              )}
            </>
          )}
          {!loading && !loadError && researchPage.items.length === 0 && (
            <AsyncState
              title="No matching research"
              message="Try a different search term, sort order, or publication category."
              onRetry={clearFilters}
            />
          )}
        </PageContainer>
      </Section>
    </>
  );
}
