const express = require("express");
const serviceController = require("../controllers/serviceController");
const {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
  requireDevice,
} = require("../middleware/authMiddleware");
const { serviceCreateRateLimit } = require("../lib/rateLimiters");

const router = express.Router();
const studentAuth = [authenticate, requireDevice];
const adminWrite = [authenticate, requireDevice, requireAdmin];

router.post(
  "/",
  optionalAuthenticate,
  serviceCreateRateLimit,
  serviceController.create
);
router.get("/", ...studentAuth, serviceController.getAll);
router.get(
  "/:id/reference-images/:index",
  ...studentAuth,
  serviceController.getReferenceImage
);
router.get("/:id", ...studentAuth, serviceController.getById);
router.patch("/:id", ...adminWrite, serviceController.updateStatus);

module.exports = router;
