import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  anomalyConfig,
  completeHlsKeyAudit,
  evaluateDistinctIpThreshold,
  normalizeTrustedIp,
} = require("../../lib/videoAccessAudit.js") as {
  anomalyConfig: () => { threshold: number; windowMinutes: number };
  completeHlsKeyAudit: (
    request: Record<string, unknown>,
    result: Record<string, unknown>
  ) => Promise<unknown>;
  normalizeTrustedIp: (value: unknown) => string;
  evaluateDistinctIpThreshold: (options: Record<string, unknown>) => Promise<unknown>;
};
const HlsKeyAccessLog = require("../../models/HlsKeyAccessLog.js");

describe("video access anomaly detection", () => {
  it("bounds anomaly threshold and review windows from environment input", () => {
    process.env.VIDEO_ACCESS_DISTINCT_IP_THRESHOLD = "999";
    process.env.VIDEO_ACCESS_DISTINCT_IP_WINDOW_MINUTES = "0";
    expect(anomalyConfig()).toEqual({ threshold: 20, windowMinutes: 1 });
    delete process.env.VIDEO_ACCESS_DISTINCT_IP_THRESHOLD;
    delete process.env.VIDEO_ACCESS_DISTINCT_IP_WINDOW_MINUTES;
  });

  it("normalizes only valid trusted request IP values", () => {
    expect(normalizeTrustedIp("::ffff:203.0.113.8")).toBe("203.0.113.8");
    expect(normalizeTrustedIp("2001:DB8::1")).toBe("2001:db8::1");
    expect(normalizeTrustedIp("203.0.113.8, 10.0.0.1")).toBe("unknown");
  });

  it("logs bounded request metadata without grants or key material", async () => {
    const create = vi.spyOn(HlsKeyAccessLog, "create").mockResolvedValue({
      _id: "log",
      lessonId: "lesson",
      assetId: "asset",
    });
    const request = {
      auth: {
        userId: "user",
        sessionId: "session",
        deviceId: "device",
      },
      hlsKeyAudit: { completed: false },
      ip: "::ffff:203.0.113.8",
      query: { grant: "must-not-be-recorded" },
      get: (name: string) =>
        name === "User-Agent" ? "Example Browser" : undefined,
    };

    await completeHlsKeyAudit(request, {
      outcome: "denied",
      reason: "VIDEO_KEY_GRANT_INVALID",
      lessonId: "lesson",
      assetId: "asset",
    });

    expect(create).toHaveBeenCalledWith({
      userId: "user",
      sessionId: "session",
      deviceId: "device",
      lessonId: "lesson",
      assetId: "asset",
      ip: "203.0.113.8",
      userAgent: "Example Browser",
      outcome: "denied",
      reason: "VIDEO_KEY_GRANT_INVALID",
      occurredAt: expect.any(Date),
    });
    expect(JSON.stringify(create.mock.calls[0][0])).not.toContain(
      "must-not-be-recorded"
    );
    await expect(
      completeHlsKeyAudit(request, {
        outcome: "success",
        reason: "duplicate",
      })
    ).resolves.toBeNull();
    expect(create).toHaveBeenCalledOnce();
    create.mockRestore();
  });

  it("does not create a flag below the configured threshold", async () => {
    const logModel = {
      distinct: vi.fn().mockResolvedValue(["203.0.113.1", "203.0.113.2"]),
    };
    const flagModel = {
      findOneAndUpdate: vi.fn(),
      retentionExpiry: (now: Date) => now,
    };

    const result = await evaluateDistinctIpThreshold({
      logModel,
      flagModel,
      userId: "user",
      deviceId: "device",
      lessonId: "lesson",
      assetId: "asset",
      now: new Date("2026-08-08T20:00:00.000Z"),
      threshold: 3,
      windowMinutes: 10,
    });

    expect(result).toBeNull();
    expect(flagModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("idempotently upserts one asset-level review flag at threshold", async () => {
    const logModel = {
      distinct: vi
        .fn()
        .mockResolvedValue([
          "203.0.113.1",
          "203.0.113.2",
          "203.0.113.3",
          "unknown",
        ]),
    };
    const flagModel = {
      findOneAndUpdate: vi.fn().mockResolvedValue({ _id: "flag" }),
      retentionExpiry: (now: Date) =>
        new Date(now.getTime() + 24 * 60 * 60 * 1000),
    };
    const now = new Date("2026-08-08T20:00:00.000Z");

    await evaluateDistinctIpThreshold({
      logModel,
      flagModel,
      userId: "user",
      deviceId: "device",
      lessonId: "lesson",
      assetId: "asset",
      now,
      threshold: 3,
      windowMinutes: 10,
    });

    expect(flagModel.findOneAndUpdate).toHaveBeenCalledOnce();
    expect(flagModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        userId: "user",
        assetId: "asset",
        reasonCode: "distinct_ip_threshold",
      },
      expect.objectContaining({
        $set: expect.objectContaining({ distinctIpCount: 3 }),
        $setOnInsert: expect.objectContaining({ status: "open" }),
      }),
      expect.objectContaining({ upsert: true })
    );
  });

  it("recovers an upsert race without creating duplicate review flags", async () => {
    const duplicateError = Object.assign(new Error("duplicate"), { code: 11000 });
    const logModel = {
      distinct: vi
        .fn()
        .mockResolvedValue(["203.0.113.1", "203.0.113.2", "203.0.113.3"]),
    };
    const flagModel = {
      findOneAndUpdate: vi
        .fn()
        .mockRejectedValueOnce(duplicateError)
        .mockResolvedValueOnce({ _id: "existing-flag" }),
      retentionExpiry: (now: Date) => now,
    };

    await expect(
      evaluateDistinctIpThreshold({
        logModel,
        flagModel,
        userId: "user",
        deviceId: "device",
        lessonId: "lesson",
        assetId: "asset",
        threshold: 3,
        windowMinutes: 10,
      })
    ).resolves.toEqual({ _id: "existing-flag" });
    expect(flagModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(flagModel.findOneAndUpdate.mock.calls[1][2]).toEqual({ new: true });
  });
});
