import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ResearchCardMedia } from "@/components/researches/ResearchCardMedia";

vi.mock("@/components/decorative/ImageFrame", () => ({
  ImageFrame: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <div data-testid="image-frame" data-class={className}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/decorative/MediaBay", () => ({
  MediaBay: ({
    alt,
    src,
  }: {
    alt: string;
    src?: string | null;
  }) => <div role="img" aria-label={alt} data-src={src ?? ""} />,
}));

describe("ResearchCardMedia", () => {
  it("embeds valid pdf urls with hidden toolbar controls", () => {
    render(
      <ResearchCardMedia
        alt="Courtyard study"
        pdfUrl="https://example.com/research/courtyard.pdf"
      />
    );

    const iframe = screen.getByTitle("Courtyard study PDF preview");
    expect(iframe).toHaveAttribute(
      "src",
      "https://example.com/research/courtyard.pdf#toolbar=0&navpanes=0&scrollbar=0"
    );
    expect(screen.getByText("PDF")).toBeInTheDocument();
  });

  it("preserves existing hash params while forcing hidden toolbar controls", () => {
    render(
      <ResearchCardMedia
        alt="Delta study"
        pdfUrl="https://example.com/research/delta.pdf#page=3"
      />
    );

    const iframe = screen.getByTitle("Delta study PDF preview");
    const src = iframe.getAttribute("src") ?? "";
    expect(src).toContain("#");
    const hash = src.split("#")[1] ?? "";
    const hashParams = new URLSearchParams(hash);
    expect(hashParams.get("page")).toBe("3");
    expect(hashParams.get("toolbar")).toBe("0");
    expect(hashParams.get("navpanes")).toBe("0");
    expect(hashParams.get("scrollbar")).toBe("0");
  });

  it("falls back to image media when pdfUrl is missing or invalid", () => {
    const { rerender } = render(
      <ResearchCardMedia
        alt="Geometry review"
        image="https://example.com/cover.jpg"
      />
    );

    expect(screen.getByRole("img", { name: "Geometry review" })).toHaveAttribute(
      "data-src",
      "https://example.com/cover.jpg"
    );

    rerender(
      <ResearchCardMedia
        alt="Geometry review"
        image="https://example.com/cover.jpg"
        pdfUrl="ftp://example.com/file.pdf"
      />
    );

    expect(screen.queryByTitle("Geometry review PDF preview")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Geometry review" })).toBeInTheDocument();
  });
});
