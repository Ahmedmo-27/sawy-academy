const express = require("express");
const siteSettingsController = require("../controllers/siteSettingsController");
const {
  authenticate,
  requireAdmin,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();
const adminWrite = [authenticate, requireDevice, requireAdmin];

router.get("/", siteSettingsController.get);
router.put("/", adminWrite, siteSettingsController.update);
router.post("/reset", adminWrite, siteSettingsController.reset);

module.exports = router;
