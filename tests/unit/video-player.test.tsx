import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "@/components/media/VideoPlayer";

const hlsState = vi.hoisted(() => ({
  instances: [] as Array<{
    config: { xhrSetup: (xhr: XMLHttpRequest, url: string) => void };
    handlers: Record<string, (...args: unknown[]) => void>;
    loadSource: ReturnType<typeof vi.fn>;
    startLoad: ReturnType<typeof vi.fn>;
    recoverMediaError: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock("hls.js", () => {
  type HlsConfig = {
    xhrSetup: (xhr: XMLHttpRequest, url: string) => void;
  };

  class MockHls {
    static isSupported = () => true;
    config: HlsConfig;
    handlers: Record<string, (...args: unknown[]) => void> = {};
    loadSource = vi.fn();
    startLoad = vi.fn();
    recoverMediaError = vi.fn();
    destroy = vi.fn();

    constructor(config: HlsConfig) {
      this.config = config;
      hlsState.instances.push(this);
    }

    on(event: string, handler: (...args: unknown[]) => void) {
      this.handlers[event] = handler;
    }

    attachMedia(video: HTMLVideoElement) {
      video.src = "blob:https://localhost/protected-media-source";
      this.handlers.mediaAttached?.();
    }
  }

  return {
    default: MockHls,
    ErrorTypes: { NETWORK_ERROR: "networkError", MEDIA_ERROR: "mediaError" },
    Events: {
      ERROR: "error",
      MANIFEST_PARSED: "manifestParsed",
      MEDIA_ATTACHED: "mediaAttached",
    },
  };
});

const manifestUrl = "/api/lessons/lesson-1/manifest";

describe("VideoPlayer", () => {
  it("attaches HLS through a blob MediaSource URL and keeps deterrents", async () => {
    render(
      <VideoPlayer
        manifestUrl={manifestUrl}
        title="Drawing foundations"
        watermarkText="student@example.com"
        onRefreshManifest={vi.fn()}
      />
    );

    const video = screen.getByLabelText("Drawing foundations video");
    expect(video.tagName).toBe("VIDEO");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("controlslist", "nodownload nofullscreen");
    expect(video).toHaveAttribute("draggable", "false");
    expect(screen.getByText("student@example.com")).toBeInTheDocument();
    await waitFor(() =>
      expect(video).toHaveAttribute(
        "src",
        "blob:https://localhost/protected-media-source"
      )
    );
    expect(hlsState.instances.at(-1)?.loadSource).toHaveBeenCalledWith(
      manifestUrl
    );
  });

  it("sends credentials only to same-origin HLS resources", () => {
    render(
      <VideoPlayer
        manifestUrl={manifestUrl}
        title="Drawing foundations"
        watermarkText="student@example.com"
        onRefreshManifest={vi.fn()}
      />
    );
    const setup = hlsState.instances.at(-1)!.config.xhrSetup;
    const sameOrigin = { withCredentials: false } as XMLHttpRequest;
    const workerSegment = { withCredentials: true } as XMLHttpRequest;

    setup(sameOrigin, "/api/lessons/lesson-1/hls-key");
    setup(workerSegment, "https://media.example.com/media?grant=token");

    expect(sameOrigin.withCredentials).toBe(true);
    expect(workerSegment.withCredentials).toBe(false);
  });

  it("bounds network recovery before refreshing the manifest", async () => {
    const onRefreshManifest = vi.fn().mockResolvedValue(manifestUrl);
    render(
      <VideoPlayer
        manifestUrl={manifestUrl}
        title="Drawing foundations"
        watermarkText="student@example.com"
        onRefreshManifest={onRefreshManifest}
      />
    );
    const instance = hlsState.instances.at(-1)!;

    instance.handlers.error?.("error", {
      fatal: true,
      type: "networkError",
    });
    expect(instance.startLoad).toHaveBeenCalledTimes(1);

    instance.handlers.error?.("error", {
      fatal: true,
      type: "networkError",
    });
    await waitFor(() => expect(onRefreshManifest).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(instance.destroy).toHaveBeenCalledTimes(1));
  });

  it("rejects non-HTTPS playback locations", () => {
    render(
      <VideoPlayer
        manifestUrl="http://example.com/manifest.m3u8"
        title="Drawing foundations"
        watermarkText="student@example.com"
        onRefreshManifest={vi.fn()}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This recording is temporarily unavailable."
    );
    expect(
      screen.queryByLabelText("Drawing foundations video")
    ).not.toBeInTheDocument();
  });
});
