const net = require("net");
const HlsKeyAccessLog = require("../models/HlsKeyAccessLog");
const VideoAccessFlag = require("../models/VideoAccessFlag");
const logger = require("../utils/logger");

const DEFAULT_THRESHOLD = 3;
const DEFAULT_WINDOW_MINUTES = 10;

function boundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, min), max)
    : fallback;
}

function anomalyConfig() {
  return {
    threshold: boundedInteger(
      process.env.VIDEO_ACCESS_DISTINCT_IP_THRESHOLD,
      DEFAULT_THRESHOLD,
      2,
      20
    ),
    windowMinutes: boundedInteger(
      process.env.VIDEO_ACCESS_DISTINCT_IP_WINDOW_MINUTES,
      DEFAULT_WINDOW_MINUTES,
      1,
      120
    ),
  };
}

function normalizeTrustedIp(value) {
  const candidate = String(value || "").trim();
  const unwrapped = candidate.startsWith("::ffff:")
    ? candidate.slice("::ffff:".length)
    : candidate;
  return net.isIP(unwrapped) ? unwrapped.toLowerCase() : "unknown";
}

function safeReason(value, fallback) {
  const normalized = String(value || fallback)
    .replace(/[^a-zA-Z0-9_.-]+/g, "_")
    .slice(0, 120);
  return normalized || fallback;
}

async function evaluateDistinctIpThreshold({
  logModel = HlsKeyAccessLog,
  flagModel = VideoAccessFlag,
  userId,
  deviceId,
  lessonId,
  assetId,
  now = new Date(),
  threshold,
  windowMinutes,
}) {
  const config = anomalyConfig();
  const effectiveThreshold = threshold ?? config.threshold;
  const effectiveWindow = windowMinutes ?? config.windowMinutes;
  const since = new Date(now.getTime() - effectiveWindow * 60 * 1000);
  const ips = await logModel.distinct("ip", {
    userId,
    outcome: "success",
    occurredAt: { $gte: since, $lte: now },
  });
  const distinctIps = ips.filter((ip) => ip && ip !== "unknown");

  if (distinctIps.length < effectiveThreshold) return null;

  const update = {
    $set: {
      deviceId,
      lessonId,
      distinctIpCount: distinctIps.length,
      threshold: effectiveThreshold,
      windowMinutes: effectiveWindow,
      lastDetectedAt: now,
      expiresAt:
        typeof flagModel.retentionExpiry === "function"
          ? flagModel.retentionExpiry(now)
          : new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
    },
    $setOnInsert: {
      userId,
      assetId,
      reasonCode: "distinct_ip_threshold",
      status: "open",
      notes: "",
      firstDetectedAt: now,
    },
  };

  const filter = { userId, assetId, reasonCode: "distinct_ip_threshold" };
  try {
    return await flagModel.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return flagModel.findOneAndUpdate(filter, update, { new: true });
  }
}

async function completeHlsKeyAudit(req, {
  outcome,
  reason,
  lessonId,
  assetId,
  detectAnomaly = false,
}) {
  const audit = req.hlsKeyAudit;
  if (!audit || audit.completed) return null;
  audit.completed = true;

  const occurredAt = new Date();
  const record = await HlsKeyAccessLog.create({
    userId: req.auth.userId,
    sessionId: req.auth.sessionId,
    deviceId: String(req.auth.deviceId || audit.deviceId || "unknown").slice(0, 200),
    lessonId: lessonId || audit.lessonId,
    assetId: assetId || audit.assetId,
    ip: normalizeTrustedIp(req.ip),
    userAgent: String(req.get("User-Agent") || "").slice(0, 1000),
    outcome,
    reason: safeReason(reason, outcome === "success" ? "key_delivered" : "request_denied"),
    occurredAt,
  });

  if (detectAnomaly && record.lessonId && record.assetId) {
    try {
      await evaluateDistinctIpThreshold({
        userId: record.userId,
        deviceId: record.deviceId,
        lessonId: record.lessonId,
        assetId: record.assetId,
        now: occurredAt,
      });
    } catch (error) {
      logger.error("Failed to evaluate video access anomaly", {
        error,
        accessLogId: record._id,
      });
    }
  }

  return record;
}

function beginHlsKeyAudit(req, res, next) {
  req.hlsKeyAudit = {
    completed: false,
    deviceId: req.auth?.deviceId,
    lessonId: /^[a-f0-9]{24}$/i.test(String(req.params?.lessonId || ""))
      ? req.params.lessonId
      : undefined,
  };

  res.once("finish", () => {
    if (req.hlsKeyAudit.completed) return;
    const outcome =
      res.statusCode < 400 ? "success" : res.statusCode < 500 ? "denied" : "error";
    void completeHlsKeyAudit(req, {
      outcome,
      reason: `http_${res.statusCode}`,
      detectAnomaly: outcome === "success",
    }).catch((error) => {
      logger.error("Failed to persist HLS key access audit", {
        error,
        statusCode: res.statusCode,
      });
    });
  });

  return next();
}

function setHlsKeyAuditContext(req, { lessonId, assetId }) {
  if (!req.hlsKeyAudit) return;
  req.hlsKeyAudit.lessonId = lessonId;
  req.hlsKeyAudit.assetId = assetId;
}

module.exports = {
  anomalyConfig,
  beginHlsKeyAudit,
  completeHlsKeyAudit,
  evaluateDistinctIpThreshold,
  normalizeTrustedIp,
  setHlsKeyAuditContext,
};
