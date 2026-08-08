const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseGroup = require("../models/CourseGroup");
const Enrollment = require("../models/Enrollment");
const Lesson = require("../models/Lesson");
const VideoAsset = require("../models/VideoAsset");
const {
  getPrerequisiteMessage,
  isLevelLocked,
} = require("./courseProgressRules");
const { createHttpError } = require("../controllers/controllerUtils");

async function hasCompletedCourse(userId, course) {
  const enrollment = await Enrollment.findOne({
    userId,
    courseId: course._id,
  }).lean();
  if (!enrollment) return false;

  const lessonIds = (course.lessons || []).map(String);
  if (lessonIds.length === 0) return false;
  const completed = new Set((enrollment.completedLessonIds || []).map(String));
  return lessonIds.every((id) => completed.has(id));
}

async function findLesson(lessonKey) {
  const value = String(lessonKey || "").trim();
  let lesson = null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    lesson = await Lesson.findById(value).select("+videoObjectKey");
  }
  if (!lesson) {
    lesson = await Lesson.findOne({ id: value }).select("+videoObjectKey");
  }
  if (!lesson) throw createHttpError(404, "Lesson not found");
  return lesson;
}

async function assertCourseAccess(auth, course) {
  if (auth.user.role === "admin") return;

  const enrollment = await Enrollment.exists({
    userId: auth.userId,
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
  if (!leveledGroup) return;

  const levelIndex = leveledGroup.courses.findIndex(
    (level) => level && String(level._id) === String(course._id)
  );
  if (levelIndex <= 0) return;

  const previousLevel = leveledGroup.courses[levelIndex - 1];
  const previousLevelCompleted =
    previousLevel && (await hasCompletedCourse(auth.userId, previousLevel));
  if (isLevelLocked(levelIndex + 1, previousLevelCompleted)) {
    throw createHttpError(
      403,
      getPrerequisiteMessage(levelIndex + 1, true),
      { code: "LEVEL_LOCKED" }
    );
  }
}

async function authorizeLessonVideo(auth, lessonKey, options = {}) {
  if (!auth) throw createHttpError(401, "Authentication required");

  const lesson = await findLesson(lessonKey);
  const course = await Course.findOne({ lessons: lesson._id });
  if (!course) throw createHttpError(404, "Parent course not found");
  await assertCourseAccess(auth, course);

  if (!options.requireReadyAsset) return { lesson, course, asset: null };

  const asset = await VideoAsset.findOne({
    _id: lesson.videoAssetId,
    lessonId: lesson._id,
    courseId: course._id,
    status: "ready",
  })
    .select(
      "+outputPrefix +masterPlaylistObjectKey +encryption.wrappedKey " +
        "+encryption.wrapIv +encryption.authTag +encryption.kekVersion"
    );
  if (!asset || !asset.masterPlaylistObjectKey || !asset.outputPrefix) {
    throw createHttpError(404, "Protected video is not ready", {
      code: "VIDEO_NOT_READY",
    });
  }

  return { lesson, course, asset };
}

module.exports = {
  assertCourseAccess,
  authorizeLessonVideo,
  findLesson,
  hasCompletedCourse,
};
