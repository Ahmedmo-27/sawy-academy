const Enrollment = require("../models/Enrollment");
// Register Lesson so course.lessons can be populated.
require("../models/Lesson");
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

module.exports = { getAll, serializeEnrollment };
