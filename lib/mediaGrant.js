const crypto = require("crypto");

const DEFAULT_TTL_SECONDS = 90;
const MAX_TTL_SECONDS = 300;
const SAFE_ID = /^[a-fA-F0-9]{24}$/;
const SAFE_DEVICE = /^[^\u0000-\u001F\u007F]{1,200}$/u;
const SAFE_MEDIA_PATH =
  /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*[\\\0])(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.(?:ts|m4s|mp4|aac)$/i;

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function getMediaGrantSecret() {
  const secret = String(process.env.VIDEO_MEDIA_GRANT_SECRET || "");
  if (Buffer.byteLength(secret) < 32) {
    throw new Error("VIDEO_MEDIA_GRANT_SECRET must contain at least 32 bytes");
  }
  return secret;
}

function getMediaGrantTtlSeconds() {
  const configured = Number(process.env.VIDEO_MEDIA_GRANT_TTL_SECONDS);
  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_TTL_SECONDS;
  }
  return Math.min(Math.floor(configured), MAX_TTL_SECONDS);
}

function assertSafeId(value, name) {
  const normalized = String(value || "");
  if (!SAFE_ID.test(normalized)) throw new TypeError(`Invalid ${name}`);
  return normalized.toLowerCase();
}

function normalizeMediaPath(value) {
  const path = String(value || "");
  let decoded;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    throw new TypeError("Invalid media path encoding");
  }
  if (decoded !== path || !SAFE_MEDIA_PATH.test(path)) {
    throw new TypeError("Invalid media path");
  }
  return path;
}

function normalizeGrantClaims(claims) {
  const scope = claims.scope === "key" ? "key" : "media";
  const normalized = {
    v: 1,
    scope,
    uid: assertSafeId(claims.uid, "user id"),
    sid: assertSafeId(claims.sid, "session id"),
    did: String(claims.did || ""),
    cid: assertSafeId(claims.cid, "course id"),
    lid: assertSafeId(claims.lid, "lesson id"),
    aid: assertSafeId(claims.aid, "asset id"),
    gen: Number(claims.gen),
    exp: Number(claims.exp),
  };
  if (!SAFE_DEVICE.test(normalized.did)) {
    throw new TypeError("Invalid device id");
  }
  if (!Number.isSafeInteger(normalized.gen) || normalized.gen < 1) {
    throw new TypeError("Invalid asset generation");
  }
  if (!Number.isSafeInteger(normalized.exp) || normalized.exp < 1) {
    throw new TypeError("Invalid grant expiry");
  }
  if (scope === "media") normalized.path = normalizeMediaPath(claims.path);
  return normalized;
}

function signature(payload, secret) {
  return crypto.createHmac("sha256", secret).update(payload).digest();
}

function signMediaGrant(claims, options = {}) {
  const nowSeconds = Math.floor((options.nowMs ?? Date.now()) / 1000);
  const ttlSeconds = options.ttlSeconds ?? getMediaGrantTtlSeconds();
  if (
    !Number.isSafeInteger(ttlSeconds) ||
    ttlSeconds < 1 ||
    ttlSeconds > MAX_TTL_SECONDS
  ) {
    throw new TypeError("Invalid media grant TTL");
  }
  const normalized = normalizeGrantClaims({
    ...claims,
    exp: claims.exp ?? nowSeconds + ttlSeconds,
  });
  const payload = base64url(JSON.stringify(normalized));
  return `${payload}.${base64url(signature(payload, options.secret ?? getMediaGrantSecret()))}`;
}

function verifyMediaGrant(token, options = {}) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error("Invalid media grant");
  }
  const expected = signature(parts[0], options.secret ?? getMediaGrantSecret());
  let supplied;
  try {
    supplied = Buffer.from(parts[1], "base64url");
  } catch {
    throw new Error("Invalid media grant");
  }
  if (
    supplied.toString("base64url") !== parts[1] ||
    supplied.length !== expected.length ||
    !crypto.timingSafeEqual(supplied, expected)
  ) {
    throw new Error("Invalid media grant");
  }

  let claims;
  try {
    const payloadBytes = Buffer.from(parts[0], "base64url");
    if (payloadBytes.toString("base64url") !== parts[0]) {
      throw new Error("Invalid encoding");
    }
    claims = normalizeGrantClaims(
      JSON.parse(payloadBytes.toString("utf8"))
    );
  } catch {
    throw new Error("Invalid media grant");
  }
  const nowSeconds = Math.floor((options.nowMs ?? Date.now()) / 1000);
  if (claims.exp <= nowSeconds || claims.exp > nowSeconds + MAX_TTL_SECONDS) {
    throw new Error("Expired media grant");
  }
  return claims;
}

module.exports = {
  DEFAULT_TTL_SECONDS,
  MAX_TTL_SECONDS,
  getMediaGrantTtlSeconds,
  normalizeMediaPath,
  signMediaGrant,
  verifyMediaGrant,
};
