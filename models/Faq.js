const mongoose = require("mongoose");
const { toSlug } = require("../utils/slug");

const faqSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "" },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    id: false,
    versionKey: false,
  }
);

faqSchema.pre("validate", async function setFaqGeneratedFields(next) {
  try {
    if (!this.id && this.question) {
      this.id = toSlug(this.question).slice(0, 48);
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

module.exports = mongoose.model("Faq", faqSchema);
