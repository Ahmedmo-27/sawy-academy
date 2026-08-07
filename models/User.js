const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "student"],
      default: "student",
      required: true,
    },
    avatarUrl: { type: String, trim: true },
    /** Max registered devices for students. Admins are not limited. */
    deviceLimit: {
      type: Number,
      default: 2,
      min: 1,
      max: 20,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("User", userSchema);
