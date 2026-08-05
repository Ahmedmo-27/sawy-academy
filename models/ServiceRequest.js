const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    type: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "in review", "accepted", "rejected"],
      default: "pending",
      required: true,
    },
    message: { type: String, trim: true },
    details: { type: String, trim: true },
    notes: { type: String, trim: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
