const User = require("../models/User");
const { verifyPassword } = require("../lib/auth/password");
const {
  listUserDevices,
  removeDevice,
} = require("../lib/deviceAuth");
const { createHttpError, sendSuccess } = require("./controllerUtils");

async function listMyDevices(req, res, next) {
  try {
    const devices = await listUserDevices(req.auth.userId);
    return sendSuccess(res, {
      devices,
      currentDeviceId: req.auth.deviceId,
    });
  } catch (err) {
    return next(err);
  }
}

async function removeMyDevice(req, res, next) {
  try {
    const { deviceId } = req.params;

    if (req.auth) {
      if (deviceId === req.auth.deviceId) {
        throw createHttpError(
          400,
          "You cannot remove the device you are currently using. Remove another device instead."
        );
      }

      const existing = await listUserDevices(req.auth.userId);
      const target = existing.find((device) => device.id === deviceId);
      if (!target) {
        throw createHttpError(404, "Device not found");
      }

      await removeDevice(req.auth.userId, deviceId);
      return sendSuccess(res, { ok: true, device: target });
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      throw createHttpError(
        401,
        "Sign in credentials are required to remove a device before login"
      );
    }

    const user = await User.findOne({
      email: String(email).trim().toLowerCase(),
    });
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      throw createHttpError(401, "Invalid credentials");
    }

    const devices = await listUserDevices(user._id);
    const target = devices.find((device) => device.id === deviceId);
    if (!target) {
      throw createHttpError(404, "Device not found");
    }

    await removeDevice(user._id, deviceId);
    return sendSuccess(res, { ok: true, device: target });
  } catch (err) {
    return next(err);
  }
}

async function listUserDevicesAdmin(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).lean();
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const devices = await listUserDevices(user._id);
    return sendSuccess(res, {
      userId: user._id.toString(),
      devices,
    });
  } catch (err) {
    return next(err);
  }
}

async function removeUserDeviceAdmin(req, res, next) {
  try {
    const { userId, deviceId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const devices = await listUserDevices(user._id);
    const target = devices.find((device) => device.id === deviceId);
    if (!target) {
      throw createHttpError(404, "Device not found");
    }

    await removeDevice(user._id, deviceId);
    return sendSuccess(res, { ok: true, device: target });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listMyDevices,
  listUserDevicesAdmin,
  removeMyDevice,
  removeUserDeviceAdmin,
};
