const fs = require("fs");
const os = require("os");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const DocumentAsset = require("../models/DocumentAsset");
const {
  createHttpError,
  sendCreated,
  sendSuccess,
} = require("./controllerUtils");
const {
  getPrivateR2Config,
  getR2Client,
  isPrivateR2Configured,
} = require("../lib/r2Config");
const { buildLessonDocKey } = require("../lib/r2ObjectKeys");
const { getPrivateObject, putPrivateObject } = require("../lib/privateR2Storage");
const {
  assertCourseAccess,
  findLesson,
} = require("../lib/lessonVideoAccessPolicy");
const { createLessonUploadIntent } = require("../lib/lessonUploadGrant");

const DEFAULT_MAX_DOC_BYTES = 50 * 1024 * 1024;

function maxDocBytes() {
  const configured = Number(process.env.DOCUMENT_UPLOAD_MAX_BYTES);
  return Number.isFinite(configured) && configured > 0
    ? Math.floor(configured)
    : DEFAULT_MAX_DOC_BYTES;
}

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: maxDocBytes(), files: 1 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      callback(createHttpError(400, "Only PDF documents are allowed"));
      return;
    }
    callback(null, true);
  },
});

async function deleteR2Object(objectKey) {
  if (!objectKey || !isPrivateR2Configured()) return;
  const config = getPrivateR2Config();
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
    })
  );
}

async function resolveCourseLesson(slug, lessonKey) {
  const course = await Course.findOne({ slug: String(slug) });
  if (!course) {
    throw createHttpError(404, "Course not found");
  }

  const key = String(lessonKey || "").trim();
  const lessonIdentity = mongoose.Types.ObjectId.isValid(key)
    ? { $or: [{ _id: key }, { id: key }] }
    : { id: key };
  const lesson = await Lesson.findOne({
    ...lessonIdentity,
    _id: { $in: course.lessons },
  }).select("+documentGeneration +documentObjectKey +documentOriginalFilename");

  if (!lesson) {
    throw createHttpError(404, "Lesson not found");
  }

  return { course, lesson };
}

async function uploadDocument(req, res, next) {
  let uploadedObjectKey = null;
  let createdAssetId = null;

  try {
    if (!req.file) {
      throw createHttpError(400, "No lesson document uploaded");
    }
    if (!isPrivateR2Configured()) {
      throw createHttpError(
        503,
        "Private R2 is not configured for lesson documents"
      );
    }

    const { course, lesson } = await resolveCourseLesson(
      req.params.slug,
      req.params.lessonId
    );

    const assetId = new mongoose.Types.ObjectId();
    const nextGeneration = (lesson.documentGeneration || 0) + 1;
    const objectKey = buildLessonDocKey(
      course._id.toString(),
      lesson._id.toString(),
      assetId.toString(),
      req.file.originalname
    );

    const body = fs.createReadStream(req.file.path);
    await putPrivateObject({
      objectKey,
      body,
      contentType: "application/pdf",
      contentDisposition: `inline; filename="${path.basename(objectKey)}"`,
    });
    uploadedObjectKey = objectKey;

    const asset = await DocumentAsset.create({
      _id: assetId,
      lessonId: lesson._id,
      courseId: course._id,
      generation: nextGeneration,
      status: "ready",
      objectKey,
      filename: req.file.originalname || "lesson.pdf",
      contentType: "application/pdf",
      sizeBytes: req.file.size,
    });
    createdAssetId = asset._id;

    if (lesson.documentAssetId) {
      await DocumentAsset.updateMany(
        {
          lessonId: lesson._id,
          _id: { $ne: asset._id },
          status: "ready",
        },
        { $set: { status: "superseded" } }
      );
    }

    const previousKey = lesson.documentObjectKey;
    await Lesson.findByIdAndUpdate(lesson._id, {
      documentObjectKey: objectKey,
      documentAvailable: true,
      documentOriginalFilename: asset.filename,
      documentAssetId: asset._id,
      documentGeneration: nextGeneration,
    });

    if (previousKey && previousKey !== objectKey) {
      deleteR2Object(previousKey).catch(() => {});
    }

    return sendCreated(res, {
      lessonId: lesson._id.toString(),
      assetId: asset._id.toString(),
      generation: nextGeneration,
      filename: asset.filename,
      status: "ready",
      documentAvailable: true,
    });
  } catch (err) {
    if (uploadedObjectKey) {
      deleteR2Object(uploadedObjectKey).catch(() => {});
    }
    if (createdAssetId) {
      DocumentAsset.deleteOne({ _id: createdAssetId }).catch(() => {});
    }
    return next(err);
  } finally {
    if (req.file?.path) {
      fs.promises.unlink(req.file.path).catch(() => {});
    }
  }
}

async function downloadDocument(req, res, next) {
  try {
    if (!req.auth) {
      throw createHttpError(401, "Authentication required");
    }

    const lesson = await findLesson(req.params.lessonId);
    const course = await Course.findOne({ lessons: lesson._id });
    if (!course) {
      throw createHttpError(404, "Parent course not found");
    }

    await assertCourseAccess(req.auth, course);

    const docLesson = await Lesson.findById(lesson._id).select(
      "+documentObjectKey +documentOriginalFilename"
    );
    if (!docLesson?.documentAvailable || !docLesson.documentObjectKey) {
      throw createHttpError(404, "Lesson document is not available");
    }

    const object = await getPrivateObject(docLesson.documentObjectKey);
    if (!object.Body) {
      throw createHttpError(404, "Lesson document is not available");
    }

    res.set("Cache-Control", "private, no-store");
    res.set("Vary", "Cookie, Authorization, X-Device-Id");
    res.set("Content-Type", object.ContentType || "application/pdf");
    res.set(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(
        docLesson.documentOriginalFilename || "lesson.pdf"
      )}"`
    );
    if (object.ContentLength) {
      res.set("Content-Length", String(object.ContentLength));
    }

    object.Body.pipe(res);
  } catch (err) {
    return next(err);
  }
}

async function getDocumentStatus(req, res, next) {
  try {
    const { lesson } = await resolveCourseLesson(
      req.params.slug,
      req.params.lessonId
    );
    const asset = lesson.documentAssetId
      ? await DocumentAsset.findById(lesson.documentAssetId)
      : null;

    return sendSuccess(res, {
      lessonId: lesson._id.toString(),
      documentAvailable: Boolean(lesson.documentAvailable),
      assetId: asset?._id?.toString() || null,
      filename: asset?.filename || lesson.documentOriginalFilename || null,
      status: asset?.status || (lesson.documentAvailable ? "ready" : "none"),
      generation: lesson.documentGeneration || 0,
    });
  } catch (err) {
    return next(err);
  }
}

function createIntent(req, res, next) {
  try {
    return sendSuccess(res, createLessonUploadIntent(req, "document"));
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  uploadMiddleware: upload.single("document"),
  uploadDocument,
  createIntent,
  downloadDocument,
  getDocumentStatus,
};
