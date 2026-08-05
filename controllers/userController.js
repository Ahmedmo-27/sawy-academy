const mongoose = require("mongoose");
const User = require("../models/User");
const { hashPassword } = require("../lib/auth/password");
const {
  createHttpError,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");

const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_USER_PASSWORD || "ChangeMe123!";
const MIN_PASSWORD_LENGTH = 8;

function publicAdminUser(user) {
  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function findUserByParam(idParam) {
  const value = String(idParam).trim();

  if (mongoose.Types.ObjectId.isValid(value)) {
    const byObjectId = await User.findById(value);
    if (byObjectId) return byObjectId;
  }

  return User.findOne({ email: value.toLowerCase() });
}

async function getAll(req, res, next) {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    return sendSuccess(
      res,
      users.map((user) => publicAdminUser(user))
    );
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const user = await findUserByParam(req.params.id);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    return sendSuccess(res, publicAdminUser(user));
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    validateRequired(req.body, ["name", "email"]);

    const name = String(req.body.name).trim();
    const email = String(req.body.email).trim().toLowerCase();
    const role = req.body.role === "admin" ? "admin" : "student";
    const password = req.body.password
      ? String(req.body.password)
      : DEFAULT_PASSWORD;

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

    const user = await User.create({
      name,
      email,
      role,
      passwordHash: hashPassword(password),
    });

    return sendCreated(res, publicAdminUser(user));
  } catch (err) {
    if (err && err.code === 11000) {
      return next(createHttpError(409, "An account with this email already exists"));
    }
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const user = await findUserByParam(req.params.id);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const updates = {};

    if (req.body.name !== undefined) {
      updates.name = String(req.body.name).trim();
    }

    if (req.body.email !== undefined) {
      updates.email = String(req.body.email).trim().toLowerCase();
    }

    if (req.body.role !== undefined) {
      updates.role = req.body.role === "admin" ? "admin" : "student";
    }

    if (req.body.password) {
      const password = String(req.body.password);
      if (password.length < MIN_PASSWORD_LENGTH) {
        throw createHttpError(
          400,
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
        );
      }
      updates.passwordHash = hashPassword(password);
    }

    const updated = await User.findByIdAndUpdate(user._id, updates, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, publicAdminUser(updated));
  } catch (err) {
    if (err && err.code === 11000) {
      return next(createHttpError(409, "An account with this email already exists"));
    }
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const user = await findUserByParam(req.params.id);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    if (req.auth.userId.toString() === user._id.toString()) {
      throw createHttpError(400, "You cannot delete your own account");
    }

    await User.findByIdAndDelete(user._id);
    return sendSuccess(res, publicAdminUser(user));
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, getAll, getById, remove, update };
