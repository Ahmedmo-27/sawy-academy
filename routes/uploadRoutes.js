const express = require("express");
const uploadController = require("../controllers/uploadController");
const {
  authenticate,
  requireDevice,
} = require("../middleware/authMiddleware");
const { uploadIpRateLimit } = require("../lib/rateLimiters");

const router = express.Router();

function requireAuthUnlessServiceReference(req, res, next) {
  const purpose = String(req.body?.purpose || "")
    .trim()
    .toLowerCase();
  if (purpose === "service-reference") {
    return next();
  }

  return authenticate(req, res, (authError) => {
    if (authError) return next(authError);
    return requireDevice(req, res, next);
  });
}

// Multer runs first so purpose/guestName are available on req.body.
// Service reference uploads are guest-friendly (no session/device required).
router.post(
  "/",
  uploadController.uploadMiddleware,
  uploadIpRateLimit,
  requireAuthUnlessServiceReference,
  uploadController.create
);

module.exports = router;
