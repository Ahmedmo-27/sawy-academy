const mongoose = require("mongoose");

const courseGroupSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    type: { type: String, enum: ["diploma", "leveled"], required: true },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    bundlePrice: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("CourseGroup", courseGroupSchema);
