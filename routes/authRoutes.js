const express = require("express");
const authController = require("../controllers/authController");
const {
  authenticate,
  optionalAuthenticate,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.get("/me", authenticate, requireDevice, authController.me);
// Logout must clear the httpOnly cookie even when the session/device is already gone.
router.post("/logout", optionalAuthenticate, authController.logout);

module.exports = router;
