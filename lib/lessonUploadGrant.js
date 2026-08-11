const User = require("../models/User");
const { createHttpError } = require("../controllers/controllerUtils");
const { signToken, verifyToken } = require("./auth/jwt");

const UPLOAD_GRANT_PURPOSE = "lesson-media-upload";
const UPLOAD_GRANT_TTL_SECONDS = 15 * 60;
const UPLOAD_GRANT_HEADER = "x-sawy-upload-grant";

function publicApiOrigin() {
  const configured = (
    process.env.API_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_API_ORIGIN ||
    ""
  ).trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") {
    return "http://127.0.0.1:5000";
  }
  return "";
}

function buildPublicApiUrl(apiPath) {
  const origin = publicApiOrigin();
  const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  return origin ? `${origin}${path}` : path;
}

function issueLessonUploadGrant({ userId, deviceId, slug, lessonId, kind }) {
  return signToken(
    {
      sub: String(userId),
      did: String(deviceId || ""),
      purpose: UPLOAD_GRANT_PURPOSE,
      slug: String(slug),
      lid: String(lessonId),
      kind,
    },
    UPLOAD_GRANT_TTL_SECONDS
  );
}

function createLessonUploadIntent(req, kind) {
  const slug = String(req.params.slug);
  const lessonId = String(req.params.lessonId);
  const token = issueLessonUploadGrant({
    userId: req.auth.userId,
    deviceId: req.auth.deviceId,
    slug,
    lessonId,
    kind,
  });
  const suffix = kind === "document" ? "document" : "video";
  return {
    token,
    expiresIn: UPLOAD_GRANT_TTL_SECONDS,
    uploadUrl: buildPublicApiUrl(
      `/api/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonId)}/${suffix}`
    ),
  };
}

async function authenticateLessonUploadGrant(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw createHttpError(401, "Upload grant required");
    }
    let payload;
    try {
      payload = verifyToken(header.slice("Bearer ".length).trim());
    } catch {
      throw createHttpError(401, "Upload grant is invalid or expired");
    }
    if (payload.purpose !== UPLOAD_GRANT_PURPOSE) {
      throw createHttpError(401, "Upload grant is invalid or expired");
    }
    if (
      payload.slug !== String(req.params.slug) ||
      payload.lid !== String(req.params.lessonId)
    ) {
      throw createHttpError(403, "Upload grant does not match this lesson");
    }

    const user = await User.findById(payload.sub).lean();
    if (!user || user.role !== "admin") {
      throw createHttpError(403, "Admin access required");
    }

    req.auth = {
      token: header.slice("Bearer ".length).trim(),
      user,
      userId: user._id,
      deviceId: payload.did,
      uploadGrant: true,
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

function isLessonUploadGrantRequest(req) {
  return String(req.headers[UPLOAD_GRANT_HEADER] || "") === "1";
}

module.exports = {
  UPLOAD_GRANT_HEADER,
  authenticateLessonUploadGrant,
  createLessonUploadIntent,
  isLessonUploadGrantRequest,
};
