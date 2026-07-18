const express = require("express");
const uploadController = require("../controllers/uploadController");

const router = express.Router();

router.post(
  "/",
  /* TODO: adminOnly middleware */
  uploadController.uploadMiddleware,
  uploadController.create
);

module.exports = router;
