const mongoose = require("mongoose");

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL auto-deletion
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.PasswordResetToken ||
  mongoose.model("PasswordResetToken", passwordResetTokenSchema);
