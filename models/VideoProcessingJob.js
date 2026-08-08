const mongoose = require("mongoose");

const videoProcessingJobSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoAsset",
      required: true,
      unique: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "retry_wait", "completed", "failed"],
      default: "queued",
      required: true,
      index: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 5, min: 1 },
    availableAt: { type: Date, default: Date.now, index: true },
    lease: {
      ownerId: { type: String, trim: true },
      expiresAt: { type: Date },
      heartbeatAt: { type: Date },
    },
    error: {
      code: { type: String, trim: true },
      message: { type: String, trim: true },
      at: { type: Date },
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    id: false,
    versionKey: false,
  }
);

videoProcessingJobSchema.index({ status: 1, availableAt: 1, createdAt: 1 });
videoProcessingJobSchema.index({ status: 1, "lease.expiresAt": 1 });

module.exports = mongoose.model(
  "VideoProcessingJob",
  videoProcessingJobSchema
);
