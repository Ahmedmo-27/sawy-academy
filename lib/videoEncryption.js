const crypto = require("crypto");

const CONTENT_KEY_BYTES = 16;
const KEK_BYTES = 32;
const WRAP_IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function decodeExactBase64(value, name, expectedBytes) {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new TypeError(`Invalid ${name}`);
  }
  const decoded = Buffer.from(value, "base64");
  if (
    decoded.length !== expectedBytes ||
    decoded.toString("base64") !== value
  ) {
    throw new TypeError(`Invalid ${name}`);
  }
  return decoded;
}

function getVideoKeyKek() {
  const configured = String(process.env.VIDEO_KEY_KEK || "").trim();
  if (!configured) {
    throw new Error("VIDEO_KEY_KEK is required for video processing");
  }

  let kek;
  if (/^[a-fA-F0-9]{64}$/.test(configured)) {
    kek = Buffer.from(configured, "hex");
  } else {
    kek = Buffer.from(configured, "base64");
  }

  if (kek.length !== KEK_BYTES) {
    throw new Error(
      "VIDEO_KEY_KEK must be a 32-byte key encoded as base64 or 64 hex characters"
    );
  }
  return kek;
}

function wrapContentKey(contentKey, kek = getVideoKeyKek()) {
  if (!Buffer.isBuffer(contentKey) || contentKey.length !== CONTENT_KEY_BYTES) {
    throw new TypeError("The HLS content key must be a 16-byte Buffer");
  }
  if (!Buffer.isBuffer(kek) || kek.length !== KEK_BYTES) {
    throw new TypeError("The video KEK must be a 32-byte Buffer");
  }

  const wrapIv = crypto.randomBytes(WRAP_IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", kek, wrapIv);
  const wrappedKey = Buffer.concat([cipher.update(contentKey), cipher.final()]);

  return {
    algorithm: "AES-128",
    wrappedKey: wrappedKey.toString("base64"),
    wrapIv: wrapIv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    kekVersion: String(process.env.VIDEO_KEY_KEK_VERSION || "v1").trim(),
  };
}

function unwrapContentKey(encryption, kek = getVideoKeyKek()) {
  if (!encryption || encryption.algorithm !== "AES-128") {
    throw new TypeError("Invalid HLS key envelope algorithm");
  }
  if (!Buffer.isBuffer(kek) || kek.length !== KEK_BYTES) {
    throw new TypeError("The video KEK must be a 32-byte Buffer");
  }
  const wrapIv = decodeExactBase64(
    encryption.wrapIv,
    "HLS key envelope IV",
    WRAP_IV_BYTES
  );
  const authTag = decodeExactBase64(
    encryption.authTag,
    "HLS key envelope authentication tag",
    AUTH_TAG_BYTES
  );
  const wrappedKey = decodeExactBase64(
    encryption.wrappedKey,
    "wrapped HLS content key",
    CONTENT_KEY_BYTES
  );
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    kek,
    wrapIv
  );
  decipher.setAuthTag(authTag);
  const contentKey = Buffer.concat([
    decipher.update(wrappedKey),
    decipher.final(),
  ]);

  if (contentKey.length !== CONTENT_KEY_BYTES) {
    throw new Error("Unwrapped HLS content key has an invalid length");
  }
  return contentKey;
}

function generateWrappedContentKey() {
  const contentKey = crypto.randomBytes(CONTENT_KEY_BYTES);
  return {
    contentKey,
    encryption: wrapContentKey(contentKey),
  };
}

module.exports = {
  CONTENT_KEY_BYTES,
  generateWrappedContentKey,
  getVideoKeyKek,
  unwrapContentKey,
  wrapContentKey,
};
