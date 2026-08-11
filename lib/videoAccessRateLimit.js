const { createRateLimiter, userKey } = require("./rateLimit");

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;

const videoAccessRateLimit = createRateLimiter({
  max: MAX_REQUESTS_PER_WINDOW,
  windowMs: WINDOW_MS,
  keyFn: userKey,
  requireKey: true,
  code: "VIDEO_ACCESS_RATE_LIMITED",
  message: "Too many video access requests. Please wait before trying again.",
});

module.exports = {
  MAX_REQUESTS_PER_WINDOW,
  WINDOW_MS,
  videoAccessRateLimit,
};
