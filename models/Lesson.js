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
    videoUrl: { type: String, trim: true },
  },
  {
    timestamps: true,
    id: false,
    versionKey: false,
  }
);

module.exports = mongoose.model("Lesson", lessonSchema);
