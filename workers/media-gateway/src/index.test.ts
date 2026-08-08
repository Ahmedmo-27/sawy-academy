import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import worker, {
  contentType,
  handleMedia,
  isClaims,
  sourceOrigin,
  verifyGrant,
} from "./index";

const secret = "worker-test-secret-that-is-at-least-thirty-two-bytes";
const now = 1_800_000_000;
const claims = {
  v: 1,
  scope: "media",
  uid: "111111111111111111111111",
  sid: "222222222222222222222222",
  did: "device-one",
  cid: "333333333333333333333333",
  lid: "444444444444444444444444",
  aid: "555555555555555555555555",
  gen: 2,
  exp: now + 60,
  path: "720p/segment-000001.ts",
} as const;

function tokenFor(value: unknown) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function environment(bucket: Partial<R2Bucket> = {}): Env {
  return {
    VIDEO_BUCKET: bucket as R2Bucket,
    MEDIA_ALLOWED_ORIGIN: "https://academy.example.com",
    VIDEO_MEDIA_GRANT_SECRET: secret,
  };
}

describe("media gateway pure helpers", () => {
  it("verifies signed media grants and rejects tampering or expiry", async () => {
    await expect(verifyGrant(tokenFor(claims), secret, now)).resolves.toEqual(
      claims
    );
    await expect(
      verifyGrant(`${tokenFor(claims)}x`, secret, now)
    ).rejects.toThrow("Invalid grant");
    await expect(
      verifyGrant(tokenFor({ ...claims, exp: now }), secret, now)
    ).rejects.toThrow("claims");
    await expect(
      verifyGrant(
        tokenFor({ ...claims, path: "../secret.ts" }),
        secret,
        now
      )
    ).rejects.toThrow("claims");
  });

  it("bounds claim lifetimes and maps only supported media types", () => {
    expect(isClaims(claims, now)).toBe(true);
    expect(isClaims({ ...claims, exp: now + 301 }, now)).toBe(false);
    expect(contentType("rendition/segment.m4s")).toBe("video/iso.segment");
    expect(contentType("rendition/file.bin")).toBe("application/octet-stream");
  });

  it("uses exact Origin or Referer origins", () => {
    expect(
      sourceOrigin(
        new Request("https://media.example.com/media", {
          headers: { Origin: "https://academy.example.com/" },
        })
      )
    ).toBe("https://academy.example.com");
    expect(
      sourceOrigin(
        new Request("https://media.example.com/media", {
          headers: { Referer: "https://academy.example.com/lesson/one" },
        })
      )
    ).toBe("https://academy.example.com");
  });
});

describe("media gateway request boundary", () => {
  it("denies wrong origins before reading R2", async () => {
    const get = vi.fn();
    const response = await handleMedia(
      new Request(`https://media.example.com/media?grant=${tokenFor(claims)}`, {
        headers: { Origin: "https://academy.example.com.evil.test" },
      }),
      environment({ get })
    );
    expect(response.status).toBe(403);
    expect(get).not.toHaveBeenCalled();
  });

  it("constructs the private key internally and never returns its R2 host", async () => {
    vi.setSystemTime(new Date(now * 1000));
    const get = vi.fn().mockResolvedValue({
      body: new Uint8Array([1, 2, 3]),
      size: 3,
      httpEtag: "\"etag\"",
      writeHttpMetadata: vi.fn(),
    });
    const response = await handleMedia(
      new Request(`https://media.example.com/media?grant=${tokenFor(claims)}`, {
        headers: { Origin: "https://academy.example.com" },
      }),
      environment({ get })
    );

    expect(get).toHaveBeenCalledWith(
      "video-assets/333333333333333333333333/444444444444444444444444/555555555555555555555555/hls/720p/segment-000001.ts",
      expect.any(Object)
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("video/mp2t");
    expect(await response.text()).not.toContain("r2.");
    vi.useRealTimers();
  });

  it("returns a generic error without R2 details when storage fails", async () => {
    vi.setSystemTime(new Date(now * 1000));
    const response = await worker.fetch(
      new Request(`https://media.example.com/media?grant=${tokenFor(claims)}`, {
        headers: { Origin: "https://academy.example.com" },
      }) as never,
      environment({
        get: vi.fn().mockRejectedValue(
          new Error("secret-bucket.r2.cloudflarestorage.com")
        ),
      })
    );
    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Media unavailable");
    vi.useRealTimers();
  });
});
