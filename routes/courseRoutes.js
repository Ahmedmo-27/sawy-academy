const express = require("express");
const courseController = require("../controllers/courseController");
const courseGroupController = require("../controllers/courseGroupController");
const lessonController = require("../controllers/lessonController");
const {
  authenticate,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();
const adminWrite = [authenticate, requireAdmin];

router.get("/", courseController.getAll);
router.get("/groups", courseController.getGroups);
router.post("/groups", adminWrite, courseGroupController.create);
router.put("/groups/:id", adminWrite, courseGroupController.update);
router.delete("/groups/:id", adminWrite, courseGroupController.remove);

router.patch("/:slug/lessons/reorder", adminWrite, lessonController.reorder);
router.get("/:slug/lessons", lessonController.list);
router.post("/:slug/lessons", adminWrite, lessonController.create);
router.put("/:slug/lessons/:lessonId", adminWrite, lessonController.update);
router.delete("/:slug/lessons/:lessonId", adminWrite, lessonController.remove);

router.get("/:slug", courseController.getBySlug);
router.post("/", adminWrite, courseController.create);
router.put("/:slug", adminWrite, courseController.update);
router.delete("/:slug", adminWrite, courseController.remove);

module.exports = router;
