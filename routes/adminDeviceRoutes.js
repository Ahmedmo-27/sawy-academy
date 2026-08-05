const express = require("express");
const deviceController = require("../controllers/deviceController");
const {
  authenticate,
  requireAdmin,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate, requireDevice, requireAdmin);

router.get("/users/:userId/devices", deviceController.listUserDevicesAdmin);
router.delete(
  "/users/:userId/devices/:deviceId",
  deviceController.removeUserDeviceAdmin
);

module.exports = router;
