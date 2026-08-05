const express = require("express");
const uploadController = require("../controllers/uploadController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Authenticated users only — admin CMS, profile photos, and checkout proofs.
// Public service reference images require a logged-in session.
router.post(
  "/",
  authenticate,
  uploadController.uploadMiddleware,
  uploadController.create
);

module.exports = router;
