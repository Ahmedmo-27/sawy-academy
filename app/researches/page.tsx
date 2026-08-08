import type { Metadata } from "next";
import { CmsPageHeader } from "@/components/cms/CmsPageHeader";
import { ResearchStudio } from "@/components/researches/ResearchStudio";
import { ThresholdDoorway } from "@/components/layout/ThresholdDoorway";
import { getServerResearchPage } from "@/lib/api/research.server";
import {
  EMPTY_RESEARCH_PAGE,
  parseResearchSearchParams,
} from "@/lib/research/query";

export const metadata: Metadata = {
  title: "Architecture Research",
  description:
    "Read architecture research, publications, and conference work from Sawy Academy.",
  alternates: { canonical: "/researches" },
};

interface ResearchesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ResearchesPage({
  searchParams,
}: ResearchesPageProps) {
  const filters = parseResearchSearchParams(await searchParams);
  let initialPage = EMPTY_RESEARCH_PAGE;
  let initialError = false;
  try {
    initialPage = await getServerResearchPage({
      q: filters.query || undefined,
      category: filters.category,
      sort: filters.sort,
      page: 1,
      limit: 8,
    });
  } catch {
    initialError = true;
  }

  return (
    <>
      <CmsPageHeader pageKey="researches" />

      <ThresholdDoorway label="BIBLIOGRAPHY INDEX" />

      <ResearchStudio
        initialPage={initialPage}
        initialQuery={filters.query}
        initialCategory={filters.category ?? "All"}
        initialSort={filters.sort}
        initialError={initialError}
      />
    </>
  );
}
