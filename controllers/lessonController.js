const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseGroup = require("../models/CourseGroup");
const Enrollment = require("../models/Enrollment");
const Lesson = require("../models/Lesson");
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
  "videoUrl",
  "previewImage",
];

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function youtubeVideoId(value) {
  if (!value) return null;

  try {
    const url = new URL(String(value).trim());
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let candidate = null;

    if (hostname === "youtu.be") {
      candidate = url.pathname.split("/").filter(Boolean)[0];
    } else if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "youtube-nocookie.com"
    ) {
      const segments = url.pathname.split("/").filter(Boolean);
      candidate =
        url.searchParams.get("v") ||
        (["embed", "shorts", "live"].includes(segments[0])
          ? segments[1]
          : null);
    }

    return candidate && YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
  } catch {
    return YOUTUBE_ID_PATTERN.test(String(value).trim())
      ? String(value).trim()
      : null;
  }
}

function youtubeEmbedUrl(videoId) {
  const params = new URLSearchParams({
    modestbranding: "1",
    rel: "0",
    disablekb: "0",
    fs: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

async function hasCompletedCourse(userId, course) {
  const enrollment = await Enrollment.findOne({
    userId,
    courseId: course._id,
  }).lean();
  if (!enrollment) return false;

  const lessonIds = (course.lessons || []).map((id) => String(id));
  if (lessonIds.length === 0) return false;

  const completed = new Set(
    (enrollment.completedLessonIds || []).map((id) => String(id))
  );
  return lessonIds.every((id) => completed.has(id));
}

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
    if (!req.auth) {
      throw createHttpError(401, "Authentication required");
    }

    const lessonKey = String(req.params.lessonId || "").trim();
    let lesson = null;
    if (mongoose.Types.ObjectId.isValid(lessonKey)) {
      lesson = await Lesson.findById(lessonKey);
    }
    if (!lesson) {
      lesson = await Lesson.findOne({ id: lessonKey });
    }
    if (!lesson) {
      throw createHttpError(404, "Lesson not found");
    }

    const course = await Course.findOne({ lessons: lesson._id });
    if (!course) {
      throw createHttpError(404, "Parent course not found");
    }

    const isAdmin = req.auth.user.role === "admin";

    if (!isAdmin) {
      const enrollment = await Enrollment.exists({
        userId: req.auth.userId,
        courseId: course._id,
      });
      if (!enrollment) {
        throw createHttpError(403, "Enroll in this course to watch the lesson", {
          code: "ENROLLMENT_REQUIRED",
        });
      }

      const leveledGroup = await CourseGroup.findOne({
        type: "leveled",
        courses: course._id,
      }).populate({ path: "courses", select: "_id lessons" });

      if (leveledGroup) {
        const levelIndex = leveledGroup.courses.findIndex(
          (level) => level && String(level._id) === String(course._id)
        );

        if (levelIndex > 0) {
          const previousLevel = leveledGroup.courses[levelIndex - 1];
          const previousLevelCompleted =
            previousLevel &&
            (await hasCompletedCourse(req.auth.userId, previousLevel));

          if (!previousLevelCompleted) {
            throw createHttpError(
              403,
              `Complete Level ${levelIndex} first`,
              { code: "LEVEL_LOCKED" }
            );
          }
        }
      }
    }

    const videoId = youtubeVideoId(lesson.videoUrl);
    if (!videoId) {
      throw createHttpError(404, "This lesson does not have a valid YouTube video");
    }

    res.set("Cache-Control", "private, no-store");
    res.set("Vary", "Cookie, Authorization, X-Device-Id");

    return sendSuccess(res, {
      lessonId: lesson._id.toString(),
      videoId,
      embedUrl: youtubeEmbedUrl(videoId),
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
      videoUrl: req.body.videoUrl ? String(req.body.videoUrl).trim() : undefined,
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

    course.lessons = course.lessons.filter((id) => !id.equals(lesson._id));
    await course.save();
    await Lesson.findByIdAndDelete(lesson._id);

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
  youtubeVideoId,
};
