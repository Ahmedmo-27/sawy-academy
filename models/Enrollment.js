const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    completedLessonIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
