const mongoose = require("mongoose");

const renditionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    width: { type: Number, required: true, min: 2 },
    height: { type: Number, required: true, min: 2 },
    bandwidth: { type: Number, required: true, min: 1 },
    playlistObjectKey: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const videoAssetSchema = new mongoose.Schema(
  {
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    generation: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["uploading", "queued", "processing", "ready", "failed", "superseded"],
      default: "uploading",
      required: true,
      index: true,
    },
    source: {
      objectKey: { type: String, required: true, trim: true, select: false },
      filename: { type: String, required: true, trim: true },
      contentType: { type: String, required: true, trim: true },
      sizeBytes: { type: Number, required: true, min: 1 },
      etag: { type: String, trim: true, select: false },
    },
    outputPrefix: { type: String, required: true, trim: true, select: false },
    masterPlaylistObjectKey: { type: String, trim: true, select: false },
    encryption: {
      algorithm: {
        type: String,
        enum: ["AES-128"],
        default: "AES-128",
        required: true,
      },
      wrappedKey: { type: String, required: true, select: false },
      wrapIv: { type: String, required: true, select: false },
      authTag: { type: String, required: true, select: false },
      kekVersion: { type: String, default: "v1", trim: true, select: false },
    },
    media: {
      durationSeconds: { type: Number, min: 0 },
      sourceWidth: { type: Number, min: 1 },
      sourceHeight: { type: Number, min: 1 },
      videoCodec: { type: String, trim: true },
      audioCodec: { type: String, trim: true },
    },
    renditions: { type: [renditionSchema], default: [] },
    error: {
      code: { type: String, trim: true },
      message: { type: String, trim: true },
      at: { type: Date },
    },
    readyAt: { type: Date },
  },
  {
    timestamps: true,
    id: false,
    versionKey: false,
  }
);

videoAssetSchema.index({ lessonId: 1, generation: 1 }, { unique: true });
videoAssetSchema.index({ lessonId: 1, createdAt: -1 });

module.exports = mongoose.model("VideoAsset", videoAssetSchema);
