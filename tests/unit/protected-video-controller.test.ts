import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  assertAllowedSource,
  assertCanonicalAssetLocation,
  grantMatchesExpected,
  resolveRelativePath,
  rewriteMaster,
  rewriteVariant,
} = require("../../controllers/protectedVideoController.js") as {
  assertAllowedSource: (request: Record<string, unknown>) => void;
  assertCanonicalAssetLocation: (
    course: { _id: string },
    lesson: { _id: string },
    asset: Record<string, unknown>
  ) => string;
  grantMatchesExpected: (
    claims: Record<string, unknown>,
    expected: Record<string, unknown>,
    scope: string
  ) => boolean;
  resolveRelativePath: (
    base: string,
    uri: string,
    extension: RegExp
  ) => string;
  rewriteMaster: (
    manifest: string,
    lesson: { _id: string },
    asset: Record<string, unknown>
  ) => string;
  rewriteVariant: (
    manifest: string,
    request: Record<string, unknown>,
    course: { _id: string },
    lesson: { _id: string },
    asset: Record<string, unknown>,
    variant: string
  ) => string;
};

const originalEnvironment = {
  VIDEO_ALLOWED_ORIGINS: process.env.VIDEO_ALLOWED_ORIGINS,
  VIDEO_MEDIA_BASE_URL: process.env.VIDEO_MEDIA_BASE_URL,
  VIDEO_MEDIA_GRANT_SECRET: process.env.VIDEO_MEDIA_GRANT_SECRET,
};

afterEach(() => {
  for (const [name, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

const ids = {
  user: "111111111111111111111111",
  session: "222222222222222222222222",
  course: "333333333333333333333333",
  lesson: "444444444444444444444444",
  asset: "555555555555555555555555",
};

function context() {
  const outputPrefix =
    `video-assets/${ids.course}/${ids.lesson}/${ids.asset}/hls/`;
  return {
    request: {
      auth: {
        userId: ids.user,
        sessionId: ids.session,
        deviceId: "device-one",
      },
    },
    course: { _id: ids.course },
    lesson: { _id: ids.lesson },
    asset: {
      _id: ids.asset,
      generation: 2,
      outputPrefix,
      masterPlaylistObjectKey: `${outputPrefix}master.m3u8`,
      renditions: [
        {
          playlistObjectKey: `${outputPrefix}720p/index.m3u8`,
        },
      ],
    },
  };
}

describe("protected manifest helpers", () => {
  it.each([
    "../segment.ts",
    "720p/../../segment.ts",
    "/segment.ts",
    "https://r2.example/segment.ts",
    "segment.ts?download=1",
    "segment%2ets",
    "segment\\one.ts",
  ])("rejects unsafe manifest URI %s", (uri) => {
    expect(() =>
      resolveRelativePath("720p/index.m3u8", uri, /\.ts$/i)
    ).toThrow();
  });

  it("rewrites only declared master renditions", () => {
    const { lesson, asset } = context();
    expect(
      rewriteMaster(
        "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=3200000\n720p/index.m3u8\n",
        lesson,
        asset
      )
    ).toContain(`/api/lessons/${ids.lesson}/manifest?variant=720p%2Findex.m3u8`);
    expect(() =>
      rewriteMaster(
        "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\nunknown/index.m3u8",
        lesson,
        asset
      )
    ).toThrow("unknown rendition");
  });

  it("rewrites key and segment URIs without disclosing R2 locations", () => {
    process.env.VIDEO_MEDIA_BASE_URL = "https://media.example.com";
    process.env.VIDEO_MEDIA_GRANT_SECRET =
      "test-secret-that-is-at-least-thirty-two-bytes-long";
    const { request, course, lesson, asset } = context();
    const rewritten = rewriteVariant(
      "#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI=\"internal.key\"\nsegment-000001.ts\n",
      request,
      course,
      lesson,
      asset,
      "720p/index.m3u8"
    );

    expect(rewritten).toContain(`/api/lessons/${ids.lesson}/hls-key?grant=`);
    expect(rewritten).toContain("https://media.example.com/media?grant=");
    expect(rewritten).not.toContain("internal.key");
    expect(rewritten).not.toContain("video-assets/");
    expect(rewritten).not.toContain("r2.cloudflarestorage.com");
    expect(rewritten).not.toContain("r2.dev");
  });

  it("uses same-origin /api/media when VIDEO_MEDIA_BASE_URL is unset outside production", () => {
    delete process.env.VIDEO_MEDIA_BASE_URL;
    process.env.VIDEO_MEDIA_GRANT_SECRET =
      "test-secret-that-is-at-least-thirty-two-bytes-long";
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    const { request, course, lesson, asset } = context();
    const rewritten = rewriteVariant(
      "#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI=\"internal.key\"\nsegment-000001.ts\n",
      request,
      course,
      lesson,
      asset,
      "720p/index.m3u8"
    );
    process.env.NODE_ENV = previousNodeEnv;

    expect(rewritten).toContain("/api/media?grant=");
    expect(rewritten).not.toContain("https://media.example.com");
  });

  it("rejects unencrypted variants and non-canonical asset locations", () => {
    process.env.VIDEO_MEDIA_BASE_URL = "https://media.example.com";
    process.env.VIDEO_MEDIA_GRANT_SECRET =
      "test-secret-that-is-at-least-thirty-two-bytes-long";
    const { request, course, lesson, asset } = context();
    expect(() =>
      rewriteVariant(
        "#EXTM3U\n#EXT-X-KEY:METHOD=NONE,URI=\"key\"\nsegment.ts",
        request,
        course,
        lesson,
        asset,
        "720p/index.m3u8"
      )
    ).toThrow("invalid encryption");
    expect(() =>
      assertCanonicalAssetLocation(course, lesson, {
        ...asset,
        outputPrefix: "video-assets/other/hls/",
      })
    ).toThrow("location is invalid");
  });

  it("enforces exact configured Origin or Referer origins", () => {
    process.env.VIDEO_ALLOWED_ORIGINS =
      "https://academy.example.com,http://localhost:3000";
    expect(() =>
      assertAllowedSource({
        get: (name: string) =>
          name === "Origin" ? "https://academy.example.com" : undefined,
      })
    ).not.toThrow();
    expect(() =>
      assertAllowedSource({
        get: (name: string) =>
          name === "Referer"
            ? "http://localhost:3000/courses/one"
            : undefined,
      })
    ).not.toThrow();
    expect(() =>
      assertAllowedSource({
        get: (name: string) =>
          name === "Origin" ? "https://academy.example.com.evil.test" : undefined,
      })
    ).toThrow("origin is not allowed");
  });

  it("rejects expired grants and every key-identity mismatch", () => {
    const expected = {
      scope: "key",
      uid: ids.user,
      sid: ids.session,
      did: "device-one",
      cid: ids.course,
      lid: ids.lesson,
      aid: ids.asset,
      gen: 2,
    };
    expect(grantMatchesExpected(expected, expected, "key")).toBe(true);
    for (const field of ["scope", "uid", "sid", "did", "cid", "lid", "aid", "gen"]) {
      expect(
        grantMatchesExpected(
          { ...expected, [field]: field === "gen" ? 3 : "mismatch" },
          expected,
          "key"
        )
      ).toBe(false);
    }
  });
});
