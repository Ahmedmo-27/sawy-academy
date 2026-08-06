const mongoose = require("mongoose");
const Course = require("../models/Course");
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
    const lessons = await Lesson.find({ _id: { $in: course.lessons } }).sort({
      order: 1,
    });

    return sendSuccess(res, lessons);
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

module.exports = { create, list, remove, reorder, update };
