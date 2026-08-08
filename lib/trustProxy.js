const net = require("net");

const NAMED_RANGES = new Set(["loopback", "linklocal", "uniquelocal"]);
const CIDR_PATTERN = /^([0-9a-f:.]+)\/(\d{1,3})$/i;

function parseTrustProxy(value) {
  const entries = String(value || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (entries.length === 0) return false;

  for (const entry of entries) {
    if (NAMED_RANGES.has(entry) || net.isIP(entry)) continue;
    const cidr = entry.match(CIDR_PATTERN);
    if (!cidr || !net.isIP(cidr[1])) {
      throw new Error(
        "TRUST_PROXY must contain only explicit IPs, CIDRs, or loopback/linklocal/uniquelocal"
      );
    }
    const bits = Number(cidr[2]);
    const maxBits = net.isIP(cidr[1]) === 4 ? 32 : 128;
    if (bits < 0 || bits > maxBits) {
      throw new Error("TRUST_PROXY contains an invalid CIDR prefix");
    }
  }

  return entries;
}

module.exports = { parseTrustProxy };
