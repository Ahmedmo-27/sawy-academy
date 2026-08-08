const { createHttpError } = require("../controllers/controllerUtils");

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const requestsByUser = new Map();

function pruneExpiredWindows(now) {
  if (requestsByUser.size < 1_000) return;
  for (const [userId, window] of requestsByUser) {
    if (window.resetAt <= now) requestsByUser.delete(userId);
  }
}

function videoAccessRateLimit(req, res, next) {
  if (!req.auth?.userId) {
    return next(createHttpError(401, "Authentication required"));
  }

  const now = Date.now();
  const userId = String(req.auth.userId);
  let window = requestsByUser.get(userId);

  if (!window || window.resetAt <= now) {
    window = { count: 0, resetAt: now + WINDOW_MS };
    requestsByUser.set(userId, window);
  }

  window.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - window.count);
  res.set("RateLimit-Limit", String(MAX_REQUESTS_PER_WINDOW));
  res.set("RateLimit-Remaining", String(remaining));
  res.set("RateLimit-Reset", String(Math.ceil(window.resetAt / 1000)));

  pruneExpiredWindows(now);

  if (window.count > MAX_REQUESTS_PER_WINDOW) {
    res.set("Retry-After", String(Math.ceil((window.resetAt - now) / 1000)));
    return next(
      createHttpError(
        429,
        "Too many video access requests. Please wait before trying again.",
        { code: "VIDEO_ACCESS_RATE_LIMITED" }
      )
    );
  }

  return next();
}

module.exports = {
  MAX_REQUESTS_PER_WINDOW,
  WINDOW_MS,
  videoAccessRateLimit,
};
