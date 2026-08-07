const mongoose = require("mongoose");
const User = require("../models/User");
const { hashPassword, verifyPassword } = require("../lib/auth/password");
const {
  createHttpError,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");

const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_USER_PASSWORD || "ChangeMe123!";
const MIN_PASSWORD_LENGTH = 8;

const DEFAULT_DEVICE_LIMIT = 2;

function resolveDeviceLimit(user) {
  const raw = Number(user?.deviceLimit);
  if (Number.isFinite(raw) && raw >= 1) {
    return Math.min(Math.floor(raw), 20);
  }
  return DEFAULT_DEVICE_LIMIT;
}

function publicAdminUser(user) {
  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || undefined,
    deviceLimit: resolveDeviceLimit(user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function publicStudentUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || undefined,
    deviceLimit: resolveDeviceLimit(user),
    createdAt: user.createdAt
      ? new Date(user.createdAt).toISOString()
      : undefined,
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

async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    return sendSuccess(res, publicStudentUser(user));
  } catch (err) {
    return next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    validateRequired(req.body, ["name", "email"]);

    const updates = {
      name: String(req.body.name).trim(),
      email: String(req.body.email).trim().toLowerCase(),
    };

    if (req.body.avatarUrl !== undefined) {
      const avatarUrl = String(req.body.avatarUrl || "").trim();
      updates.avatarUrl = avatarUrl || undefined;
    }

    if (updates.name.length < 2) {
      throw createHttpError(400, "Name must be at least 2 characters");
    }

    const updated = await User.findByIdAndUpdate(req.auth.userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      throw createHttpError(404, "User not found");
    }

    return sendSuccess(res, publicStudentUser(updated));
  } catch (err) {
    if (err && err.code === 11000) {
      return next(createHttpError(409, "An account with this email already exists"));
    }
    return next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    validateRequired(req.body, ["currentPassword", "newPassword"]);

    const currentPassword = String(req.body.currentPassword);
    const newPassword = String(req.body.newPassword);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw createHttpError(
        400,
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
    }

    const user = await User.findById(req.auth.userId);
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw createHttpError(400, "Current password is incorrect");
    }

    user.passwordHash = hashPassword(newPassword);
    await user.save();

    return sendSuccess(res, { ok: true });
  } catch (err) {
    return next(err);
  }
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

    let deviceLimit = DEFAULT_DEVICE_LIMIT;
    if (req.body.deviceLimit !== undefined && req.body.deviceLimit !== "") {
      deviceLimit = Number(req.body.deviceLimit);
      if (!Number.isFinite(deviceLimit) || deviceLimit < 1 || deviceLimit > 20) {
        throw createHttpError(400, "Device limit must be a number from 1 to 20");
      }
      deviceLimit = Math.floor(deviceLimit);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw createHttpError(409, "An account with this email already exists");
    }

    const user = await User.create({
      name,
      email,
      role,
      deviceLimit,
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

    if (req.body.deviceLimit !== undefined && req.body.deviceLimit !== "") {
      const deviceLimit = Number(req.body.deviceLimit);
      if (!Number.isFinite(deviceLimit) || deviceLimit < 1 || deviceLimit > 20) {
        throw createHttpError(400, "Device limit must be a number from 1 to 20");
      }
      updates.deviceLimit = Math.floor(deviceLimit);
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

module.exports = {
  changePassword,
  create,
  getAll,
  getById,
  getMe,
  remove,
  update,
  updateMe,
};
