const fs = require("fs");
const os = require("os");
const path = require("path");
const VideoAsset = require("../models/VideoAsset");
const Lesson = require("../models/Lesson");
const { unwrapContentKey } = require("../lib/videoEncryption");
const { getVideoProcessingConfig } = require("../lib/videoProcessingConfig");
const {
  claimNextJob,
  completeJob,
  failOrRetryJob,
  heartbeatJob,
  recoverStaleJobs,
} = require("../lib/videoProcessingQueue");
const {
  deletePrefix,
  downloadObject,
  publishStagedFiles,
  uploadDirectory,
} = require("../lib/videoR2Storage");
const {
  probeVideo,
  transcodeToEncryptedHls,
} = require("../lib/videoTranscoder");
const logger = require("../utils/logger");

function leaseLostError() {
  const error = new Error("Video processing lease was lost");
  error.code = "LEASE_LOST";
  return error;
}

async function updateCurrentLesson(asset, update) {
  await Lesson.updateOne(
    { _id: asset.lessonId, videoAssetId: asset._id },
    {
      $set: {
        ...update,
        videoProcessingUpdatedAt: new Date(),
      },
    }
  );
}

async function processJob(job, config) {
  const asset = await VideoAsset.findById(job.assetId).select(
    "+source.objectKey +outputPrefix +masterPlaylistObjectKey " +
      "+encryption.wrappedKey +encryption.wrapIv +encryption.authTag " +
      "+encryption.kekVersion"
  );
  if (!asset) {
    const error = new Error("Video asset no longer exists");
    error.code = "ASSET_NOT_FOUND";
    throw error;
  }

  if (asset.status === "ready") {
    await updateCurrentLesson(asset, {
      videoAvailable: true,
      videoProcessingStatus: "ready",
      videoProcessingError: null,
    });
    const completed = await completeJob({
      jobId: job._id,
      workerId: config.workerId,
    });
    if (!completed) throw leaseLostError();
    return;
  }

  const workDirectory = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "sawy-video-")
  );
  const inputPath = path.join(workDirectory, "source");
  const outputDirectory = path.join(workDirectory, "hls");
  const assetPrefix = asset.outputPrefix.slice(0, -4);
  const stagingRunId = `${job.attempts}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  const stagingPrefix = `${assetPrefix}staging/${job._id}/${stagingRunId}/`;
  let leaseHealthy = true;
  let assetReady = false;
  let heartbeatRunning = false;
  const heartbeat = setInterval(async () => {
    if (heartbeatRunning || !leaseHealthy) return;
    heartbeatRunning = true;
    try {
      leaseHealthy = await heartbeatJob({
        jobId: job._id,
        workerId: config.workerId,
        leaseMs: config.leaseMs,
      });
    } catch (error) {
      leaseHealthy = false;
      logger.error("Video worker heartbeat failed", {
        jobId: job._id,
        error,
      });
    } finally {
      heartbeatRunning = false;
    }
  }, config.heartbeatMs);
  heartbeat.unref();

  try {
    await VideoAsset.updateOne(
      { _id: asset._id, status: { $ne: "ready" } },
      { $set: { status: "processing" }, $unset: { error: 1 } }
    );
    await updateCurrentLesson(asset, {
      videoProcessingStatus: "processing",
      videoProcessingError: null,
    });

    await downloadObject(asset.source.objectKey, inputPath);
    const media = await probeVideo(inputPath, config.ffprobePath);
    if (!leaseHealthy) throw leaseLostError();

    const contentKey = unwrapContentKey(asset.encryption);
    let renditions;
    try {
      renditions = await transcodeToEncryptedHls({
        contentKey,
        ffmpegPath: config.ffmpegPath,
        inputPath,
        keyUri: `/api/video-assets/${asset._id}/key`,
        outputDirectory,
        sourceWidth: media.sourceWidth,
        sourceHeight: media.sourceHeight,
      });
    } finally {
      contentKey.fill(0);
    }
    if (!leaseHealthy) throw leaseLostError();

    const stagedFiles = await uploadDirectory(outputDirectory, stagingPrefix);
    leaseHealthy = await heartbeatJob({
      jobId: job._id,
      workerId: config.workerId,
      leaseMs: config.leaseMs,
    });
    if (!leaseHealthy) throw leaseLostError();

    await deletePrefix(asset.outputPrefix);
    await publishStagedFiles(
      stagingPrefix,
      asset.outputPrefix,
      stagedFiles,
      { shouldContinue: () => leaseHealthy }
    );
    leaseHealthy = await heartbeatJob({
      jobId: job._id,
      workerId: config.workerId,
      leaseMs: config.leaseMs,
    });
    if (!leaseHealthy) throw leaseLostError();

    const renditionDocuments = renditions.map((rendition) => ({
      name: rendition.name,
      width: rendition.width,
      height: rendition.height,
      bandwidth: rendition.bandwidth,
      playlistObjectKey: `${asset.outputPrefix}${rendition.name}/index.m3u8`,
    }));
    await VideoAsset.updateOne(
      { _id: asset._id },
      {
        $set: {
          status: "ready",
          media,
          renditions: renditionDocuments,
          masterPlaylistObjectKey: `${asset.outputPrefix}master.m3u8`,
          readyAt: new Date(),
        },
        $unset: { error: 1 },
      }
    );
    assetReady = true;
    await updateCurrentLesson(asset, {
      videoAvailable: true,
      videoProcessingStatus: "ready",
      videoProcessingError: null,
    });

    const completed = await completeJob({
      jobId: job._id,
      workerId: config.workerId,
    });
    if (!completed) throw leaseLostError();
    await VideoAsset.updateMany(
      {
        lessonId: asset.lessonId,
        _id: { $ne: asset._id },
        status: "ready",
      },
      { $set: { status: "superseded" } }
    ).catch((error) => {
      logger.warn("Failed to supersede an older video asset", {
        assetId: asset._id,
        error,
      });
    });
  } catch (error) {
    if (!assetReady) {
      await deletePrefix(asset.outputPrefix).catch(() => {});
    }
    throw error;
  } finally {
    clearInterval(heartbeat);
    await deletePrefix(stagingPrefix).catch((error) => {
      logger.warn("Failed to clean video staging prefix", {
        assetId: asset._id,
        error,
      });
    });
    await fs.promises
      .rm(workDirectory, {
        recursive: true,
        force: true,
      })
      .catch(() => {});
  }
}

async function handleClaimedJob(job, config) {
  try {
    await processJob(job, config);
    logger.info("Video processing completed", {
      assetId: job.assetId,
      jobId: job._id,
    });
  } catch (error) {
    if (error.code === "LEASE_LOST") {
      logger.warn("Video processing stopped after lease loss", {
        assetId: job.assetId,
        jobId: job._id,
      });
      return;
    }

    const outcome = await failOrRetryJob({
      job,
      workerId: config.workerId,
      error,
    });
    if (!outcome.updated) return;

    await VideoAsset.updateOne(
      { _id: job.assetId, status: { $ne: "ready" } },
      {
        $set: {
          status: outcome.terminal ? "failed" : "queued",
          error: {
            code: String(error.code || "PROCESSING_FAILED").slice(0, 100),
            message: String(error.message || "Video processing failed").slice(
              0,
              2_000
            ),
            at: new Date(),
          },
        },
      }
    );
    const asset = await VideoAsset.findById(job.assetId).select("lessonId");
    if (asset) {
      await updateCurrentLesson(asset, {
        videoAvailable: false,
        videoProcessingStatus: outcome.terminal ? "failed" : "queued",
        videoProcessingError: outcome.terminal
          ? String(error.message || "Video processing failed").slice(0, 2_000)
          : null,
      });
    }
    logger.error(
      outcome.terminal
        ? "Video processing failed permanently"
        : "Video processing scheduled for retry",
      { assetId: job.assetId, jobId: job._id, error }
    );
  }
}

async function runWorker({ signal } = {}) {
  const config = getVideoProcessingConfig();
  logger.info("Video processing worker started", { workerId: config.workerId });

  while (!signal?.aborted) {
    const recoveredJobs = await recoverStaleJobs();
    if (recoveredJobs.length > 0) {
      for (const recovered of recoveredJobs) {
        const asset = await VideoAsset.findById(recovered.assetId).select(
          "lessonId"
        );
        if (!asset || asset.status === "ready") continue;
        await VideoAsset.updateOne(
          { _id: asset._id, status: { $ne: "ready" } },
          {
            $set: {
              status: recovered.terminal ? "failed" : "queued",
              error: {
                code: "LEASE_EXPIRED",
                message: "The processing worker lease expired",
                at: new Date(),
              },
            },
          }
        );
        await updateCurrentLesson(asset, {
          videoAvailable: false,
          videoProcessingStatus: recovered.terminal ? "failed" : "queued",
          videoProcessingError: recovered.terminal
            ? "The processing worker lease expired"
            : null,
        });
      }
      logger.warn("Recovered stale video processing leases", {
        recovered: recoveredJobs.length,
      });
    }

    const job = await claimNextJob(config);
    if (!job) {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, config.idlePollMs);
        signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            resolve();
          },
          { once: true }
        );
      });
      continue;
    }
    await handleClaimedJob(job, config);
  }

  logger.info("Video processing worker stopped", { workerId: config.workerId });
}

module.exports = { handleClaimedJob, processJob, runWorker };
