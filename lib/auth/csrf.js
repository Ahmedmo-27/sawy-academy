const crypto = require("crypto");
const {
  appendSetCookie,
  buildCookie,
  getCookie,
  isSecureCookie,
} = require("./sessionCookie");

const CSRF_COOKIE_NAME = "sawy_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TTL_SECONDS = 30 * 24 * 60 * 60;

function generateCsrfToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function setCsrfCookie(res, token = generateCsrfToken()) {
  appendSetCookie(
    res,
    buildCookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: isSecureCookie(),
      sameSite: "Lax",
      path: "/",
      maxAge: CSRF_TTL_SECONDS,
    })
  );
  return token;
}

function getCsrfTokenFromRequest(req) {
  return getCookie(req, CSRF_COOKIE_NAME);
}

function ensureCsrfCookie(req, res) {
  const existing = getCsrfTokenFromRequest(req);
  if (existing) return existing;
  return setCsrfCookie(res);
}

function tokensEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

function isValidCsrf(req) {
  const cookieToken = getCsrfTokenFromRequest(req);
  const headerToken = req.get(CSRF_HEADER_NAME);
  return tokensEqual(cookieToken, headerToken);
}

module.exports = {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  ensureCsrfCookie,
  getCsrfTokenFromRequest,
  isValidCsrf,
  setCsrfCookie,
};
