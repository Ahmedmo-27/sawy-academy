const mongoose = require("mongoose");

const DEFAULT_RETENTION_DAYS = 30;
const MAX_RETENTION_DAYS = 90;

function retentionDays() {
  const configured = Number.parseInt(
    process.env.VIDEO_ACCESS_LOG_RETENTION_DAYS || "",
    10
  );
  if (!Number.isFinite(configured)) return DEFAULT_RETENTION_DAYS;
  return Math.min(Math.max(configured, 1), MAX_RETENTION_DAYS);
}

const hlsKeyAccessLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },
    deviceId: { type: String, required: true, trim: true, maxlength: 200 },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      index: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoAsset",
      index: true,
    },
    ip: { type: String, required: true, trim: true, maxlength: 64 },
    userAgent: { type: String, default: "", maxlength: 1000 },
    outcome: {
      type: String,
      enum: ["success", "denied", "error"],
      required: true,
      index: true,
    },
    reason: { type: String, required: true, trim: true, maxlength: 120 },
    occurredAt: { type: Date, required: true, default: Date.now, index: true },
    expiresAt: {
      type: Date,
      required: true,
      default: () =>
        new Date(Date.now() + retentionDays() * 24 * 60 * 60 * 1000),
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    versionKey: false,
  }
);

hlsKeyAccessLogSchema.index({ userId: 1, occurredAt: -1 });
hlsKeyAccessLogSchema.index({ userId: 1, assetId: 1, occurredAt: -1 });
hlsKeyAccessLogSchema.index({
  userId: 1,
  deviceId: 1,
  outcome: 1,
  occurredAt: -1,
});

module.exports = mongoose.model("HlsKeyAccessLog", hlsKeyAccessLogSchema);
