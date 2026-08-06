const crypto = require("crypto");

const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60;

function assertJwtSecretConfigured() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return secret;
}

function getSessionTtlSeconds() {
  const raw = Number(process.env.SESSION_TTL_SECONDS);
  if (Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  return DEFAULT_TTL_SECONDS;
}

function encodePart(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodePart(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function signToken(payload, ttlSeconds = getSessionTtlSeconds()) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };

  const encodedHeader = encodePart(header);
  const encodedPayload = encodePart(body);
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(data)
    .digest("base64url");

  return `${data}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid token");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(data)
    .digest("base64url");

  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (
    signatureBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(signatureBuf, expectedBuf)
  ) {
    throw new Error("Invalid token signature");
  }

  const header = decodePart(encodedHeader);
  if (header.alg !== "HS256") {
    throw new Error("Unsupported token algorithm");
  }

  const payload = decodePart(encodedPayload);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error("Token expired");
  }

  return payload;
}

module.exports = {
  assertJwtSecretConfigured,
  getSessionTtlSeconds,
  signToken,
  verifyToken,
};
