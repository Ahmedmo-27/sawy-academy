const mongoose = require("mongoose");
const { toSlug } = require("../utils/slug");

const researchSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Published", "Conference", "Ongoing", "Book"],
      required: true,
    },
    venue: { type: String, required: true, trim: true },
    abstract: { type: String, required: true, trim: true },
    collaborators: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
  },
  {
    timestamps: true,
    id: false,
    versionKey: false,
  }
);

researchSchema.pre("validate", function setResearchSlug(next) {
  if (!this.slug && this.title) {
    this.slug = toSlug(this.title);
  }

  next();
});

module.exports = mongoose.model("Research", researchSchema);
