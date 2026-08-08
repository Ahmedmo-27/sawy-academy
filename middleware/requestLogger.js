const logger = require("../utils/logger");

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const details = {
      method: req.method,
      // Query strings can contain short-lived media grants or other secrets.
      path: req.path || req.originalUrl?.split("?")[0] || req.url?.split("?")[0],
      status: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    if (res.statusCode >= 500) {
      logger.error("API response", details);
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn("API response", details);
      return;
    }

    logger.info("API response", details);
  });

  next();
}

module.exports = requestLogger;
