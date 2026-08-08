const express = require("express");
const lessonController = require("../controllers/lessonController");
const {
  authenticate,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/:lessonId/video-access",
  authenticate,
  requireDevice,
  lessonController.getVideoAccess
);

module.exports = router;
