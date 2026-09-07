const crypto = require("crypto");
const User = require("../models/User");
const Session = require("../models/Session");
const PasswordResetToken = require("../models/PasswordResetToken");
const { hashPassword, verifyPassword } = require("../lib/auth/password");
const { signToken } = require("../lib/auth/jwt");
const {
  clearSessionCookie,
  setSessionCookie,
} = require("../lib/auth/sessionCookie");
const {
  createSession,
  deleteSession,
  handleLoginDevice,
} = require("../lib/deviceAuth");
const mailer = require("../lib/email/mailer");
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

async function completeAuth(user, req, res) {
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
  setSessionCookie(res, token);

  return {
    // Token remains in the body for compatibility; the httpOnly cookie is authoritative.
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

    const payload = await completeAuth(user, req, res);
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

    const payload = await completeAuth(user, req, res);
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
    clearSessionCookie(res);
    return sendSuccess(res, { ok: true });
  } catch (err) {
    clearSessionCookie(res);
    return next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    validateRequired(req.body, ["email"]);
    const email = String(req.body.email).trim().toLowerCase();
    const user = await User.findOne({ email });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      await PasswordResetToken.deleteMany({ userId: user._id });
      await PasswordResetToken.create({
        userId: user._id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (req.headers.origin ? req.headers.origin : "http://localhost:3000");
      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

      mailer
        .sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
          expiresInMinutes: 60,
        })
        .catch(() => {});
    }

    // Always respond with a generic success to prevent email enumeration
    return sendSuccess(res, {
      message:
        "If an account with this email exists, a password reset link has been sent.",
    });
  } catch (err) {
    return next(err);
  }
}

async function verifyResetToken(req, res, next) {
  try {
    const { token } = req.params;
    if (!token) {
      throw createHttpError(400, "Reset token is required");
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(String(token).trim())
      .digest("hex");

    const resetDoc = await PasswordResetToken.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
      used: false,
    }).populate("userId", "email name");

    if (!resetDoc || !resetDoc.userId) {
      throw createHttpError(400, "Invalid or expired password reset link");
    }

    return sendSuccess(res, {
      valid: true,
      email: resetDoc.userId.email,
    });
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    validateRequired(req.body, ["token", "password"]);
    const token = String(req.body.token).trim();
    const password = String(req.body.password);

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw createHttpError(
        400,
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetDoc = await PasswordResetToken.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
      used: false,
    });

    if (!resetDoc) {
      throw createHttpError(400, "Invalid or expired password reset link");
    }

    const user = await User.findById(resetDoc.userId);
    if (!user) {
      throw createHttpError(404, "User account not found");
    }

    user.passwordHash = hashPassword(password);
    await user.save();

    await PasswordResetToken.deleteMany({ userId: user._id });
    await Session.deleteMany({ userId: user._id });

    return sendSuccess(res, {
      message:
        "Your password has been successfully reset. Please sign in with your new password.",
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  forgotPassword,
  login,
  logout,
  me,
  resetPassword,
  signup,
  verifyResetToken,
};
