import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { normalizeMediaPath, signMediaGrant, verifyMediaGrant } = require(
  "../../lib/mediaGrant.js"
) as {
  normalizeMediaPath: (path: string) => string;
  signMediaGrant: (
    claims: Record<string, unknown>,
    options: { nowMs: number; secret: string; ttlSeconds?: number }
  ) => string;
  verifyMediaGrant: (
    token: string,
    options: { nowMs: number; secret: string }
  ) => Record<string, unknown>;
};

const secret = "test-secret-that-is-at-least-thirty-two-bytes-long";
const nowMs = 1_800_000_000_000;
const claims = {
  scope: "media",
  uid: "111111111111111111111111",
  sid: "222222222222222222222222",
  did: "browser-device:one",
  cid: "333333333333333333333333",
  lid: "444444444444444444444444",
  aid: "555555555555555555555555",
  gen: 3,
  path: "720p/segment-000001.ts",
};

describe("media grants", () => {
  it("round-trips bounded identity and media claims", () => {
    const token = signMediaGrant(claims, { nowMs, secret, ttlSeconds: 60 });
    expect(verifyMediaGrant(token, { nowMs: nowMs + 30_000, secret })).toMatchObject(
      claims
    );
  });

  it("rejects tampering and expiry", () => {
    const token = signMediaGrant(claims, { nowMs, secret, ttlSeconds: 30 });
    expect(() =>
      verifyMediaGrant(`${token.slice(0, -1)}x`, { nowMs, secret })
    ).toThrow("Invalid media grant");
    expect(() =>
      verifyMediaGrant(token, { nowMs: nowMs + 30_000, secret })
    ).toThrow("Expired media grant");
  });

  it("rejects payload, signature, secret, and clock-window tampering", () => {
    const token = signMediaGrant(claims, { nowMs, secret, ttlSeconds: 60 });
    const [payload, signature] = token.split(".");
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );
    const changedPayload = Buffer.from(
      JSON.stringify({ ...parsed, aid: "666666666666666666666666" })
    ).toString("base64url");

    expect(() =>
      verifyMediaGrant(`${changedPayload}.${signature}`, { nowMs, secret })
    ).toThrow("Invalid media grant");
    expect(() =>
      verifyMediaGrant(`${payload}.${signature}=`, { nowMs, secret })
    ).toThrow("Invalid media grant");
    expect(() =>
      verifyMediaGrant(token, {
        nowMs,
        secret: "different-secret-that-is-at-least-thirty-two-bytes",
      })
    ).toThrow("Invalid media grant");
    expect(() =>
      verifyMediaGrant(token, { nowMs: nowMs - 300_000, secret })
    ).toThrow("Expired media grant");
  });

  it("round-trips key grants without accepting media paths on them", () => {
    const keyClaims = { ...claims, scope: "key" };
    const token = signMediaGrant(keyClaims, { nowMs, secret, ttlSeconds: 60 });
    expect(verifyMediaGrant(token, { nowMs, secret })).toMatchObject({
      scope: "key",
      aid: claims.aid,
    });
    expect(verifyMediaGrant(token, { nowMs, secret })).not.toHaveProperty("path");
  });

  it.each([
    "../segment.ts",
    "720p/../../segment.ts",
    "/720p/segment.ts",
    "720p%2Fsegment.ts",
    "720p\\segment.ts",
    "720p/index.m3u8",
  ])("rejects unsafe media path %s", (mediaPath) => {
    expect(() => normalizeMediaPath(mediaPath)).toThrow("Invalid media path");
  });
});
