function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;

  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message: err.message || "Internal server error",
      statusCode,
    },
  });
}

module.exports = errorHandler;
