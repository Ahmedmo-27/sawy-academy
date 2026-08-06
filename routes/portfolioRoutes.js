const express = require("express");
const projectController = require("../controllers/projectController");
const {
  authenticate,
  requireAdmin,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();
const adminWrite = [authenticate, requireDevice, requireAdmin];

router.get("/", projectController.getAll);
router.patch("/reorder", adminWrite, projectController.reorder);
router.get("/:slug", projectController.getBySlug);
router.post("/", adminWrite, projectController.create);
router.put("/:slug", adminWrite, projectController.update);
router.delete("/:slug", adminWrite, projectController.remove);

module.exports = router;
