const express = require("express");
const contactController = require("../controllers/contactController");
const {
  authenticate,
  requireAdmin,
  requireDevice,
} = require("../middleware/authMiddleware");
const { contactIpRateLimit } = require("../lib/rateLimiters");

const router = express.Router();
const adminOnly = [authenticate, requireDevice, requireAdmin];

router.post("/", contactIpRateLimit, contactController.create);
router.get("/", ...adminOnly, contactController.getAll);
router.patch("/:id", ...adminOnly, contactController.updateStatus);

module.exports = router;
