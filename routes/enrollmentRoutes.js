const express = require("express");
const enrollmentController = require("../controllers/enrollmentController");
const {
  authenticate,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();
const studentAuth = [authenticate, requireDevice];

router.get("/", ...studentAuth, enrollmentController.getAll);
router.get("/courses/:courseKey", ...studentAuth, enrollmentController.getCourseEnrollment);
router.post(
  "/courses/:courseKey/lessons/:lessonKey/complete",
  ...studentAuth,
  enrollmentController.completeLesson
);
router.delete(
  "/courses/:courseKey/lessons/:lessonKey/complete",
  ...studentAuth,
  enrollmentController.uncompleteLesson
);

module.exports = router;
