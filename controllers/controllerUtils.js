function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function sendCreated(res, data) {
  return sendSuccess(res, data, 201);
}

function validateRequired(body, fields) {
  const missingFields = fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === "";
  });

  if (missingFields.length > 0) {
    throw createHttpError(400, `Missing required fields: ${missingFields.join(", ")}`);
  }
}

function getPagination(query) {
  const limit = Math.max(Number(query.limit) || 20, 1);
  const page = Math.max(Number(query.page) || 1, 1);
  const skip =
    query.skip !== undefined
      ? Math.max(Number(query.skip) || 0, 0)
      : (page - 1) * limit;

  return { limit, page, skip };
}

function buildCategoryFilter(query) {
  if (!query.category || query.category === "All") {
    return {};
  }

  return { category: query.category };
}

module.exports = {
  buildCategoryFilter,
  createHttpError,
  getPagination,
  sendCreated,
  sendSuccess,
  validateRequired,
};
