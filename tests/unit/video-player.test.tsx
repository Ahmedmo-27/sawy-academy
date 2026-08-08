import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VideoPlayer } from "@/components/media/VideoPlayer";

const embedUrl =
  "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?modestbranding=1&rel=0&disablekb=0&fs=1";

describe("VideoPlayer", () => {
  it("uses the privacy-enhanced player with accessible controls enabled", () => {
    render(
      <VideoPlayer
        embedUrl={embedUrl}
        title="Drawing foundations"
        watermarkText="student@example.com"
      />
    );

    expect(screen.queryByTitle("Drawing foundations video")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load lesson recording" }));

    const iframe = screen.getByTitle("Drawing foundations video");
    const src = new URL(iframe.getAttribute("src") || "");
    expect(src.hostname).toBe("www.youtube-nocookie.com");
    expect(src.searchParams.get("modestbranding")).toBe("1");
    expect(src.searchParams.get("rel")).toBe("0");
    expect(src.searchParams.get("disablekb")).toBe("0");
    expect(src.searchParams.get("fs")).toBe("1");
    expect(iframe).toHaveAttribute("allowfullscreen");
  });

  it("does not render an iframe for an untrusted embed origin", () => {
    render(
      <VideoPlayer
        embedUrl="https://example.com/embed/dQw4w9WgXcQ"
        title="Drawing foundations"
        watermarkText="student@example.com"
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This recording is temporarily unavailable."
    );
    expect(screen.queryByTitle("Drawing foundations video")).not.toBeInTheDocument();
  });
});
