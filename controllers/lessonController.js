const mongoose = require("mongoose");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const VideoAsset = require("../models/VideoAsset");
const VideoProcessingJob = require("../models/VideoProcessingJob");
const {
  authorizeLessonVideo,
} = require("../lib/lessonVideoAccessPolicy");
const { getMediaGrantTtlSeconds } = require("../lib/mediaGrant");
const { deleteR2Object } = require("./videoUploadController");
const { deletePrefix } = require("../lib/videoR2Storage");
const logger = require("../utils/logger");
const { toSlug } = require("../utils/slug");
const {
  createHttpError,
  pickFields,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");

const requiredFields = ["id", "title", "sheetRef", "duration", "order"];
const allowedFields = [
  "id",
  "slug",
  "title",
  "sheetRef",
  "duration",
  "order",
  "summary",
  "content",
  "previewImage",
];

async function findCourseBySlug(slug) {
  const course = await Course.findOne({ slug: String(slug).trim() });

  if (!course) {
    throw createHttpError(404, "Course not found");
  }

  return course;
}

async function findLessonForCourse(course, lessonId) {
  const value = String(lessonId).trim();
  let lesson = null;

  if (mongoose.Types.ObjectId.isValid(value)) {
    lesson = await Lesson.findById(value);
  }

  if (!lesson) {
    lesson = await Lesson.findOne({ id: value });
  }

  const belongsToCourse = lesson && course.lessons.some((id) => id.equals(lesson._id));

  if (!belongsToCourse) {
    throw createHttpError(404, "Lesson not found");
  }

  return lesson;
}

async function list(req, res, next) {
  try {
    const course = await findCourseBySlug(req.params.slug);
    const lessons = await Lesson.find({ _id: { $in: course.lessons } })
      .select("-videoUrl")
      .sort({
        order: 1,
      });

    return sendSuccess(res, lessons);
  } catch (err) {
    return next(err);
  }
}

async function getVideoAccess(req, res, next) {
  try {
    const { lesson } = await authorizeLessonVideo(
      req.auth,
      req.params.lessonId,
      { requireReadyAsset: true }
    );

    res.set("Cache-Control", "private, no-store");
    res.set("Vary", "Cookie, Authorization, X-Device-Id");

    return sendSuccess(res, {
      lessonId: lesson._id.toString(),
      signedUrl: `/api/lessons/${encodeURIComponent(
        lesson._id.toString()
      )}/manifest`,
      expiresAt: new Date(
        Date.now() + getMediaGrantTtlSeconds() * 1000
      ).toISOString(),
      watermarkText:
        req.auth.user.email || req.auth.user.name || "Sawy Academy student",
    });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    validateRequired(req.body, requiredFields);

    const course = await findCourseBySlug(req.params.slug);
    const title = String(req.body.title).trim();

    const lesson = await Lesson.create({
      id: String(req.body.id).trim(),
      slug: req.body.slug ? String(req.body.slug).trim() : toSlug(title || req.body.id),
      title,
      sheetRef: String(req.body.sheetRef).trim(),
      duration: String(req.body.duration).trim(),
      order: Number(req.body.order),
      summary: req.body.summary ? String(req.body.summary).trim() : title,
      content: req.body.content ? String(req.body.content) : "",
    });

    course.lessons.push(lesson._id);
    await course.save();

    return sendCreated(res, lesson);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const course = await findCourseBySlug(req.params.slug);
    const lesson = await findLessonForCourse(course, req.params.lessonId);
    const updates = pickFields(req.body, allowedFields);

    if (updates.title && !updates.slug) {
      updates.slug = toSlug(String(updates.title));
    }

    const updated = await Lesson.findByIdAndUpdate(lesson._id, updates, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, updated);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const course = await findCourseBySlug(req.params.slug);
    const lesson = await findLessonForCourse(course, req.params.lessonId);
    const lessonWithVideo = await Lesson.findById(lesson._id).select(
      "+videoObjectKey"
    );
    const videoAssets = await VideoAsset.find({ lessonId: lesson._id }).select(
      "+source.objectKey +outputPrefix"
    );

    course.lessons = course.lessons.filter((id) => !id.equals(lesson._id));
    await course.save();
    await Lesson.findByIdAndDelete(lesson._id);
    if (videoAssets.length > 0) {
      const assetIds = videoAssets.map((asset) => asset._id);
      await Promise.all([
        VideoProcessingJob.deleteMany({ assetId: { $in: assetIds } }),
        VideoAsset.deleteMany({ _id: { $in: assetIds } }),
      ]);
    }

    if (lessonWithVideo?.videoObjectKey) {
      deleteR2Object(lessonWithVideo.videoObjectKey).catch((error) => {
        logger.warn("Failed to remove deleted lesson video from R2", {
          lessonId: lesson._id,
          error,
        });
      });
    }
    if (videoAssets.length > 0) {
      Promise.all(
        videoAssets.flatMap((asset) => [
          deleteR2Object(asset.source.objectKey),
          deletePrefix(asset.outputPrefix),
          deletePrefix(`${asset.outputPrefix.slice(0, -4)}staging/`),
        ])
      ).catch((error) => {
        logger.warn("Failed to remove deleted lesson video asset from R2", {
          lessonId: lesson._id,
          error,
        });
      });
    }

    return sendSuccess(res, lesson);
  } catch (err) {
    return next(err);
  }
}

async function reorder(req, res, next) {
  try {
    const course = await findCourseBySlug(req.params.slug);
    const { lessonIds } = req.body;

    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      throw createHttpError(400, "lessonIds must be a non-empty array");
    }

    const resolvedLessons = [];

    for (const key of lessonIds) {
      resolvedLessons.push(await findLessonForCourse(course, key));
    }

    await Promise.all(
      resolvedLessons.map((lesson, index) =>
        Lesson.findByIdAndUpdate(lesson._id, { order: index + 1 })
      )
    );

    course.lessons = resolvedLessons.map((lesson) => lesson._id);
    await course.save();

    const lessons = await Lesson.find({ _id: { $in: course.lessons } }).sort({
      order: 1,
    });

    return sendSuccess(res, lessons);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create,
  getVideoAccess,
  list,
  remove,
  reorder,
  update,
};
