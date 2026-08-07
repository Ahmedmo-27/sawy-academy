const User = require("../models/User");
const {
  listUserDevices,
  removeDevice,
  resolveDeviceLimit,
} = require("../lib/deviceAuth");
const { createHttpError, sendSuccess } = require("./controllerUtils");

async function listMyDevices(req, res, next) {
  try {
    const user = await User.findById(req.auth.userId).lean();
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const devices = await listUserDevices(req.auth.userId);
    return sendSuccess(res, {
      devices,
      currentDeviceId: req.auth.deviceId,
      deviceLimit: resolveDeviceLimit(user),
    });
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
      deviceLimit: resolveDeviceLimit(user),
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
  removeUserDeviceAdmin,
};
