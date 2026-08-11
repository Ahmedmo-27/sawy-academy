const { createHttpError } = require("../controllers/controllerUtils");
const { isValidCsrf } = require("../lib/auth/csrf");
const { isLessonUploadGrantRequest } = require("../lib/lessonUploadGrant");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function requireCsrf(req, res, next) {
  const method = String(req.method || "GET").toUpperCase();
  if (SAFE_METHODS.has(method) || isLessonUploadGrantRequest(req)) {
    return next();
  }

  if (!isValidCsrf(req)) {
    return next(
      createHttpError(403, "Invalid CSRF token", { code: "CSRF_INVALID" })
    );
  }

  return next();
}

module.exports = requireCsrf;
