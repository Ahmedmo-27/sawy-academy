const express = require("express");
const deviceController = require("../controllers/deviceController");
const videoAccessFlagController = require("../controllers/videoAccessFlagController");
const {
  authenticate,
  requireAdmin,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate, requireDevice, requireAdmin);

router.get("/users/:userId/devices", deviceController.listUserDevicesAdmin);
router.post(
  "/users/:userId/revoke-sessions",
  videoAccessFlagController.revokeUserSessions
);
router.delete(
  "/users/:userId/devices/:deviceId",
  deviceController.removeUserDeviceAdmin
);
router.get("/video-access-flags", videoAccessFlagController.listFlags);
router.get("/video-access-flags/:flagId", videoAccessFlagController.getFlag);
router.patch(
  "/video-access-flags/:flagId",
  videoAccessFlagController.updateFlag
);

module.exports = router;
