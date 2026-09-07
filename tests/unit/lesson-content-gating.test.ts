import { createRequire } from "node:module";
import { describe, it, expect, vi, beforeEach } from "vitest";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");
const Course = require("../../models/Course.js");
const accessPolicy = require("../../lib/lessonVideoAccessPolicy.js");
const courseController = require("../../controllers/courseController.js");

function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("Lesson Content Gating on Course Endpoints", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("strips full lesson content when user is not enrolled in a paid course", async () => {
    const courseId = new mongoose.Types.ObjectId().toString();
    const mockCourseDoc = {
      _id: courseId,
      title: "Biogeometry I",
      slug: "biogeometry-1",
      price: "EGP 3500",
      lessons: [
        {
          _id: new mongoose.Types.ObjectId().toString(),
          title: "Introduction",
          summary: "Overview of drawing systems",
          content: "Confidential architectural formulas and complete step-by-step notes...",
        },
      ],
      toObject: function () {
        return JSON.parse(JSON.stringify(this));
      },
    };

    vi.spyOn(Course, "findOne").mockReturnValue({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCourseDoc),
      }),
    } as any);

    vi.spyOn(accessPolicy, "assertCourseAccess").mockRejectedValue(
      new Error("Enrollment required")
    );

    const req: any = {
      params: { slug: "biogeometry-1" },
      auth: { userId: "student-1", user: { role: "student" } },
    };
    const res = createMockRes();
    const next = vi.fn();

    await courseController.getBySlug(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const sentData = res.json.mock.calls[0][0].data;
    expect(sentData.lessons[0].summary).toBe("Overview of drawing systems");
    expect(sentData.lessons[0].content).toBe(""); // Gated!
    expect(sentData.lessons[0].isGated).toBe(true);
  });

  it("leaves full lesson content intact when user is enrolled or admin", async () => {
    const courseId = new mongoose.Types.ObjectId().toString();
    const mockCourseDoc = {
      _id: courseId,
      title: "Biogeometry I",
      slug: "biogeometry-1",
      price: "EGP 3500",
      lessons: [
        {
          _id: new mongoose.Types.ObjectId().toString(),
          title: "Introduction",
          summary: "Overview of drawing systems",
          content: "Confidential architectural formulas and complete step-by-step notes...",
        },
      ],
      toObject: function () {
        return JSON.parse(JSON.stringify(this));
      },
    };

    vi.spyOn(Course, "findOne").mockReturnValue({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCourseDoc),
      }),
    } as any);

    vi.spyOn(accessPolicy, "assertCourseAccess").mockResolvedValue(undefined);

    const req: any = {
      params: { slug: "biogeometry-1" },
      auth: { userId: "student-1", user: { role: "student" } },
    };
    const res = createMockRes();
    const next = vi.fn();

    await courseController.getBySlug(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const sentData = res.json.mock.calls[0][0].data;
    expect(sentData.lessons[0].content).toBe(
      "Confidential architectural formulas and complete step-by-step notes..."
    );
  });
});
