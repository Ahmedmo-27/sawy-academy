const crypto = require("crypto");
const User = require("../models/User");
const { hashPassword, verifyPassword } = require("../lib/auth/password");
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

function issueStubToken(user) {
  // TODO: Replace with signed JWT or secure session cookie before production.
  const random = crypto.randomBytes(24).toString("base64url");
  return `dev.${user.role}.${random}`;
}

function authPayload(user) {
  return {
    token: issueStubToken(user),
    user: publicUser(user),
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

    return sendSuccess(res, authPayload(user));
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

    return sendCreated(res, authPayload(user));
  } catch (err) {
    if (err && err.code === 11000) {
      return next(createHttpError(409, "An account with this email already exists"));
    }
    return next(err);
  }
}

module.exports = { login, signup };
