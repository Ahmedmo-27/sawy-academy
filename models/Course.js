const mongoose = require("mongoose");
const { toSlug } = require("../utils/slug");

const courseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true },
    instructor: { type: String, required: true, trim: true },
    price: { type: String, required: true, trim: true },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
    relatedProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  {
    timestamps: true,
    id: false,
    versionKey: false,
  }
);

courseSchema.pre("validate", function setCourseSlug(next) {
  if (!this.slug && this.title) {
    this.slug = toSlug(this.title);
  }

  next();
});

module.exports = mongoose.model("Course", courseSchema);
