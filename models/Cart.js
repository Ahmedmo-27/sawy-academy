const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: String, trim: true },
    kind: {
      type: String,
      enum: ["product", "course", "diploma"],
      required: true,
      trim: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    category: { type: String, trim: true },
    image: { type: String, trim: true },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Cart", cartSchema);
