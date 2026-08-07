const express = require("express");
const deviceController = require("../controllers/deviceController");
const {
  authenticate,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/me",
  authenticate,
  requireDevice,
  deviceController.listMyDevices
);

module.exports = router;
