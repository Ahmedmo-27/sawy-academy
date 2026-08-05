const crypto = require("crypto");
const Device = require("../models/Device");
const Session = require("../models/Session");
const { getSessionTtlSeconds } = require("./auth/jwt");
const { buildDeviceLabel } = require("./userAgent");
const { createHttpError } = require("../controllers/controllerUtils");

const DEVICE_LIMIT = 2;

function generateDeviceId() {
  return crypto.randomUUID();
}

function normalizeDeviceId(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function publicDevice(device) {
  return {
    id: device.deviceId,
    label: device.label,
    lastActiveAt: device.lastActiveAt,
    createdAt: device.createdAt,
  };
}

async function listUserDevices(userId) {
  const devices = await Device.find({ userId })
    .sort({ lastActiveAt: -1 })
    .lean();
  return devices.map(publicDevice);
}

async function touchDevice(userId, deviceId) {
  await Device.updateOne(
    { userId, deviceId },
    { $set: { lastActiveAt: new Date() } }
  );
}

async function registerDevice(userId, deviceId, userAgent) {
  const label = buildDeviceLabel(userAgent || "");
  const device = await Device.create({
    userId,
    deviceId,
    label,
    userAgent: userAgent || "",
    lastActiveAt: new Date(),
  });
  return device;
}

async function createSession(token, userId, deviceId) {
  const ttlMs = getSessionTtlSeconds() * 1000;
  const now = new Date();

  await Session.deleteMany({ userId, deviceId });

  await Session.create({
    token,
    userId,
    deviceId,
    lastActiveAt: now,
    expiresAt: new Date(now.getTime() + ttlMs),
  });
}

async function deleteSession(token) {
  await Session.deleteOne({ token });
}

async function removeDevice(userId, deviceId) {
  await Device.deleteOne({ userId, deviceId });
  await Session.deleteMany({ userId, deviceId });
}

async function verifyDeviceRegistered(userId, deviceId) {
  const device = await Device.findOne({ userId, deviceId }).lean();
  if (!device) {
    throw createHttpError(
      401,
      "This device is no longer registered. Sign in again.",
      { code: "DEVICE_REMOVED" }
    );
  }
  return device;
}

/**
 * Device gate for student login/signup.
 * Admins bypass the two-device limit but still register devices when possible.
 */
async function handleLoginDevice(user, clientDeviceId, userAgent) {
  let deviceId = normalizeDeviceId(clientDeviceId);
  let generatedDeviceId = null;

  if (!deviceId) {
    deviceId = generateDeviceId();
    generatedDeviceId = deviceId;
  }

  const existing = await Device.findOne({
    userId: user._id,
    deviceId,
  });

  if (existing) {
    await touchDevice(user._id, deviceId);
    existing.userAgent = userAgent || existing.userAgent;
    existing.label = buildDeviceLabel(existing.userAgent);
    await existing.save();
    return { deviceId, generatedDeviceId };
  }

  if (user.role === "student") {
    const deviceCount = await Device.countDocuments({ userId: user._id });
    if (deviceCount >= DEVICE_LIMIT) {
      const devices = await listUserDevices(user._id);
      throw createHttpError(403, "Device limit reached.", {
        code: "DEVICE_LIMIT_REACHED",
        devices,
      });
    }
  }

  await registerDevice(user._id, deviceId, userAgent);
  return { deviceId, generatedDeviceId };
}

module.exports = {
  DEVICE_LIMIT,
  createSession,
  deleteSession,
  generateDeviceId,
  handleLoginDevice,
  listUserDevices,
  publicDevice,
  removeDevice,
  touchDevice,
  verifyDeviceRegistered,
};
