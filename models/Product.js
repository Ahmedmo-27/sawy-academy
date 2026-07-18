const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    id: false,
    versionKey: false,
  }
);

module.exports = mongoose.model("Product", productSchema);
