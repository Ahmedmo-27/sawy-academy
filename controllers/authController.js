const User = require("../models/User");
const { hashPassword, verifyPassword } = require("../lib/auth/password");
const { signToken } = require("../lib/auth/jwt");
const {
  createSession,
  deleteSession,
  handleLoginDevice,
} = require("../lib/deviceAuth");
const {
  createHttpError,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");

const MIN_PASSWORD_LENGTH = 8;

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function issueSessionToken(user, deviceId) {
  return signToken({
    sub: user._id.toString(),
    did: deviceId,
  });
}

async function completeAuth(user, req) {
  const userAgent =
    req.headers["user-agent"] ||
    (req.body && req.body.userAgent) ||
    "";
  const clientDeviceId = req.body && req.body.deviceId;

  const { deviceId, generatedDeviceId } = await handleLoginDevice(
    user,
    clientDeviceId,
    userAgent
  );

  const token = issueSessionToken(user, deviceId);
  await createSession(token, user._id, deviceId);

  return {
    token,
    user: publicUser(user),
    deviceId: generatedDeviceId || undefined,
  };
}

async function login(req, res, next) {
  try {
    validateRequired(req.body, ["email", "password"]);

    const email = String(req.body.email).trim().toLowerCase();
    const password = String(req.body.password);
    const user = await User.findOne({ email });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw createHttpError(401, "Invalid credentials");
    }

    const payload = await completeAuth(user, req);
    return sendSuccess(res, payload);
  } catch (err) {
    return next(err);
  }
}

async function signup(req, res, next) {
  try {
    validateRequired(req.body, ["name", "email", "password"]);

    const name = String(req.body.name).trim();
    const email = String(req.body.email).trim().toLowerCase();
    const password = String(req.body.password);

    if (name.length < 2) {
      throw createHttpError(400, "Name must be at least 2 characters");
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw createHttpError(
        400,
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw createHttpError(409, "An account with this email already exists");
    }

    // Public signup always creates a student — admins are seeded separately.
    const user = await User.create({
      name,
      email,
      passwordHash: hashPassword(password),
      role: "student",
    });

    const payload = await completeAuth(user, req);
    return sendCreated(res, payload);
  } catch (err) {
    if (err && err.code === 11000) {
      return next(createHttpError(409, "An account with this email already exists"));
    }
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    return sendSuccess(res, {
      user: publicUser(req.auth.user),
      deviceId: req.auth.deviceId,
    });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (req.auth?.token) {
      await deleteSession(req.auth.token);
    }
    return sendSuccess(res, { ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, logout, me, signup };
