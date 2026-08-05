function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;

  const errorBody = {
    message: err.message || "Internal server error",
    statusCode,
  };

  if (err.code) errorBody.code = err.code;
  if (err.devices) errorBody.devices = err.devices;

  return res.status(statusCode).json({
    success: false,
    data: null,
    error: errorBody,
  });
}

module.exports = errorHandler;
