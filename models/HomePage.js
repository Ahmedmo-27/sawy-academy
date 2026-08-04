const mongoose = require("mongoose");

const SECTION_TYPES = [
  "hero",
  "philosophy",
  "portfolio",
  "courses",
  "products",
  "research",
  "contact",
  "custom",
];

const homeSectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    type: { type: String, enum: SECTION_TYPES, required: true },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const homePageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "home" },
    sections: { type: [homeSectionSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("HomePage", homePageSchema);
module.exports.SECTION_TYPES = SECTION_TYPES;
