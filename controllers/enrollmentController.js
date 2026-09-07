const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const {
  createHttpError,
  sendSuccess,
} = require("./controllerUtils");

function lessonIdSet(completedLessonIds) {
  return new Set(
    (completedLessonIds || []).map((id) => id.toString())
  );
}

function sortedLessons(course) {
  const lessons = course?.lessons || [];
  return [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0));
}

function serializeEnrollment(doc) {
  const enrollment = doc.toObject ? doc.toObject() : doc;
  const course = enrollment.courseId;
  const lessons = sortedLessons(course && typeof course === "object" ? course : null);
  const completed = lessonIdSet(enrollment.completedLessonIds);
  const completedLessons = lessons.filter((lesson) =>
    completed.has(lesson._id.toString())
  ).length;
  const totalLessons = lessons.length;
  const nextLesson = lessons.find(
    (lesson) => !completed.has(lesson._id.toString())
  );
  const courseId =
    course && typeof course === "object"
      ? course._id?.toString() || course.id
      : String(enrollment.courseId);

  return {
    id: enrollment._id.toString(),
    courseId: String(courseId),
    courseSlug: course?.slug || "",
    courseTitle: course?.title || "",
    courseCode: lessons[0]?.sheetRef || undefined,
    completedLessons,
    totalLessons,
    completedLessonIds: Array.from(completed),
    nextLessonSlug: nextLesson?.slug || null,
    completed: totalLessons > 0 && completedLessons >= totalLessons,
    createdAt: enrollment.createdAt
      ? new Date(enrollment.createdAt).toISOString()
      : undefined,
    updatedAt: enrollment.updatedAt
      ? new Date(enrollment.updatedAt).toISOString()
      : undefined,
  };
}

async function resolveCourse(courseKey) {
  const value = String(courseKey || "").trim();
  if (mongoose.Types.ObjectId.isValid(value)) {
    const byObjectId = await Course.findById(value).populate("lessons");
    if (byObjectId) return byObjectId;
  }
  return (
    (await Course.findOne({ id: value }).populate("lessons")) ||
    (await Course.findOne({ slug: value }).populate("lessons"))
  );
}

async function resolveLesson(course, lessonKey) {
  const value = String(lessonKey || "").trim();
  const lessons = course?.lessons || [];
  let lesson = lessons.find(
    (l) =>
      l &&
      (String(l._id) === value ||
        l.id === value ||
        l.slug === value ||
        l.sheetRef?.toLowerCase() === value.toLowerCase())
  );
  if (lesson) return lesson;

  if (mongoose.Types.ObjectId.isValid(value)) {
    lesson = await Lesson.findById(value);
    if (lesson) return lesson;
  }
  return (
    (await Lesson.findOne({ id: value })) ||
    (await Lesson.findOne({ slug: value }))
  );
}

async function getAll(req, res, next) {
  try {
    if (!req.auth) {
      throw createHttpError(401, "Authentication required");
    }

    const filter = {};

    if (req.query.userId === "me") {
      filter.userId = req.auth.userId;
    } else if (req.auth.user.role === "admin") {
      if (req.query.userId) {
        filter.userId = String(req.query.userId);
      }
    } else {
      throw createHttpError(403, "You can only view your own enrollments");
    }

    const enrollments = await Enrollment.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: "courseId",
        populate: { path: "lessons" },
      });

    return sendSuccess(res, enrollments.map(serializeEnrollment));
  } catch (err) {
    return next(err);
  }
}

async function getCourseEnrollment(req, res, next) {
  try {
    if (!req.auth) {
      throw createHttpError(401, "Authentication required");
    }

    const { courseKey } = req.params;
    const course = await resolveCourse(courseKey);
    if (!course) {
      throw createHttpError(404, "Course not found");
    }

    const enrollment = await Enrollment.findOne({
      userId: req.auth.userId,
      courseId: course._id,
    }).populate({
      path: "courseId",
      populate: { path: "lessons" },
    });

    if (!enrollment) {
      return sendSuccess(res, null);
    }

    return sendSuccess(res, serializeEnrollment(enrollment));
  } catch (err) {
    return next(err);
  }
}

async function completeLesson(req, res, next) {
  try {
    if (!req.auth) {
      throw createHttpError(401, "Authentication required");
    }

    const { courseKey, lessonKey } = req.params;
    const course = await resolveCourse(courseKey);
    if (!course) {
      throw createHttpError(404, "Course not found");
    }

    const lesson = await resolveLesson(course, lessonKey);
    if (!lesson) {
      throw createHttpError(404, "Lesson not found");
    }

    const enrollment = await Enrollment.findOne({
      userId: req.auth.userId,
      courseId: course._id,
    });

    if (!enrollment && req.auth.user.role !== "admin") {
      throw createHttpError(
        403,
        "You must be enrolled in this course to mark lessons complete",
        { code: "ENROLLMENT_REQUIRED" }
      );
    }

    let updatedDoc;
    if (enrollment) {
      updatedDoc = await Enrollment.findOneAndUpdate(
        { _id: enrollment._id },
        { $addToSet: { completedLessonIds: lesson._id } },
        { new: true }
      ).populate({
        path: "courseId",
        populate: { path: "lessons" },
      });
    } else {
      updatedDoc = await Enrollment.create({
        userId: req.auth.userId,
        courseId: course._id,
        completedLessonIds: [lesson._id],
      });
      await updatedDoc.populate({
        path: "courseId",
        populate: { path: "lessons" },
      });
    }

    return sendSuccess(res, {
      success: true,
      enrollment: serializeEnrollment(updatedDoc),
    });
  } catch (err) {
    return next(err);
  }
}

async function uncompleteLesson(req, res, next) {
  try {
    if (!req.auth) {
      throw createHttpError(401, "Authentication required");
    }

    const { courseKey, lessonKey } = req.params;
    const course = await resolveCourse(courseKey);
    if (!course) {
      throw createHttpError(404, "Course not found");
    }

    const lesson = await resolveLesson(course, lessonKey);
    if (!lesson) {
      throw createHttpError(404, "Lesson not found");
    }

    const enrollment = await Enrollment.findOne({
      userId: req.auth.userId,
      courseId: course._id,
    });

    if (!enrollment && req.auth.user.role !== "admin") {
      throw createHttpError(403, "You must be enrolled in this course", {
        code: "ENROLLMENT_REQUIRED",
      });
    }

    if (!enrollment) {
      return sendSuccess(res, { success: true, enrollment: null });
    }

    const updatedDoc = await Enrollment.findOneAndUpdate(
      { _id: enrollment._id },
      { $pull: { completedLessonIds: lesson._id } },
      { new: true }
    ).populate({
      path: "courseId",
      populate: { path: "lessons" },
    });

    return sendSuccess(res, {
      success: true,
      enrollment: serializeEnrollment(updatedDoc),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  completeLesson,
  getAll,
  getCourseEnrollment,
  serializeEnrollment,
  uncompleteLesson,
};
