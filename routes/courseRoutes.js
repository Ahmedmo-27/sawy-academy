const express = require("express");
const courseController = require("../controllers/courseController");
const courseGroupController = require("../controllers/courseGroupController");
const lessonController = require("../controllers/lessonController");
const videoUploadController = require("../controllers/videoUploadController");
const lessonDocumentController = require("../controllers/lessonDocumentController");
const {
  authenticate,
  requireAdmin,
  requireDevice,
} = require("../middleware/authMiddleware");
const {
  authenticateLessonUploadGrant,
} = require("../lib/lessonUploadGrant");

const router = express.Router();
const adminWrite = [authenticate, requireDevice, requireAdmin];
const grantUpload = [authenticateLessonUploadGrant];

router.get("/", courseController.getAll);
router.get("/groups", courseController.getGroups);
router.post("/groups", adminWrite, courseGroupController.create);
router.put("/groups/:id", adminWrite, courseGroupController.update);
router.delete("/groups/:id", adminWrite, courseGroupController.remove);

router.patch("/:slug/lessons/reorder", adminWrite, lessonController.reorder);
router.get("/:slug/lessons", lessonController.list);
router.post("/:slug/lessons", adminWrite, lessonController.create);
router.post(
  "/:slug/lessons/:lessonId/video/intent",
  adminWrite,
  videoUploadController.createIntent
);
router.post(
  "/:slug/lessons/:lessonId/video",
  grantUpload,
  videoUploadController.requireVideoKek,
  videoUploadController.uploadMiddleware,
  videoUploadController.create
);
router.get(
  "/:slug/lessons/:lessonId/video/status",
  adminWrite,
  videoUploadController.status
);
router.post(
  "/:slug/lessons/:lessonId/video/retry",
  adminWrite,
  videoUploadController.retry
);
router.post(
  "/:slug/lessons/:lessonId/document/intent",
  adminWrite,
  lessonDocumentController.createIntent
);
router.post(
  "/:slug/lessons/:lessonId/document",
  grantUpload,
  lessonDocumentController.uploadMiddleware,
  lessonDocumentController.uploadDocument
);
router.get(
  "/:slug/lessons/:lessonId/document/status",
  adminWrite,
  lessonDocumentController.getDocumentStatus
);
router.put("/:slug/lessons/:lessonId", adminWrite, lessonController.update);
router.delete("/:slug/lessons/:lessonId", adminWrite, lessonController.remove);

router.get("/:slug", courseController.getBySlug);
router.post("/", adminWrite, courseController.create);
router.put("/:slug", adminWrite, courseController.update);
router.delete("/:slug", adminWrite, courseController.remove);

module.exports = router;
