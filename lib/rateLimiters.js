const {
  createRateLimiter,
  ipKey,
  emailKey,
  userKey,
  serviceCreateKey,
} = require("./rateLimit");

const ONE_MINUTE_MS = 60_000;
const TEN_MINUTES_MS = 10 * 60_000;
const FIFTEEN_MINUTES_MS = 15 * 60_000;
const ONE_HOUR_MS = 60 * 60_000;

const loginIpRateLimit = createRateLimiter({
  max: 8,
  windowMs: FIFTEEN_MINUTES_MS,
  keyFn: ipKey,
  message: "Too many login attempts. Please wait before trying again.",
});

const loginEmailRateLimit = createRateLimiter({
  max: 8,
  windowMs: FIFTEEN_MINUTES_MS,
  keyFn: emailKey,
  message: "Too many login attempts for this email. Please wait before trying again.",
});

const signupIpRateLimit = createRateLimiter({
  max: 5,
  windowMs: FIFTEEN_MINUTES_MS,
  keyFn: ipKey,
  message: "Too many signup attempts. Please wait before trying again.",
});

const signupEmailRateLimit = createRateLimiter({
  max: 3,
  windowMs: ONE_HOUR_MS,
  keyFn: emailKey,
  message: "Too many signup attempts for this email. Please wait before trying again.",
});

const csrfIpRateLimit = createRateLimiter({
  max: 60,
  windowMs: ONE_MINUTE_MS,
  keyFn: ipKey,
  message: "Too many CSRF token requests. Please wait before trying again.",
});

const passwordChangeRateLimit = createRateLimiter({
  max: 5,
  windowMs: FIFTEEN_MINUTES_MS,
  keyFn: userKey,
  requireKey: true,
  message: "Too many password change attempts. Please wait before trying again.",
});

const serviceCreateRateLimit = createRateLimiter({
  max: 5,
  windowMs: FIFTEEN_MINUTES_MS,
  keyFn: serviceCreateKey,
  message: "Too many service requests. Please wait before trying again.",
});

const uploadIpRateLimit = createRateLimiter({
  max: 10,
  windowMs: FIFTEEN_MINUTES_MS,
  keyFn: ipKey,
  message: "Too many uploads. Please wait before trying again.",
});

const orderCreateRateLimit = createRateLimiter({
  max: 8,
  windowMs: TEN_MINUTES_MS,
  keyFn: userKey,
  requireKey: true,
  message: "Too many order submissions. Please wait before trying again.",
});

module.exports = {
  loginIpRateLimit,
  loginEmailRateLimit,
  signupIpRateLimit,
  signupEmailRateLimit,
  csrfIpRateLimit,
  passwordChangeRateLimit,
  serviceCreateRateLimit,
  uploadIpRateLimit,
  orderCreateRateLimit,
};
