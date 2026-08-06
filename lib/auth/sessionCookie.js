const { getSessionTtlSeconds } = require("./jwt");

const SESSION_COOKIE_NAME = "sawy_session";

function isSecureCookie() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production";
}

function parseCookies(header) {
  if (!header || typeof header !== "string") return {};

  const cookies = {};
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }
  return cookies;
}

function getCookie(req, name) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[name] || null;
}

function buildCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  parts.push(`Path=${options.path || "/"}`);

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  }

  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);

  return parts.join("; ");
}

function appendSetCookie(res, cookie) {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", cookie);
    return;
  }
  const list = Array.isArray(existing) ? existing : [String(existing)];
  res.setHeader("Set-Cookie", [...list, cookie]);
}

function setSessionCookie(res, token) {
  const ttlSeconds = getSessionTtlSeconds();
  appendSetCookie(
    res,
    buildCookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "Lax",
      path: "/",
      maxAge: ttlSeconds,
    })
  );
}

function clearSessionCookie(res) {
  appendSetCookie(
    res,
    buildCookie(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "Lax",
      path: "/",
      maxAge: 0,
    })
  );
}

function getSessionTokenFromRequest(req) {
  return getCookie(req, SESSION_COOKIE_NAME);
}

module.exports = {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  getSessionTokenFromRequest,
  setSessionCookie,
};
