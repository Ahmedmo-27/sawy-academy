const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    sheetRef: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    summary: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    // The private R2 key is never selected by default or serialized to clients.
    videoObjectKey: { type: String, trim: true, select: false },
    videoAvailable: { type: Boolean, default: false },
    videoOriginalFilename: { type: String, trim: true, select: false },
    videoAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoAsset",
      index: true,
    },
    videoGeneration: { type: Number, default: 0, min: 0, select: false },
    videoProcessingStatus: {
      type: String,
      enum: ["none", "queued", "processing", "ready", "failed"],
      default: "none",
    },
    videoProcessingError: { type: String, trim: true, select: false },
    videoProcessingUpdatedAt: { type: Date },
    // Legacy YouTube field retained temporarily for an explicit migration pass.
    videoUrl: { type: String, trim: true },
    previewImage: { type: String, trim: true },
    // Private lesson PDF (R2 docs/ prefix). Object key never selected by default.
    documentObjectKey: { type: String, trim: true, select: false },
    documentAvailable: { type: Boolean, default: false },
    documentOriginalFilename: { type: String, trim: true, select: false },
    documentAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DocumentAsset",
      index: true,
    },
    documentGeneration: { type: Number, default: 0, min: 0, select: false },
  },
  {
    timestamps: true,
    id: false,
    versionKey: false,
  }
);

module.exports = mongoose.model("Lesson", lessonSchema);
