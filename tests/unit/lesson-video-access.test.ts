import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { youtubeVideoId } = require("../../controllers/lessonController.js") as {
  youtubeVideoId: (value: string) => string | null;
};

describe("lesson video access helpers", () => {
  it("extracts IDs from supported YouTube URL formats", () => {
    expect(
      youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
    expect(
      youtubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("rejects non-YouTube and malformed video locations", () => {
    expect(
      youtubeVideoId("https://youtube.com.example.test/watch?v=dQw4w9WgXcQ")
    ).toBeNull();
    expect(youtubeVideoId("https://example.test/video.mp4")).toBeNull();
    expect(youtubeVideoId("not-a-youtube-id")).toBeNull();
  });
});
