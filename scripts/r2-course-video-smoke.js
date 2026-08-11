/**
 * Upload a tiny MP4 through the same persistence path as the lesson-video
 * controller. Objects and Mongo records are kept until r2:smoke-cleanup.
 */

require("dotenv").config();

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const mongoose = require("mongoose");
const { HeadObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const VideoAsset = require("../models/VideoAsset");
const VideoProcessingJob = require("../models/VideoProcessingJob");
const {
  generateWrappedContentKey,
  getVideoKeyKek,
} = require("../lib/videoEncryption");
const {
  buildVideoAssetOutputPrefix,
  buildVideoAssetSourceKey,
  getR2Client,
  getR2Config,
} = require("../lib/videoAccess");
const {
  getPublicR2Config,
  isPrivateR2Configured,
  isPublicR2Configured,
} = require("../lib/r2Config");
const { enqueueJob } = require("../lib/videoProcessingQueue");
const { getVideoProcessingConfig } = require("../lib/videoProcessingConfig");
const { handleClaimedJob } = require("../workers/videoProcessingWorker");
const {
  fetchPublicUrl,
  headBucket,
  isDeniedHttpStatus,
  newRunId,
  recordSmokeRun,
} = require("./r2SmokeShared");

let uploadOnly = process.argv.includes("--upload-only");

/** Minimal ISO BMFF so the source object is a recognizable .mp4 without ffmpeg. */
const FALLBACK_MP4 = Buffer.from(
  "AAAAIGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAGm1kYXQ=",
  "base64"
);

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function ffmpegBin() {
  return String(process.env.FFMPEG_PATH || "ffmpeg").trim();
}

function ffmpegAvailable() {
  const result = spawnSync(ffmpegBin(), ["-version"], { encoding: "utf8" });
  return !result.error && result.status === 0;
}

function generateTinyMp4(destination) {
  const result = spawnSync(
    ffmpegBin(),
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "testsrc=duration=1:size=320x240:rate=15",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:duration=1",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-shortest",
      "-y",
      destination,
    ],
    { encoding: "utf8" }
  );
  if (result.error || result.status !== 0) {
    throw new Error(
      `ffmpeg failed to generate a test MP4: ${result.stderr || result.error?.message}`
    );
  }
}

async function claimThisJob(job, config) {
  const now = new Date();
  return VideoProcessingJob.findOneAndUpdate(
    { _id: job._id, status: "queued" },
    {
      $set: {
        status: "processing",
        startedAt: now,
        "lease.ownerId": config.workerId,
        "lease.heartbeatAt": now,
        "lease.expiresAt": new Date(now.getTime() + config.leaseMs),
      },
      $inc: { attempts: 1 },
      $unset: { error: 1, completedAt: 1 },
    },
    { new: true }
  );
}

async function main() {
  console.log("Course video R2 smoke");
  console.log(uploadOnly ? "Mode: upload-only\n" : "Mode: upload + one FFmpeg job\n");

  if (!isPrivateR2Configured()) {
    fail("Private R2 is not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME).");
    return;
  }
  if (!process.env.MONGODB_URI?.trim()) {
    fail("MONGODB_URI is required.");
    return;
  }
  try {
    getVideoKeyKek();
  } catch (error) {
    process.env.VIDEO_KEY_KEK = require("crypto").randomBytes(32).toString("base64");
    process.env.VIDEO_KEY_KEK_VERSION =
      process.env.VIDEO_KEY_KEK_VERSION?.trim() || "smoke-v1";
    console.warn(
      `VIDEO_KEY_KEK is missing or invalid (${error.message}). Using a process-only smoke KEK; do not use this asset for real playback.`
    );
  }

  const canGenerate = ffmpegAvailable();
  if (!canGenerate) {
    console.warn(
      `ffmpeg not found (${ffmpegBin()}). Writing a tiny fallback MP4 and staying upload-only.`
    );
    uploadOnly = true;
  }

  const runId = newRunId();
  const slug = `r2-smoke-${runId}`;
  const workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "r2-smoke-video-"));
  const sourcePath = path.join(workDir, "smoke.mp4");
  const privateConfig = getR2Config();
  const client = getR2Client();

  await headBucket(client, privateConfig.bucketName);
  console.log(`Private bucket: ${privateConfig.bucketName}`);

  if (canGenerate) {
    generateTinyMp4(sourcePath);
  } else {
    await fs.promises.writeFile(sourcePath, FALLBACK_MP4);
  }
  const stat = await fs.promises.stat(sourcePath);
  console.log(
    `${canGenerate ? "Generated" : "Wrote fallback"} ${sourcePath} (${stat.size} bytes)`
  );

  await mongoose.connect(process.env.MONGODB_URI);

  const lessonId = new mongoose.Types.ObjectId();
  const assetId = new mongoose.Types.ObjectId();
  let course;
  let lesson;
  let asset;
  let job;

  try {
    lesson = await Lesson.create({
      _id: lessonId,
      id: `r2-smoke-lesson-${runId}`,
      slug: `r2-smoke-lesson-${runId}`,
      title: `[R2 SMOKE] Keep until cleanup — ${runId}`,
      sheetRef: "SMOKE-01",
      duration: "1m",
      order: 0,
      summary: "Ephemeral smoke lesson. Safe to delete after npm run r2:smoke-cleanup.",
      content: "<p>R2 course-video smoke lesson. Objects are kept until cleanup.</p>",
    });

    course = await Course.create({
      id: slug,
      slug,
      title: `[R2 SMOKE] Course ${runId}`,
      description: "Ephemeral smoke course for dual-bucket R2 verification.",
      level: "Foundation",
      instructor: "R2 Smoke",
      price: "0",
      lessons: [lesson._id],
    });

    const generatedKey = generateWrappedContentKey();
    const encryption = generatedKey.encryption;
    generatedKey.contentKey.fill(0);

    lesson = await Lesson.findByIdAndUpdate(
      lesson._id,
      { $inc: { videoGeneration: 1 } },
      { new: true }
    ).select("+videoGeneration");

    const objectKey = buildVideoAssetSourceKey(
      course._id.toString(),
      lesson._id.toString(),
      assetId.toString(),
      "smoke.mp4"
    );
    const outputPrefix = buildVideoAssetOutputPrefix(
      course._id.toString(),
      lesson._id.toString(),
      assetId.toString()
    );

    if (!objectKey.includes("/source/") || !objectKey.startsWith("video-assets/")) {
      throw new Error(`Unexpected source key: ${objectKey}`);
    }

    const uploadResult = await new Upload({
      client,
      params: {
        Bucket: privateConfig.bucketName,
        Key: objectKey,
        Body: fs.createReadStream(sourcePath),
        ContentLength: stat.size,
        ContentType: "video/mp4",
        ContentDisposition: "inline",
        Metadata: {
          courseId: course._id.toString(),
          lessonId: lesson._id.toString(),
          smokeRun: runId,
        },
      },
    }).done();

    await client.send(
      new HeadObjectCommand({
        Bucket: privateConfig.bucketName,
        Key: objectKey,
      })
    );
    console.log(`Uploaded source: ${objectKey}`);

    asset = await VideoAsset.create({
      _id: assetId,
      lessonId: lesson._id,
      courseId: course._id,
      generation: lesson.videoGeneration,
      status: "queued",
      source: {
        objectKey,
        filename: "smoke.mp4",
        contentType: "video/mp4",
        sizeBytes: stat.size,
        etag: uploadResult.ETag,
      },
      outputPrefix,
      encryption,
    });

    await Lesson.updateOne(
      { _id: lesson._id },
      {
        $set: {
          videoAssetId: asset._id,
          videoAvailable: false,
          videoOriginalFilename: "smoke.mp4",
          videoProcessingStatus: "queued",
          videoProcessingUpdatedAt: new Date(),
        },
        $unset: { videoProcessingError: 1 },
      }
    );

    job = await enqueueJob({
      assetId: asset._id,
      lessonId: lesson._id,
      maxAttempts: getVideoProcessingConfig().maxAttempts,
    });
    console.log(`Queued job ${job._id} for asset ${asset._id} (course slug ${slug})`);

    const privateKeys = [objectKey];
    let processingStatus = "queued";

    if (!uploadOnly) {
      const config = {
        ...getVideoProcessingConfig(),
        workerId: `r2-smoke-${runId}`,
      };
      const claimed = await claimThisJob(job, config);
      if (!claimed) {
        throw new Error("Failed to claim the smoke processing job");
      }
      await handleClaimedJob(claimed, config);

      const readyAsset = await VideoAsset.findById(asset._id).select(
        "+masterPlaylistObjectKey +outputPrefix +source.objectKey"
      );
      processingStatus = readyAsset.status;
      console.log(`Processing status: ${readyAsset.status}`);
      if (readyAsset.status === "failed") {
        throw new Error(
          `Video processing failed: ${readyAsset.error?.code || ""} ${readyAsset.error?.message || ""}`
        );
      }
      if (readyAsset.status !== "ready") {
        throw new Error(`Expected asset ready, got ${readyAsset.status}`);
      }

      const masterKey = `${outputPrefix}master.m3u8`;
      await client.send(
        new HeadObjectCommand({
          Bucket: privateConfig.bucketName,
          Key: masterKey,
        })
      );
      privateKeys.push(masterKey);
      console.log(`HLS master present: ${masterKey}`);

      if (isPublicR2Configured()) {
        const leaked = await fetchPublicUrl(getPublicR2Config().baseUrl, masterKey);
        if (!isDeniedHttpStatus(leaked.status)) {
          throw new Error(
            `Private HLS master was reachable on the public origin (${leaked.status} ${leaked.url})`
          );
        }
        console.log(
          `Public CDN correctly denied HLS master (${leaked.status})`
        );
      }
    }

    const manifestPath = recordSmokeRun({
      kind: "course-video",
      runId,
      keepUntilCleanup: true,
      uploadOnly,
      processingStatus,
      publicBucket: isPublicR2Configured()
        ? getPublicR2Config().bucketName
        : null,
      privateBucket: privateConfig.bucketName,
      publicKeys: [],
      privateKeys,
      privatePrefix: `video-assets/${course._id}/${lesson._id}/`,
      mongo: {
        courseId: course._id.toString(),
        lessonId: lesson._id.toString(),
        assetId: asset._id.toString(),
        jobId: job._id.toString(),
        slug,
      },
    });

    console.log("\nKept for inspection (not deleted):");
    console.log(`  course slug: ${slug}`);
    console.log(`  source key:  ${objectKey}`);
    console.log(`  manifest:    ${manifestPath}`);
    console.log("Run `npm run r2:smoke-cleanup` when you want these removed.");
  } finally {
    await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {});
    await mongoose.disconnect().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
