const express = require("express");
const lessonController = require("../controllers/lessonController");
const protectedVideoController = require("../controllers/protectedVideoController");
const {
  authenticate,
  requireDevice,
} = require("../middleware/authMiddleware");
const {
  videoAccessRateLimit,
} = require("../lib/videoAccessRateLimit");
const { beginHlsKeyAudit } = require("../lib/videoAccessAudit");

const router = express.Router();

router.get(
  "/:lessonId/video-access",
  authenticate,
  requireDevice,
  videoAccessRateLimit,
  lessonController.getVideoAccess
);

router.get(
  "/:lessonId/manifest",
  authenticate,
  requireDevice,
  videoAccessRateLimit,
  protectedVideoController.getManifest
);

router.get(
  "/:lessonId/hls-key",
  authenticate,
  beginHlsKeyAudit,
  requireDevice,
  videoAccessRateLimit,
  protectedVideoController.getHlsKey
);

module.exports = router;
