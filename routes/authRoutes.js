const express = require("express");
const authController = require("../controllers/authController");
const {
  authenticate,
  optionalAuthenticate,
  requireDevice,
} = require("../middleware/authMiddleware");
const { ensureCsrfCookie } = require("../lib/auth/csrf");
const { sendSuccess } = require("../controllers/controllerUtils");
const {
  csrfIpRateLimit,
  loginEmailRateLimit,
  loginIpRateLimit,
  signupEmailRateLimit,
  signupIpRateLimit,
} = require("../lib/rateLimiters");

const router = express.Router();

router.get("/csrf", csrfIpRateLimit, (req, res) => {
  const csrfToken = ensureCsrfCookie(req, res);
  return sendSuccess(res, { csrfToken });
});

router.post("/login", loginIpRateLimit, loginEmailRateLimit, authController.login);
router.post(
  "/signup",
  signupIpRateLimit,
  signupEmailRateLimit,
  authController.signup
);
router.get("/me", authenticate, requireDevice, authController.me);
// Logout must clear the httpOnly cookie even when the session/device is already gone.
router.post("/logout", optionalAuthenticate, authController.logout);

module.exports = router;
