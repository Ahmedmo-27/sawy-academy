const VideoProcessingJob = require("../models/VideoProcessingJob");

function retryDelayMs(attempts) {
  const configuredBase = Number(process.env.VIDEO_WORKER_RETRY_BASE_MS);
  const configuredMaximum = Number(process.env.VIDEO_WORKER_RETRY_MAX_MS);
  const base =
    Number.isFinite(configuredBase) && configuredBase > 0
      ? configuredBase
      : 30_000;
  const maximum =
    Number.isFinite(configuredMaximum) && configuredMaximum > 0
      ? configuredMaximum
      : 30 * 60_000;
  return Math.min(maximum, base * 2 ** Math.max(0, attempts - 1));
}

async function enqueueJob({ assetId, lessonId, maxAttempts = 5 }) {
  return VideoProcessingJob.create({
    assetId,
    lessonId,
    maxAttempts,
    status: "queued",
    availableAt: new Date(),
  });
}

async function claimNextJob({ workerId, leaseMs }) {
  const now = new Date();
  return VideoProcessingJob.findOneAndUpdate(
    {
      status: { $in: ["queued", "retry_wait"] },
      availableAt: { $lte: now },
      $expr: { $lt: ["$attempts", "$maxAttempts"] },
    },
    {
      $set: {
        status: "processing",
        startedAt: now,
        "lease.ownerId": workerId,
        "lease.heartbeatAt": now,
        "lease.expiresAt": new Date(now.getTime() + leaseMs),
      },
      $inc: { attempts: 1 },
      $unset: { error: 1, completedAt: 1 },
    },
    { new: true, sort: { availableAt: 1, createdAt: 1 } }
  );
}

async function heartbeatJob({ jobId, workerId, leaseMs }) {
  const now = new Date();
  const result = await VideoProcessingJob.updateOne(
    {
      _id: jobId,
      status: "processing",
      "lease.ownerId": workerId,
      "lease.expiresAt": { $gt: now },
    },
    {
      $set: {
        "lease.heartbeatAt": now,
        "lease.expiresAt": new Date(now.getTime() + leaseMs),
      },
    }
  );
  return result.modifiedCount === 1;
}

async function completeJob({ jobId, workerId }) {
  const result = await VideoProcessingJob.updateOne(
    {
      _id: jobId,
      status: "processing",
      "lease.ownerId": workerId,
      "lease.expiresAt": { $gt: new Date() },
    },
    {
      $set: { status: "completed", completedAt: new Date() },
      $unset: { lease: 1, error: 1 },
    }
  );
  return result.modifiedCount === 1;
}

async function failOrRetryJob({ job, workerId, error }) {
  const permanentError = ["ASSET_NOT_FOUND", "INVALID_MEDIA"].includes(
    error.code
  );
  const terminal = permanentError || job.attempts >= job.maxAttempts;
  const now = new Date();
  const result = await VideoProcessingJob.updateOne(
    {
      _id: job._id,
      status: "processing",
      "lease.ownerId": workerId,
      "lease.expiresAt": { $gt: now },
    },
    {
      $set: {
        status: terminal ? "failed" : "retry_wait",
        availableAt: terminal
          ? now
          : new Date(now.getTime() + retryDelayMs(job.attempts)),
        error: {
          code: String(error.code || "PROCESSING_FAILED").slice(0, 100),
          message: String(error.message || "Video processing failed").slice(
            0,
            2_000
          ),
          at: now,
        },
      },
      $unset: { lease: 1 },
    }
  );
  return { terminal, updated: result.modifiedCount === 1 };
}

async function recoverStaleJobs() {
  const now = new Date();
  const staleJobs = await VideoProcessingJob.find({
    status: "processing",
    "lease.expiresAt": { $lte: now },
  }).lean();
  const recoveredJobs = [];

  for (const job of staleJobs) {
    const terminal = job.attempts >= job.maxAttempts;
    const result = await VideoProcessingJob.updateOne(
      {
        _id: job._id,
        status: "processing",
        "lease.expiresAt": { $lte: now },
      },
      {
        $set: {
          status: terminal ? "failed" : "retry_wait",
          availableAt: terminal
            ? now
            : new Date(now.getTime() + retryDelayMs(job.attempts)),
          error: {
            code: "LEASE_EXPIRED",
            message: "The processing worker lease expired",
            at: now,
          },
        },
        $unset: { lease: 1 },
      }
    );
    if (result.modifiedCount === 1) {
      recoveredJobs.push({
        assetId: job.assetId,
        lessonId: job.lessonId,
        terminal,
      });
    }
  }
  return recoveredJobs;
}

module.exports = {
  claimNextJob,
  completeJob,
  enqueueJob,
  failOrRetryJob,
  heartbeatJob,
  recoverStaleJobs,
  retryDelayMs,
};
