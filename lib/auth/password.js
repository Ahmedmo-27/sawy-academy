const crypto = require("crypto");

const ITERATIONS = 310000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString("hex");

  return `pbkdf2:${ITERATIONS}:${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [scheme, iterationsRaw, salt, hash] = String(storedHash).split(":");

  if (scheme !== "pbkdf2" || !iterationsRaw || !salt || !hash) {
    return false;
  }

  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations < 1) {
    return false;
  }

  const candidate = crypto
    .pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST)
    .toString("hex");

  const candidateBuf = Buffer.from(candidate, "utf8");
  const hashBuf = Buffer.from(hash, "utf8");

  // timingSafeEqual throws if lengths differ — treat that as a failed match.
  if (candidateBuf.length !== hashBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidateBuf, hashBuf);
}

module.exports = { hashPassword, verifyPassword };
