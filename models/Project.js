const mongoose = require("mongoose");
const { toSlug } = require("../utils/slug");
const { formatSheetRef } = require("../utils/sheet");

const projectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    sheetRef: { type: String, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Buildings", "Interiors", "Furniture", "Competitions"],
      required: true,
    },
    year: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    aspect: { type: String, enum: ["tall", "wide", "square"] },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    id: false,
    versionKey: false,
  }
);

projectSchema.pre("validate", async function setProjectGeneratedFields(next) {
  try {
    if (!this.slug && this.title) {
      this.slug = toSlug(this.title);
    }

    if (!this.sheetRef && this.isNew) {
      const projects = await this.constructor.find({}, { sheetRef: 1 }).lean();
      const maxIndex = projects.reduce((max, project) => {
        const match = /^A-(\d+)$/.exec(project.sheetRef || "");
        return match ? Math.max(max, Number(match[1]) - 1) : max;
      }, -1);

      this.sheetRef = formatSheetRef(maxIndex + 1);
    }

    if (this.isNew && (this.order === undefined || this.order === null)) {
      const last = await this.constructor
        .findOne()
        .sort({ order: -1 })
        .select("order")
        .lean();
      this.order = (last?.order ?? 0) + 1;
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Project", projectSchema);
