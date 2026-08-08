import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const VideoProcessingJob = require("../../models/VideoProcessingJob.js");
const {
  claimNextJob,
  completeJob,
  failOrRetryJob,
  heartbeatJob,
  recoverStaleJobs,
  retryDelayMs,
} = require("../../lib/videoProcessingQueue.js") as {
  claimNextJob: (options: Record<string, unknown>) => Promise<unknown>;
  completeJob: (options: Record<string, unknown>) => Promise<boolean>;
  failOrRetryJob: (options: Record<string, unknown>) => Promise<{
    terminal: boolean;
    updated: boolean;
  }>;
  heartbeatJob: (options: Record<string, unknown>) => Promise<boolean>;
  recoverStaleJobs: () => Promise<Array<Record<string, unknown>>>;
  retryDelayMs: (attempts: number) => number;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-09T00:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
  delete process.env.VIDEO_WORKER_RETRY_BASE_MS;
  delete process.env.VIDEO_WORKER_RETRY_MAX_MS;
});

describe("video processing job leases and retries", () => {
  it("claims only available jobs below the attempt limit with an owner lease", async () => {
    const findOneAndUpdate = vi
      .spyOn(VideoProcessingJob, "findOneAndUpdate")
      .mockResolvedValue({ _id: "job" });

    await claimNextJob({ workerId: "worker-one", leaseMs: 120_000 });

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: { $in: ["queued", "retry_wait"] },
        $expr: { $lt: ["$attempts", "$maxAttempts"] },
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "processing",
          "lease.ownerId": "worker-one",
          "lease.expiresAt": new Date("2026-08-09T00:02:00.000Z"),
        }),
        $inc: { attempts: 1 },
      }),
      expect.objectContaining({ new: true })
    );
  });

  it("heartbeats and completes only the current unexpired lease owner", async () => {
    const updateOne = vi
      .spyOn(VideoProcessingJob, "updateOne")
      .mockResolvedValueOnce({ modifiedCount: 1 })
      .mockResolvedValueOnce({ modifiedCount: 0 })
      .mockResolvedValueOnce({ modifiedCount: 1 });

    await expect(
      heartbeatJob({ jobId: "job", workerId: "owner", leaseMs: 60_000 })
    ).resolves.toBe(true);
    await expect(
      heartbeatJob({ jobId: "job", workerId: "stale", leaseMs: 60_000 })
    ).resolves.toBe(false);
    await expect(
      completeJob({ jobId: "job", workerId: "owner" })
    ).resolves.toBe(true);

    expect(updateOne.mock.calls[0][0]).toMatchObject({
      _id: "job",
      status: "processing",
      "lease.ownerId": "owner",
      "lease.expiresAt": { $gt: expect.any(Date) },
    });
    expect(updateOne.mock.calls[2][1]).toMatchObject({
      $set: { status: "completed", completedAt: expect.any(Date) },
      $unset: { lease: 1, error: 1 },
    });
  });

  it("uses bounded exponential retry delays", () => {
    process.env.VIDEO_WORKER_RETRY_BASE_MS = "1000";
    process.env.VIDEO_WORKER_RETRY_MAX_MS = "5000";
    expect([1, 2, 3, 4, 50].map(retryDelayMs)).toEqual([
      1000, 2000, 4000, 5000, 5000,
    ]);
  });

  it("schedules transient failures but terminally fails permanent errors", async () => {
    const updateOne = vi
      .spyOn(VideoProcessingJob, "updateOne")
      .mockResolvedValue({ modifiedCount: 1 });

    await expect(
      failOrRetryJob({
        job: { _id: "job", attempts: 2, maxAttempts: 5 },
        workerId: "owner",
        error: { code: "TRANSCODER_FAILED", message: "temporary" },
      })
    ).resolves.toEqual({ terminal: false, updated: true });
    expect(updateOne.mock.calls[0][1]).toMatchObject({
      $set: {
        status: "retry_wait",
        availableAt: new Date("2026-08-09T00:01:00.000Z"),
      },
      $unset: { lease: 1 },
    });

    await expect(
      failOrRetryJob({
        job: { _id: "job-2", attempts: 1, maxAttempts: 5 },
        workerId: "owner",
        error: { code: "INVALID_MEDIA", message: "bad upload" },
      })
    ).resolves.toMatchObject({ terminal: true });
    expect(updateOne.mock.calls[1][1]).toMatchObject({
      $set: { status: "failed" },
    });
  });

  it("recovers each expired lease through a conditional idempotency guard", async () => {
    vi.spyOn(VideoProcessingJob, "find").mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          _id: "job-1",
          assetId: "asset-1",
          lessonId: "lesson-1",
          attempts: 1,
          maxAttempts: 3,
        },
        {
          _id: "job-2",
          assetId: "asset-2",
          lessonId: "lesson-2",
          attempts: 3,
          maxAttempts: 3,
        },
      ]),
    });
    const updateOne = vi
      .spyOn(VideoProcessingJob, "updateOne")
      .mockResolvedValueOnce({ modifiedCount: 1 })
      .mockResolvedValueOnce({ modifiedCount: 0 });

    await expect(recoverStaleJobs()).resolves.toEqual([
      {
        assetId: "asset-1",
        lessonId: "lesson-1",
        terminal: false,
      },
    ]);
    expect(updateOne.mock.calls[0][0]).toMatchObject({
      _id: "job-1",
      status: "processing",
      "lease.expiresAt": { $lte: expect.any(Date) },
    });
  });
});
