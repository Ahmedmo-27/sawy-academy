const express = require("express");
const authController = require("../controllers/authController");
const {
  authenticate,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.get("/me", authenticate, requireDevice, authController.me);
router.post("/logout", authenticate, authController.logout);

module.exports = router;
