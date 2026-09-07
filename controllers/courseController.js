const Course = require("../models/Course");
const CourseGroup = require("../models/CourseGroup");
const Product = require("../models/Product");
const Lesson = require("../models/Lesson");
const VideoAsset = require("../models/VideoAsset");
const VideoProcessingJob = require("../models/VideoProcessingJob");
const DocumentAsset = require("../models/DocumentAsset");
const videoR2Storage = require("../lib/videoR2Storage");
const { getPublicR2Config, isPublicR2Configured } = require("../lib/r2Config");
const accessPolicy = require("../lib/lessonVideoAccessPolicy");
const logger = require("../utils/logger");
const {
  createHttpError,
  getPagination,
  pickFields,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");

const requiredFields = ["id", "title", "description", "level", "instructor", "price"];
const allowedFields = [
  "id",
  "slug",
  "title",
  "description",
  "level",
  "instructor",
  "price",
  "image",
  "relatedProductIds",
];

async function checkCanAccessCourse(auth, course) {
  if (!auth) return false;
  if (auth.user?.role === "admin") return true;
  try {
    await accessPolicy.assertCourseAccess(auth, course);
    return true;
  } catch {
    return false;
  }
}

function sanitizeCourseLessons(courseObj, canAccess) {
  if (canAccess || !courseObj || !Array.isArray(courseObj.lessons)) {
    return courseObj;
  }

  const plain =
    typeof courseObj.toObject === "function" ? courseObj.toObject() : { ...courseObj };

  plain.lessons = (plain.lessons || []).map((lesson) => {
    const l = typeof lesson?.toObject === "function" ? lesson.toObject() : { ...lesson };
    l.content = ""; // Gated: Strip full Markdown notes for unenrolled visitors
    l.isGated = true;
    return l;
  });

  return plain;
}

function populateCourse(query, includeLessons = false) {
  const populatedQuery = query.populate("relatedProductIds");

  if (includeLessons) {
    // Video locations are access-controlled by GET /api/lessons/:id/video-access.
    // Never include them in public course/catalog payloads.
    return populatedQuery.populate({ path: "lessons", select: "-videoUrl" });
  }

  return populatedQuery;
}

async function resolveRelatedProductIds(relatedProductIds) {
  if (!Array.isArray(relatedProductIds)) {
    return relatedProductIds;
  }

  const resolved = [];

  for (const value of relatedProductIds) {
    if (!value) continue;

    const asString = String(value);
    const product =
      (await Product.findById(asString).catch(() => null)) ||
      (await Product.findOne({ id: asString }));

    if (!product) {
      throw createHttpError(400, `Related product not found: ${asString}`);
    }

    resolved.push(product._id);
  }

  return resolved;
}

async function getAll(req, res, next) {
  try {
    const { limit, skip } = getPagination(req.query);
    const includeLessons =
      req.query.includeLessons === "1" ||
      req.query.includeLessons === "true";
    const courses = await populateCourse(Course.find({}), includeLessons)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (includeLessons) {
      const sanitized = await Promise.all(
        courses.map(async (c) => {
          const canAccess = await checkCanAccessCourse(req.auth, c);
          return sanitizeCourseLessons(c, canAccess);
        })
      );
      return sendSuccess(res, sanitized);
    }

    return sendSuccess(res, courses);
  } catch (err) {
    return next(err);
  }
}

async function getGroups(req, res, next) {
  try {
    const groups = await CourseGroup.find({})
      .sort({ createdAt: 1 })
      .populate({
        path: "courses",
        populate: [
          { path: "relatedProductIds" },
          { path: "lessons", select: "title slug duration order" },
        ],
      })
      .lean();

    return sendSuccess(res, groups);
  } catch (err) {
    return next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const courseDoc = await populateCourse(
      Course.findOne({ slug: req.params.slug }),
      true
    );

    if (!courseDoc) {
      throw createHttpError(404, "Course not found");
    }

    const canAccess = await checkCanAccessCourse(req.auth, courseDoc);
    const course = sanitizeCourseLessons(courseDoc, canAccess);

    return sendSuccess(res, course);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    validateRequired(req.body, requiredFields);
    const payload = pickFields(req.body, allowedFields);
    if (Object.prototype.hasOwnProperty.call(payload, "relatedProductIds")) {
      payload.relatedProductIds = await resolveRelatedProductIds(
        payload.relatedProductIds
      );
    }
    const course = await Course.create(payload);
    const populatedCourse = await populateCourse(Course.findById(course._id), true);
    return sendCreated(res, populatedCourse);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const payload = pickFields(req.body, allowedFields);
    if (Object.prototype.hasOwnProperty.call(payload, "relatedProductIds")) {
      payload.relatedProductIds = await resolveRelatedProductIds(
        payload.relatedProductIds
      );
    }

    const course = await populateCourse(
      Course.findOneAndUpdate(
        { slug: req.params.slug },
        payload,
        { new: true, runValidators: true }
      ),
      true
    );

    if (!course) {
      throw createHttpError(404, "Course not found");
    }

    return sendSuccess(res, course);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const course = await Course.findOne({ slug: req.params.slug });

    if (!course) {
      throw createHttpError(404, "Course not found");
    }

    const lessonIds = course.lessons || [];

    // 1. Remove course from any CourseGroup records
    await CourseGroup.updateMany(
      { courses: course._id },
      { $pull: { courses: course._id } }
    ).catch((error) => {
      logger.warn("Failed to remove deleted course from groups", {
        courseId: course._id,
        error,
      });
    });

    // 2. Cascade delete MongoDB documents for lessons, videos, jobs, docs
    if (lessonIds.length > 0) {
      const videoAssets = await VideoAsset.find({
        $or: [{ courseId: course._id }, { lessonId: { $in: lessonIds } }],
      }).select("_id");
      const videoAssetIds = videoAssets.map((asset) => asset._id);

      await Promise.all([
        VideoProcessingJob.deleteMany({
          $or: [
            { assetId: { $in: videoAssetIds } },
            { lessonId: { $in: lessonIds } },
          ],
        }),
        VideoAsset.deleteMany({
          $or: [{ courseId: course._id }, { lessonId: { $in: lessonIds } }],
        }),
        DocumentAsset.deleteMany({
          $or: [{ courseId: course._id }, { lessonId: { $in: lessonIds } }],
        }),
        Lesson.deleteMany({ _id: { $in: lessonIds } }),
      ]);
    }

    // 3. Delete the course document itself
    await Course.findByIdAndDelete(course._id);

    // 4. Delete R2 storage prefixes for this course in background (private and public)
    const publicBucketName = isPublicR2Configured()
      ? getPublicR2Config().bucketName
      : null;

    Promise.all([
      videoR2Storage.deletePrefix(`video-assets/${course._id}/`),
      videoR2Storage.deletePrefix(`docs/${course._id}/`),
      publicBucketName
        ? videoR2Storage.deletePrefix(
            `website-assets/courses/${course._id}/`,
            publicBucketName
          )
        : Promise.resolve(),
    ]).catch((error) => {
      logger.warn("Failed to delete course R2 storage prefixes", {
        courseId: course._id,
        error,
      });
    });

    return sendSuccess(res, course);
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, getAll, getBySlug, getGroups, remove, update };
