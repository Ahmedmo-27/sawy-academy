const fs = require("fs");
const os = require("os");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const VideoAsset = require("../models/VideoAsset");
const VideoProcessingJob = require("../models/VideoProcessingJob");
const {
  createHttpError,
  sendSuccess,
} = require("./controllerUtils");
const {
  buildVideoAssetOutputPrefix,
  buildVideoAssetSourceKey,
  getR2Client,
  getR2Config,
} = require("../lib/videoAccess");
const { generateWrappedContentKey } = require("../lib/videoEncryption");
const { enqueueJob } = require("../lib/videoProcessingQueue");

const DEFAULT_MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);

function maxVideoBytes() {
  const configured = Number(process.env.VIDEO_UPLOAD_MAX_BYTES);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_VIDEO_BYTES;
}

const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: maxVideoBytes(),
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_VIDEO_TYPES.has(file.mimetype)) {
      callback(
        createHttpError(
          400,
          "Only MP4, WebM, Ogg, and QuickTime video files are allowed"
        )
      );
      return;
    }
    callback(null, true);
  },
});

async function deleteR2Object(objectKey) {
  if (!objectKey) return;
  const config = getR2Config();
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
    })
  );
}

async function create(req, res, next) {
  let uploadedObjectKey = null;
  let createdAssetId = null;
  let assignedLessonId = null;
  let previousVideoState = null;

  try {
    if (!req.file) {
      throw createHttpError(400, "No lesson video uploaded");
    }

    const course = await Course.findOne({ slug: String(req.params.slug) });
    if (!course) {
      throw createHttpError(404, "Course not found");
    }

    const lessonKey = String(req.params.lessonId || "").trim();
    const lessonIdentity = mongoose.Types.ObjectId.isValid(lessonKey)
      ? { $or: [{ _id: lessonKey }, { id: lessonKey }] }
      : { id: lessonKey };
    let lesson = await Lesson.findOne({
      ...lessonIdentity,
      _id: { $in: course.lessons },
    }).select(
      "+videoGeneration +videoOriginalFilename +videoProcessingError"
    );

    if (!lesson) {
      throw createHttpError(404, "Lesson not found");
    }
    previousVideoState = {
      videoAssetId: lesson.videoAssetId,
      videoAvailable: lesson.videoAvailable,
      videoOriginalFilename: lesson.videoOriginalFilename,
      videoProcessingStatus: lesson.videoProcessingStatus,
      videoProcessingError: lesson.videoProcessingError,
      videoProcessingUpdatedAt: lesson.videoProcessingUpdatedAt,
    };

    // Fail before accepting a large upload if key wrapping is not configured.
    const generatedKey = generateWrappedContentKey();
    const encryption = generatedKey.encryption;
    generatedKey.contentKey.fill(0);
    const assetId = new mongoose.Types.ObjectId();
    lesson = await Lesson.findByIdAndUpdate(
      lesson._id,
      { $inc: { videoGeneration: 1 } },
      { new: true }
    ).select("+videoGeneration");
    const objectKey = buildVideoAssetSourceKey(
      course._id.toString(),
      lesson._id.toString(),
      assetId.toString(),
      req.file.originalname
    );
    const outputPrefix = buildVideoAssetOutputPrefix(
      course._id.toString(),
      lesson._id.toString(),
      assetId.toString()
    );
    const config = getR2Config();

    const uploader = new Upload({
      client: getR2Client(),
      params: {
        Bucket: config.bucketName,
        Key: objectKey,
        Body: fs.createReadStream(req.file.path),
        ContentLength: req.file.size,
        ContentType: req.file.mimetype,
        ContentDisposition: "inline",
        Metadata: {
          courseId: course._id.toString(),
          lessonId: lesson._id.toString(),
        },
      },
    });

    const uploadResult = await uploader.done();
    uploadedObjectKey = objectKey;

    const asset = await VideoAsset.create({
      _id: assetId,
      lessonId: lesson._id,
      courseId: course._id,
      generation: lesson.videoGeneration,
      status: "queued",
      source: {
        objectKey,
        filename: path.basename(req.file.originalname).slice(0, 255),
        contentType: req.file.mimetype,
        sizeBytes: req.file.size,
        etag: uploadResult.ETag,
      },
      outputPrefix,
      encryption,
    });
    createdAssetId = asset._id;

    const lessonUpdate = await Lesson.updateOne(
      { _id: lesson._id },
      {
        $set: {
          videoAssetId: asset._id,
          videoAvailable: false,
          videoOriginalFilename: asset.source.filename,
          videoProcessingStatus: "queued",
          videoProcessingUpdatedAt: new Date(),
        },
        $unset: { videoProcessingError: 1 },
      }
    );
    if (lessonUpdate.modifiedCount !== 1) {
      throw new Error("Failed to assign the uploaded video asset to its lesson");
    }
    assignedLessonId = lesson._id;

    const configuredMaxAttempts = Number(
      process.env.VIDEO_WORKER_MAX_ATTEMPTS
    );
    const maxAttempts =
      Number.isFinite(configuredMaxAttempts) && configuredMaxAttempts > 0
        ? Math.floor(configuredMaxAttempts)
        : 5;
    const job = await enqueueJob({
      assetId: asset._id,
      lessonId: lesson._id,
      maxAttempts,
    });
    uploadedObjectKey = null;
    createdAssetId = null;

    return sendSuccess(res, {
      lessonId: lesson._id.toString(),
      assetId: asset._id.toString(),
      jobId: job._id.toString(),
      status: "queued",
      generation: asset.generation,
    }, 202);
  } catch (err) {
    if (assignedLessonId && createdAssetId && previousVideoState) {
      const rollbackSet = {
        videoAvailable: previousVideoState.videoAvailable || false,
        videoProcessingStatus:
          previousVideoState.videoProcessingStatus || "none",
      };
      const rollbackUnset = {};
      for (const field of [
        "videoAssetId",
        "videoOriginalFilename",
        "videoProcessingError",
        "videoProcessingUpdatedAt",
      ]) {
        if (previousVideoState[field] !== undefined) {
          rollbackSet[field] = previousVideoState[field];
        } else {
          rollbackUnset[field] = 1;
        }
      }
      await Lesson.updateOne(
        { _id: assignedLessonId, videoAssetId: createdAssetId },
        { $set: rollbackSet, $unset: rollbackUnset }
      ).catch(() => {});
    }
    if (createdAssetId) {
      await Promise.allSettled([
        VideoProcessingJob.deleteOne({ assetId: createdAssetId }),
        VideoAsset.deleteOne({ _id: createdAssetId }),
      ]);
    }
    if (uploadedObjectKey) {
      deleteR2Object(uploadedObjectKey).catch(() => {});
    }
    return next(err);
  } finally {
    if (req.file?.path) {
      fs.promises.unlink(req.file.path).catch(() => {});
    }
  }
}

async function findAssetContext(req) {
  const course = await Course.findOne({ slug: String(req.params.slug) });
  if (!course) throw createHttpError(404, "Course not found");

  const lessonKey = String(req.params.lessonId || "").trim();
  const lessonIdentity = mongoose.Types.ObjectId.isValid(lessonKey)
    ? { $or: [{ _id: lessonKey }, { id: lessonKey }] }
    : { id: lessonKey };
  const lesson = await Lesson.findOne({
    ...lessonIdentity,
    _id: { $in: course.lessons },
  });
  if (!lesson) throw createHttpError(404, "Lesson not found");

  const asset = lesson.videoAssetId
    ? await VideoAsset.findById(lesson.videoAssetId)
    : null;
  const job = asset
    ? await VideoProcessingJob.findOne({ assetId: asset._id })
    : null;
  return { asset, job, lesson };
}

function publicRenditions(renditions) {
  return (renditions || []).map(({ name, width, height, bandwidth }) => ({
    name,
    width,
    height,
    bandwidth,
  }));
}

async function status(req, res, next) {
  try {
    const { asset, job, lesson } = await findAssetContext(req);
    return sendSuccess(res, {
      lessonId: lesson._id.toString(),
      assetId: asset?._id.toString() || null,
      generation: asset?.generation || null,
      status: asset?.status || "none",
      processingStatus: lesson.videoProcessingStatus,
      attempts: job?.attempts || 0,
      maxAttempts: job?.maxAttempts || 0,
      availableAt: job?.availableAt || null,
      error: asset?.status === "failed" ? asset.error : null,
      renditions:
        asset?.status === "ready" ? publicRenditions(asset.renditions) : [],
      readyAt: asset?.readyAt || null,
    });
  } catch (err) {
    return next(err);
  }
}

async function retry(req, res, next) {
  try {
    const { asset, job, lesson } = await findAssetContext(req);
    if (!asset || !job) {
      throw createHttpError(404, "No video processing job found");
    }
    if (asset.status !== "failed" || job.status !== "failed") {
      throw createHttpError(409, "Only failed video processing jobs can be retried");
    }

    const now = new Date();
    const updated = await VideoProcessingJob.findOneAndUpdate(
      { _id: job._id, status: "failed" },
      {
        $set: { status: "queued", attempts: 0, availableAt: now },
        $unset: { lease: 1, error: 1, completedAt: 1 },
      },
      { new: true }
    );
    if (!updated) {
      throw createHttpError(409, "Video processing job is already being retried");
    }
    await VideoAsset.updateOne(
      { _id: asset._id },
      { $set: { status: "queued" }, $unset: { error: 1 } }
    );
    await Lesson.updateOne(
      { _id: lesson._id, videoAssetId: asset._id },
      {
        $set: {
          videoAvailable: false,
          videoProcessingStatus: "queued",
          videoProcessingUpdatedAt: now,
        },
        $unset: { videoProcessingError: 1 },
      }
    );

    return sendSuccess(res, {
      lessonId: lesson._id.toString(),
      assetId: asset._id.toString(),
      jobId: updated._id.toString(),
      status: "queued",
    }, 202);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create,
  deleteR2Object,
  publicRenditions,
  retry,
  status,
  uploadMiddleware: upload.single("video"),
};
