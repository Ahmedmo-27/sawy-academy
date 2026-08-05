const express = require("express");
const deviceController = require("../controllers/deviceController");
const {
  authenticate,
  optionalAuthenticate,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/me",
  authenticate,
  requireDevice,
  deviceController.listMyDevices
);

router.delete(
  "/me/:deviceId",
  optionalAuthenticate,
  deviceController.removeMyDevice
);

module.exports = router;
