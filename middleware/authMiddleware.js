const User = require("../models/User");
const Session = require("../models/Session");
const Device = require("../models/Device");
const { verifyToken } = require("../lib/auth/jwt");
const { getSessionTokenFromRequest } = require("../lib/auth/sessionCookie");
const { createHttpError } = require("../controllers/controllerUtils");
const {
  touchDevice,
  verifyDeviceRegistered,
} = require("../lib/deviceAuth");

function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

function extractSessionToken(req) {
  return extractBearerToken(req) || getSessionTokenFromRequest(req);
}

function extractDeviceId(req) {
  const headerId = req.headers["x-device-id"];
  if (headerId) return String(headerId).trim();
  if (req.body && req.body.deviceId) return String(req.body.deviceId).trim();
  return "";
}

async function resolveRemovedDeviceError(payload) {
  if (!payload?.sub || !payload?.did) return null;

  const device = await Device.findOne({
    userId: payload.sub,
    deviceId: payload.did,
  })
    .lean()
    .catch(() => null);

  if (!device) {
    return createHttpError(
      401,
      "This device is no longer registered. Sign in again.",
      { code: "DEVICE_REMOVED" }
    );
  }

  return null;
}

async function resolveSessionFromToken(token) {
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw createHttpError(401, "Invalid or expired session", {
      code: "SESSION_REVOKED",
    });
  }

  const session = await Session.findOne({ token }).lean();
  if (!session) {
    const deviceError = await resolveRemovedDeviceError(payload);
    if (deviceError) throw deviceError;

    throw createHttpError(401, "Invalid or expired session", {
      code: "SESSION_REVOKED",
    });
  }

  if (payload.sub !== session.userId.toString()) {
    throw createHttpError(401, "Invalid or expired session", {
      code: "SESSION_REVOKED",
    });
  }

  const user = await User.findById(session.userId).lean();
  if (!user) {
    throw createHttpError(401, "Invalid or expired session", {
      code: "SESSION_REVOKED",
    });
  }

  return { session, user, payload };
}

async function authenticate(req, res, next) {
  try {
    const token = extractSessionToken(req);
    if (!token) {
      throw createHttpError(401, "Authentication required");
    }

    const { session, user } = await resolveSessionFromToken(token);

    req.auth = {
      token,
      user,
      userId: user._id,
      deviceId: session.deviceId,
    };

    await Session.updateOne(
      { token },
      { $set: { lastActiveAt: new Date() } }
    );

    return next();
  } catch (err) {
    return next(err);
  }
}

async function requireDevice(req, res, next) {
  try {
    if (!req.auth) {
      throw createHttpError(401, "Authentication required");
    }

    const requestDeviceId = extractDeviceId(req) || req.auth.deviceId;
    if (!requestDeviceId) {
      throw createHttpError(400, "Device identifier required");
    }

    await verifyDeviceRegistered(req.auth.userId, requestDeviceId);
    await touchDevice(req.auth.userId, requestDeviceId);

    req.auth.deviceId = requestDeviceId;
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireAdmin(req, res, next) {
  if (!req.auth || req.auth.user.role !== "admin") {
    return next(createHttpError(403, "Admin access required"));
  }
  return next();
}

/**
 * Optional auth — attaches req.auth when a valid token is present.
 */
async function optionalAuthenticate(req, res, next) {
  const token = extractSessionToken(req);
  if (!token) return next();

  try {
    const { session, user } = await resolveSessionFromToken(token);
    req.auth = {
      token,
      user,
      userId: user._id,
      deviceId: session.deviceId,
    };
  } catch {
    // Ignore optional auth failures.
  }

  return next();
}

module.exports = {
  authenticate,
  extractDeviceId,
  optionalAuthenticate,
  requireAdmin,
  requireDevice,
};
