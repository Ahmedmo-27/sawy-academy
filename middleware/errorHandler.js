const logger = require("../utils/logger");
const { clearSessionCookie } = require("../lib/auth/sessionCookie");

function isClientAbort(err) {
  return (
    err?.message === "Request aborted" ||
    err?.code === "ECONNABORTED" ||
    err?.code === "ECONNRESET"
  );
}

function errorHandler(err, req, res, next) {
  void next; // Express identifies error middleware by its four-argument signature.
  const statusCode = err.statusCode || err.status || (isClientAbort(err) ? 499 : 500);

  const errorBody = {
    message: isClientAbort(err)
      ? "Upload was cancelled or the connection closed before the file finished sending."
      : err.message || "Internal server error",
    statusCode,
  };

  if (err.code) errorBody.code = err.code;
  if (err.devices) errorBody.devices = err.devices;

  if (err.code === "DEVICE_REMOVED" || err.code === "SESSION_REVOKED") {
    clearSessionCookie(res);
  }

  const details = {
    method: req.method,
    path: req.path || req.originalUrl?.split("?")[0] || req.url?.split("?")[0],
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
