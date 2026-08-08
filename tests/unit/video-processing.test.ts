import crypto from "node:crypto";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  generateWrappedContentKey,
  unwrapContentKey,
  wrapContentKey,
} = require("../../lib/videoEncryption.js") as {
  generateWrappedContentKey: () => {
    contentKey: Buffer;
    encryption: {
      algorithm: string;
      wrappedKey: string;
      wrapIv: string;
      authTag: string;
      kekVersion: string;
    };
  };
  unwrapContentKey: (
    encryption: {
      wrappedKey: string;
      wrapIv: string;
      authTag: string;
      algorithm?: string;
    },
    kek?: Buffer
  ) => Buffer;
  wrapContentKey: (contentKey: Buffer, kek?: Buffer) => {
    wrappedKey: string;
    wrapIv: string;
    authTag: string;
  };
};
const {
  buildFfmpegArgs,
  selectRenditions,
} = require("../../lib/videoTranscoder.js") as {
  buildFfmpegArgs: (options: Record<string, unknown>) => string[];
  selectRenditions: (
    width: number,
    height: number
  ) => Array<{ name: string; width: number; height: number }>;
};

const originalKek = process.env.VIDEO_KEY_KEK;

afterEach(() => {
  if (originalKek === undefined) {
    delete process.env.VIDEO_KEY_KEK;
  } else {
    process.env.VIDEO_KEY_KEK = originalKek;
  }
});

describe("video content-key encryption", () => {
  it("generates a 128-bit content key wrapped by AES-256-GCM", () => {
    process.env.VIDEO_KEY_KEK = crypto.randomBytes(32).toString("base64");
    const generated = generateWrappedContentKey();

    expect(generated.contentKey).toHaveLength(16);
    expect(generated.encryption.algorithm).toBe("AES-128");
    expect(unwrapContentKey(generated.encryption)).toEqual(
      generated.contentKey
    );
  });

  it("authenticates wrapped key metadata", () => {
    const kek = crypto.randomBytes(32);
    const wrapped = wrapContentKey(crypto.randomBytes(16), kek);
    const tag = Buffer.from(wrapped.authTag, "base64");
    tag[0] ^= 0xff;

    expect(() =>
      unwrapContentKey(
        { ...wrapped, authTag: tag.toString("base64") },
        kek
      )
    ).toThrow();
  });

  it.each(["wrappedKey", "wrapIv", "authTag"] as const)(
    "rejects tampered or malformed %s envelope data",
    (field) => {
      const kek = crypto.randomBytes(32);
      const wrapped = {
        algorithm: "AES-128",
        ...wrapContentKey(crypto.randomBytes(16), kek),
      };
      const value = Buffer.from(wrapped[field], "base64");
      value[0] ^= 0x01;
      expect(() =>
        unwrapContentKey(
          { ...wrapped, [field]: value.toString("base64") },
          kek
        )
      ).toThrow();
      expect(() =>
        unwrapContentKey({ ...wrapped, [field]: "@@not-base64@@" }, kek)
      ).toThrow(`Invalid`);
    }
  );

  it("rejects envelope algorithm and KEK mismatches", () => {
    const kek = crypto.randomBytes(32);
    const wrapped = wrapContentKey(crypto.randomBytes(16), kek);
    expect(() =>
      unwrapContentKey({ ...wrapped, algorithm: "AES-256" }, kek)
    ).toThrow("algorithm");
    expect(() =>
      unwrapContentKey({ ...wrapped, algorithm: "AES-128" }, crypto.randomBytes(16))
    ).toThrow("32-byte");
  });
});

describe("source-aware HLS renditions", () => {
  it("uses 1080p, 720p, and 480p without upscaling", () => {
    expect(selectRenditions(3840, 2160).map(({ name }) => name)).toEqual([
      "1080p",
      "720p",
      "480p",
    ]);
  });

  it("omits renditions above the source resolution", () => {
    expect(selectRenditions(1280, 720).map(({ name }) => name)).toEqual([
      "720p",
      "480p",
    ]);
    expect(selectRenditions(640, 360)).toMatchObject([
      { name: "360p", width: 640, height: 360 },
    ]);
  });

  it("keeps portrait and odd-sized outputs even and within the source", () => {
    expect(selectRenditions(721, 1281)).toMatchObject([
      { name: "1080p", width: 606, height: 1080 },
      { name: "720p", width: 404, height: 720 },
      { name: "480p", width: 270, height: 480 },
    ]);
    expect(selectRenditions(319, 239)).toMatchObject([
      { name: "238p", width: 316, height: 238 },
    ]);
  });

  it("builds encrypted VOD FFmpeg arguments with bounded output paths", () => {
    const args = buildFfmpegArgs({
      inputPath: "C:\\work\\source",
      keyInfoPath: "C:\\work\\key-info.txt",
      rendition: {
        width: 1280,
        height: 720,
        videoBitrate: "2800k",
      },
      renditionDirectory: "C:\\work\\hls\\720p",
      startNumber: 12345,
    });

    expect(args).toEqual(
      expect.arrayContaining([
        "-nostdin",
        "-hls_playlist_type",
        "vod",
        "-hls_flags",
        "independent_segments",
        "-hls_key_info_file",
        "C:\\work\\key-info.txt",
        "-start_number",
        "12345",
      ])
    );
    expect(args.join(" ")).toContain("scale=1280:720");
    expect(args.at(-2)).toMatch(/720p[\\/]segment-%06d\.ts$/);
    expect(args.at(-1)).toMatch(/720p[\\/]index\.m3u8$/);
    expect(args).not.toContain("-hls_base_url");
  });
});
