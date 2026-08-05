/**
 * Lightweight user-agent parsing without third-party libraries.
 * Derives a readable label such as "Chrome on Windows" or "Safari on iPhone".
 */

function matchFirst(patterns, userAgent) {
  for (const [regex, value] of patterns) {
    if (regex.test(userAgent)) return value;
  }
  return null;
}

function detectBrowser(userAgent) {
  return (
    matchFirst(
      [
        [/Edg\//, "Edge"],
        [/OPR\//, "Opera"],
        [/Chrome\//, "Chrome"],
        [/CriOS\//, "Chrome"],
        [/Firefox\//, "Firefox"],
        [/FxiOS\//, "Firefox"],
        [/Safari\//, "Safari"],
      ],
      userAgent
    ) || "Browser"
  );
}

function detectOs(userAgent) {
  if (/iPhone|iPad|iPod/.test(userAgent)) return "iPhone";
  if (/Android/.test(userAgent)) return "Android";
  if (/Windows NT/.test(userAgent)) return "Windows";
  if (/Mac OS X/.test(userAgent)) return "macOS";
  if (/CrOS/.test(userAgent)) return "ChromeOS";
  if (/Linux/.test(userAgent)) return "Linux";
  return "Unknown OS";
}

function detectDeviceType(userAgent) {
  if (/Mobile|Android|iPhone|iPod/.test(userAgent)) return "mobile";
  if (/iPad|Tablet/.test(userAgent)) return "tablet";
  return "desktop";
}

function buildDeviceLabel(userAgent) {
  const browser = detectBrowser(userAgent);
  const os = detectOs(userAgent);
  const deviceType = detectDeviceType(userAgent);

  if (deviceType === "mobile" && os === "iPhone") {
    return `${browser} on iPhone`;
  }

  if (deviceType === "mobile" && os === "Android") {
    return `${browser} on Android`;
  }

  if (deviceType === "tablet") {
    return `${browser} on Tablet`;
  }

  return `${browser} on ${os}`;
}

module.exports = {
  buildDeviceLabel,
  detectBrowser,
  detectDeviceType,
  detectOs,
};
