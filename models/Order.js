const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: String, trim: true },
    kind: {
      type: String,
      enum: ["product", "course", "diploma"],
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, trim: true },
    userEmail: { type: String, trim: true, lowercase: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      required: true,
    },
    paymentScreenshotUrl: { type: String, required: true, trim: true },
    reason: { type: String, trim: true },
    items: {
      type: [orderItemSchema],
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "Order must include at least one item",
      },
    },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    id: false,
    versionKey: false,
  }
);

module.exports = mongoose.model("Order", orderSchema);
