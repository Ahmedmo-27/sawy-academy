import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  WEBSITE_ASSET_PAGES,
  buildLessonDocKey,
  buildWebsiteAssetKey,
  normalizeWebsitePage,
} = require("../../lib/r2ObjectKeys.js") as {
  WEBSITE_ASSET_PAGES: string[];
  buildLessonDocKey: (
    courseId: string,
    lessonId: string,
    assetId: string,
    filename: string
  ) => string;
  buildWebsiteAssetKey: (input: {
    page?: string;
    entityId?: string;
    filename?: string;
  }) => string;
  normalizeWebsitePage: (page: string) => string;
};

describe("r2 object keys", () => {
  it("builds website-assets keys under an allowlisted page", () => {
    const key = buildWebsiteAssetKey({
      page: "Home",
      filename: "../../Hero Shot.PNG",
    });

    expect(key).toMatch(
      /^website-assets\/home\/\d+-[a-z0-9]+-Hero-Shot\.png$/
    );
    expect(key).not.toContain("..");
  });

  it("nests website-assets under an entity id when provided", () => {
    const key = buildWebsiteAssetKey({
      page: "courses",
      entityId: "64f1a2b3c4d5e6f7a8b9c0d1",
      filename: "cover.jpg",
    });

    expect(key).toMatch(
      /^website-assets\/courses\/64f1a2b3c4d5e6f7a8b9c0d1\/\d+-[a-z0-9]+-cover\.jpg$/
    );
  });

  it("rejects unknown website-assets pages", () => {
    expect(() => normalizeWebsitePage("home page")).toThrow(/Invalid/);
    expect(WEBSITE_ASSET_PAGES).toContain("shared");
  });

  it("builds private docs keys with ObjectId segments", () => {
    const key = buildLessonDocKey(
      "course/../one",
      "lesson two",
      "asset id",
      "Week 1 Notes.PDF"
    );

    expect(key).toBe(
      "docs/course-one/lesson-two/asset-id/Week-1-Notes.pdf"
    );
    expect(key).not.toContain("..");
  });

  it("builds private payment proof keys under the user id", () => {
    const {
      buildPaymentProofKey,
      isPaymentProofObjectKey,
    } = require("../../lib/r2ObjectKeys.js") as {
      buildPaymentProofKey: (userId: string, filename: string) => string;
      isPaymentProofObjectKey: (key: string, userId?: string) => boolean;
    };

    const key = buildPaymentProofKey(
      "64f1a2b3c4d5e6f7a8b9c0d1",
      "InstaPay Shot.JPG"
    );

    expect(key).toMatch(
      /^payments\/64f1a2b3c4d5e6f7a8b9c0d1\/\d+-[a-z0-9]+-InstaPay-Shot\.jpg$/
    );
    expect(
      isPaymentProofObjectKey(key, "64f1a2b3c4d5e6f7a8b9c0d1")
    ).toBe(true);
    expect(isPaymentProofObjectKey(key, "other-user")).toBe(false);
  });

  it("builds private service-reference keys under guest-{name}", () => {
    const {
      buildGuestServiceReferenceOwner,
      buildServiceReferenceKey,
      isServiceReferenceObjectKey,
    } = require("../../lib/r2ObjectKeys.js") as {
      buildGuestServiceReferenceOwner: (name: string) => string;
      buildServiceReferenceKey: (
        ownerSegment: string,
        filename: string
      ) => string;
      isServiceReferenceObjectKey: (
        key: string,
        ownerSegment?: string
      ) => boolean;
    };

    const owner = buildGuestServiceReferenceOwner("Jane Doe");
    expect(owner).toBe("guest-Jane-Doe");

    const key = buildServiceReferenceKey(owner, "Site Photo.PNG");
    expect(key).toMatch(
      /^service-references\/guest-Jane-Doe\/\d+-[a-z0-9]+-Site-Photo\.png$/
    );
    expect(isServiceReferenceObjectKey(key, owner)).toBe(true);
  });

  it("rejects putting lesson video or docs concepts on the public key builder", () => {
    expect(() => normalizeWebsitePage("docs")).toThrow(/Invalid/);
    expect(() => normalizeWebsitePage("video-assets")).toThrow(/Invalid/);
    expect(() => normalizeWebsitePage("videos")).toThrow(/Invalid/);
    expect(() =>
      buildWebsiteAssetKey({ page: "docs", filename: "notes.pdf" })
    ).toThrow(/Invalid/);
  });
});

describe("video asset object keys", () => {
  const {
    buildVideoAssetOutputPrefix,
    buildVideoAssetSourceKey,
    buildVideoObjectKey,
  } = require("../../lib/videoAccess.js") as {
    buildVideoAssetOutputPrefix: (
      courseId: string,
      lessonId: string,
      assetId: string
    ) => string;
    buildVideoAssetSourceKey: (
      courseId: string,
      lessonId: string,
      assetId: string,
      filename: string
    ) => string;
    buildVideoObjectKey: (
      courseId: string,
      lessonId: string,
      filename: string
    ) => string;
  };

  it("builds private video-assets source keys with ObjectId segments", () => {
    const key = buildVideoAssetSourceKey(
      "64f1a2b3c4d5e6f7a8b9c0d1",
      "64f1a2b3c4d5e6f7a8b9c0d2",
      "64f1a2b3c4d5e6f7a8b9c0d3",
      "Week 1 Intro.MP4"
    );

    expect(key).toBe(
      "video-assets/64f1a2b3c4d5e6f7a8b9c0d1/64f1a2b3c4d5e6f7a8b9c0d2/64f1a2b3c4d5e6f7a8b9c0d3/source/Week-1-Intro.mp4"
    );
    expect(key).not.toContain("..");
    expect(key.startsWith("videos/")).toBe(false);
  });

  it("builds the HLS output prefix under the same asset folder", () => {
    const prefix = buildVideoAssetOutputPrefix(
      "64f1a2b3c4d5e6f7a8b9c0d1",
      "64f1a2b3c4d5e6f7a8b9c0d2",
      "64f1a2b3c4d5e6f7a8b9c0d3"
    );

    expect(prefix).toBe(
      "video-assets/64f1a2b3c4d5e6f7a8b9c0d1/64f1a2b3c4d5e6f7a8b9c0d2/64f1a2b3c4d5e6f7a8b9c0d3/hls/"
    );
  });

  it("keeps the legacy videos/ helper unused for new uploads", () => {
    const legacy = buildVideoObjectKey(
      "64f1a2b3c4d5e6f7a8b9c0d1",
      "64f1a2b3c4d5e6f7a8b9c0d2",
      "old.mp4"
    );
    expect(legacy).toMatch(
      /^videos\/64f1a2b3c4d5e6f7a8b9c0d1\/64f1a2b3c4d5e6f7a8b9c0d2\/\d+-[a-z0-9]+-old\.mp4$/
    );
    expect(legacy.startsWith("video-assets/")).toBe(false);
  });
});

