const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;

  const errorBody = {
    message: err.message || "Internal server error",
    statusCode,
  };

  if (err.code) errorBody.code = err.code;
  if (err.devices) errorBody.devices = err.devices;

  const details = {
    method: req.method,
    path: req.originalUrl || req.url,
    status: statusCode,
    error: err,
  };

  if (statusCode >= 500) {
    logger.error("Unhandled API error", details);
  } else {
    logger.warn("Handled API error", details);
  }

  return res.status(statusCode).json({
    success: false,
    data: null,
    error: errorBody,
  });
}

module.exports = errorHandler;
