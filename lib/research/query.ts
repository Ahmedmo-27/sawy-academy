import type {
  ResearchCategory,
  ResearchPage,
  ResearchSort,
} from "@/lib/api/types";

export const RESEARCH_CATEGORIES = [
  "Published",
  "Conference",
  "Ongoing",
  "Book",
] as const satisfies readonly ResearchCategory[];

export const RESEARCH_SORTS = [
  "newest",
  "oldest",
  "title",
] as const satisfies readonly ResearchSort[];

export const EMPTY_RESEARCH_PAGE: ResearchPage = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 8,
  hasMore: false,
};

type SearchValue = string | string[] | undefined;

function first(value: SearchValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseResearchSearchParams(
  params: Record<string, SearchValue>
) {
  const rawQuery = first(params.q)?.trim().slice(0, 120) ?? "";
  const rawCategory = first(params.category);
  const rawSort = first(params.sort);
  return {
    query: rawQuery,
    category: RESEARCH_CATEGORIES.includes(rawCategory as ResearchCategory)
      ? (rawCategory as ResearchCategory)
      : undefined,
    sort: RESEARCH_SORTS.includes(rawSort as ResearchSort)
      ? (rawSort as ResearchSort)
      : ("newest" as const),
  };
}
