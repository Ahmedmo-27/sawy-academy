const express = require("express");
const enrollmentController = require("../controllers/enrollmentController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticate, enrollmentController.getAll);

module.exports = router;
