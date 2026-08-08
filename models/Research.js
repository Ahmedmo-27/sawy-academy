const mongoose = require("mongoose");
const { toSlug } = require("../utils/slug");

function normalizeStringList(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

function normalizeDoi(value) {
  if (!value) return undefined;
  return String(value)
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "");
}

function isHttpUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

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
    authors: { type: [{ type: String, trim: true }], set: normalizeStringList },
    publicationDate: { type: Date },
    doi: { type: String, trim: true, set: normalizeDoi },
    citation: { type: String, trim: true },
    pdfUrl: {
      type: String,
      trim: true,
      validate: { validator: isHttpUrl, message: "PDF URL must use HTTP or HTTPS" },
    },
    externalUrl: {
      type: String,
      trim: true,
      validate: {
        validator: isHttpUrl,
        message: "External URL must use HTTP or HTTPS",
      },
    },
    keywords: { type: [{ type: String, trim: true }], set: normalizeStringList },
    image: { type: String, trim: true },
    figures: [{ type: String, trim: true }],
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
