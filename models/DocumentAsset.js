const mongoose = require("mongoose");

const documentAssetSchema = new mongoose.Schema(
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
      enum: ["ready", "superseded", "failed"],
      default: "ready",
      required: true,
      index: true,
    },
    objectKey: { type: String, required: true, trim: true, select: false },
    filename: { type: String, required: true, trim: true },
    contentType: { type: String, required: true, trim: true },
    sizeBytes: { type: Number, required: true, min: 1 },
  },
  {
    timestamps: true,
    id: false,
    versionKey: false,
  }
);

documentAssetSchema.index({ lessonId: 1, generation: 1 }, { unique: true });

module.exports = mongoose.model("DocumentAsset", documentAssetSchema);
