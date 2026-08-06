const express = require("express");
const researchController = require("../controllers/researchController");
const {
  authenticate,
  requireAdmin,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();
const adminWrite = [authenticate, requireDevice, requireAdmin];

router.get("/", researchController.getAll);
router.get("/:slug", researchController.getBySlug);
router.post("/", adminWrite, researchController.create);
router.put("/:slug", adminWrite, researchController.update);
router.delete("/:slug", adminWrite, researchController.remove);

module.exports = router;
