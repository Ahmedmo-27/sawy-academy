const mongoose = require("mongoose");

const DEFAULT_RETENTION_DAYS = 180;
const MAX_RETENTION_DAYS = 365;

function retentionDays() {
  const configured = Number.parseInt(
    process.env.VIDEO_ACCESS_FLAG_RETENTION_DAYS || "",
    10
  );
  if (!Number.isFinite(configured)) return DEFAULT_RETENTION_DAYS;
  return Math.min(Math.max(configured, 7), MAX_RETENTION_DAYS);
}

const videoAccessFlagSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceId: { type: String, required: true, trim: true, maxlength: 200 },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoAsset",
      required: true,
      index: true,
    },
    reasonCode: {
      type: String,
      enum: ["distinct_ip_threshold"],
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in_review", "resolved", "dismissed"],
      default: "open",
      required: true,
      index: true,
    },
    notes: { type: String, default: "", maxlength: 5000 },
    distinctIpCount: { type: Number, required: true, min: 1 },
    threshold: { type: Number, required: true, min: 1 },
    windowMinutes: { type: Number, required: true, min: 1 },
    firstDetectedAt: { type: Date, required: true, default: Date.now },
    lastDetectedAt: { type: Date, required: true, default: Date.now, index: true },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    expiresAt: {
      type: Date,
      required: true,
      default: () =>
        new Date(Date.now() + retentionDays() * 24 * 60 * 60 * 1000),
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

videoAccessFlagSchema.index(
  { userId: 1, assetId: 1, reasonCode: 1 },
  { unique: true }
);
videoAccessFlagSchema.index({ status: 1, lastDetectedAt: -1 });
videoAccessFlagSchema.index({ userId: 1, lastDetectedAt: -1 });

videoAccessFlagSchema.statics.retentionExpiry = function retentionExpiry(now) {
  return new Date(now.getTime() + retentionDays() * 24 * 60 * 60 * 1000);
};

module.exports = mongoose.model("VideoAccessFlag", videoAccessFlagSchema);
