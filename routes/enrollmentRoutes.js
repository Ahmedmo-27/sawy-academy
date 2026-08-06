const express = require("express");
const enrollmentController = require("../controllers/enrollmentController");
const {
  authenticate,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticate, requireDevice, enrollmentController.getAll);

module.exports = router;
