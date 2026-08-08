import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResearchStudio } from "@/components/researches/ResearchStudio";
import {
  EMPTY_RESEARCH_PAGE,
  parseResearchSearchParams,
} from "@/lib/research/query";
import type { Research, ResearchPage } from "@/lib/api/types";

const listResearchPage = vi.fn();

vi.mock("@/lib/api/research", () => ({
  listResearchPage: (...args: unknown[]) => listResearchPage(...args),
}));

vi.mock("@/components/animation/GsapReveal", () => ({
  GsapStagger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/decorative/MediaBay", () => ({
  MediaBay: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} />,
}));

const research: Research = {
  id: "r1",
  slug: "courtyard-study",
  title: "Courtyard Study",
  year: "2024",
  category: "Published",
  venue: "Architecture Journal",
  abstract: "A".repeat(320),
  authors: ["Ahmed Sawy"],
  keywords: ["courtyards"],
};

const initialPage: ResearchPage = {
  items: [research],
  total: 1,
  page: 1,
  pageSize: 8,
  hasMore: false,
};

describe("research query parsing", () => {
  it("normalizes unknown filters and bounds search text", () => {
    const parsed = parseResearchSearchParams({
      q: `  ${"x".repeat(140)}  `,
      category: "Unknown",
      sort: "invalid",
    });

    expect(parsed.query).toHaveLength(120);
    expect(parsed.category).toBeUndefined();
    expect(parsed.sort).toBe("newest");
  });

  it("accepts supported category and sort values", () => {
    expect(
      parseResearchSearchParams({
        category: "Conference",
        sort: "oldest",
      })
    ).toMatchObject({ category: "Conference", sort: "oldest" });
  });
});

describe("ResearchStudio", () => {
  beforeEach(() => {
    listResearchPage.mockReset();
    window.history.replaceState(null, "", "/researches");
  });

  it("renders server-provided results with a concise abstract", () => {
    render(<ResearchStudio initialPage={initialPage} />);

    expect(screen.getByText("1 result")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Courtyard Study" })
    ).toHaveAttribute("href", "/researches/courtyard-study");
    expect(screen.queryByText("A".repeat(320))).not.toBeInTheDocument();
    expect(screen.getByText(`${"A".repeat(280)}…`)).toBeInTheDocument();
  });

  it("requests filtered results and keeps the category in the URL", async () => {
    listResearchPage.mockResolvedValue({
      ...EMPTY_RESEARCH_PAGE,
      pageSize: 8,
    });
    render(<ResearchStudio initialPage={initialPage} />);

    fireEvent.click(screen.getByRole("button", { name: "Conference" }));

    await waitFor(() =>
      expect(listResearchPage).toHaveBeenCalledWith(
        expect.objectContaining({ category: "Conference", page: 1 }),
        expect.any(Object)
      )
    );
    expect(window.location.search).toContain("category=Conference");
    expect(
      await screen.findByText("No matching research")
    ).toBeInTheDocument();
  });

  it("restores filters when browser history changes", async () => {
    listResearchPage.mockResolvedValue(initialPage);
    render(<ResearchStudio initialPage={initialPage} />);

    window.history.pushState(
      null,
      "",
      "/researches?category=Book&sort=title&q=geometry"
    );
    window.dispatchEvent(new PopStateEvent("popstate"));

    await waitFor(() =>
      expect(listResearchPage).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "Book",
          sort: "title",
          q: "geometry",
        }),
        expect.any(Object)
      )
    );
    expect(screen.getByRole("searchbox")).toHaveValue("geometry");
  });
});
