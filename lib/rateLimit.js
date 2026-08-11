const { createHttpError } = require("../controllers/controllerUtils");

const PRUNE_THRESHOLD = 1_000;

function ipKey(req) {
  return String(req.ip || req.socket?.remoteAddress || "unknown");
}

function emailKey(req) {
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  return email || "missing";
}

function userKey(req) {
  return req.auth?.userId ? String(req.auth.userId) : "";
}

function serviceCreateKey(req) {
  if (req.auth?.userId) return `user:${req.auth.userId}`;
  return `ip:${ipKey(req)}`;
}

function createRateLimiter({
  max,
  windowMs,
  keyFn,
  code = "RATE_LIMITED",
  message = "Too many requests. Please wait before trying again.",
  requireKey = false,
}) {
  const store = new Map();

  function pruneExpiredWindows(now) {
    if (store.size < PRUNE_THRESHOLD) return;
    for (const [key, window] of store) {
      if (window.resetAt <= now) store.delete(key);
    }
  }

  function middleware(req, res, next) {
    const key = keyFn(req);
    if (!key) {
      if (requireKey) {
        return next(createHttpError(401, "Authentication required"));
      }
      return next();
    }

    const now = Date.now();
    let window = store.get(key);

    if (!window || window.resetAt <= now) {
      window = { count: 0, resetAt: now + windowMs };
      store.set(key, window);
    }

    window.count += 1;
    const remaining = Math.max(0, max - window.count);
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(remaining));
    res.set("RateLimit-Reset", String(Math.ceil(window.resetAt / 1000)));

    pruneExpiredWindows(now);

    if (window.count > max) {
      res.set("Retry-After", String(Math.ceil((window.resetAt - now) / 1000)));
      return next(createHttpError(429, message, { code }));
    }

    return next();
  }

  middleware.reset = () => store.clear();
  middleware.max = max;
  middleware.windowMs = windowMs;

  return middleware;
}

module.exports = {
  createRateLimiter,
  ipKey,
  emailKey,
  userKey,
  serviceCreateKey,
};
