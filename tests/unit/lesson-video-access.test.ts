import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const CourseGroup = require("../../models/CourseGroup.js");
const Enrollment = require("../../models/Enrollment.js");
const {
  VIDEO_URL_EXPIRY_SECONDS,
  buildVideoObjectKey,
} = require("../../lib/videoAccess.js") as {
  VIDEO_URL_EXPIRY_SECONDS: number;
  buildVideoObjectKey: (
    courseId: string,
    lessonId: string,
    filename: string
  ) => string;
};
const {
  assertCourseAccess,
  isLevelLocked,
} = {
  ...require("../../lib/lessonVideoAccessPolicy.js"),
  ...require("../../lib/courseProgressRules.js"),
} as {
  assertCourseAccess: (
    auth: Record<string, unknown>,
    course: Record<string, unknown>
  ) => Promise<void>;
  isLevelLocked: (levelOrder: number, previousComplete: boolean) => boolean;
};
const {
  publicRenditions,
} = require("../../controllers/videoUploadController.js") as {
  publicRenditions: (
    renditions: Array<Record<string, unknown>>
  ) => Array<Record<string, unknown>>;
};
const {
  MAX_REQUESTS_PER_WINDOW,
  videoAccessRateLimit,
} = require("../../lib/videoAccessRateLimit.js") as {
  MAX_REQUESTS_PER_WINDOW: number;
  videoAccessRateLimit: (
    req: object,
    res: object,
    next: (error?: Error & { statusCode?: number }) => void
  ) => void;
};

describe("lesson video access helpers", () => {
  it("uses a four-hour signed URL window", () => {
    expect(VIDEO_URL_EXPIRY_SECONDS).toBe(14_400);
  });

  it("builds an organized, traversal-safe private object key", () => {
    const key = buildVideoObjectKey(
      "course/../../../one",
      "lesson two",
      "../../My recording.mp4"
    );

    expect(key).toMatch(
      /^videos\/course-one\/lesson-two\/\d+-[a-z0-9]+-My-recording\.mp4$/
    );
    expect(key).not.toContain("..");
  });

  it("shares the same prerequisite lock rule as course progress", () => {
    expect(isLevelLocked(1, false)).toBe(false);
    expect(isLevelLocked(2, false)).toBe(true);
    expect(isLevelLocked(2, true)).toBe(false);
  });

  it("rate-limits repeated signed URL generation per user", () => {
    const req = { auth: { userId: `rate-limit-test-${Date.now()}` } };
    const res = { set: vi.fn() };
    const next = vi.fn();

    for (let index = 0; index <= MAX_REQUESTS_PER_WINDOW; index += 1) {
      videoAccessRateLimit(req, res, next);
    }

    expect(next).toHaveBeenCalledTimes(MAX_REQUESTS_PER_WINDOW + 1);
    expect(next.mock.calls.at(-1)?.[0]).toMatchObject({
      statusCode: 429,
      code: "VIDEO_ACCESS_RATE_LIMITED",
    });
  });

  it("does not disclose internal R2 playlist keys in admin status renditions", () => {
    const result = publicRenditions([
      {
        name: "720p",
        width: 1280,
        height: 720,
        bandwidth: 3_200_000,
        playlistObjectKey:
          "video-assets/course/lesson/asset/hls/720p/index.m3u8",
      },
    ]);
    expect(result).toEqual([
      {
        name: "720p",
        width: 1280,
        height: 720,
        bandwidth: 3_200_000,
      },
    ]);
    expect(JSON.stringify(result)).not.toContain("video-assets/");
  });
});

describe("lesson video policy boundaries", () => {
  const course = {
    _id: "course-current",
    lessons: ["lesson-current"],
  };

  it("allows admins without enrollment lookup", async () => {
    const exists = vi.spyOn(Enrollment, "exists");
    await expect(
      assertCourseAccess(
        { user: { role: "admin" }, userId: "admin" },
        course
      )
    ).resolves.toBeUndefined();
    expect(exists).not.toHaveBeenCalled();
  });

  it("denies students without enrollment", async () => {
    vi.spyOn(Enrollment, "exists").mockResolvedValue(null);
    await expect(
      assertCourseAccess(
        { user: { role: "student" }, userId: "student" },
        course
      )
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "ENROLLMENT_REQUIRED",
    });
  });

  it("allows an enrolled course outside a leveled group", async () => {
    vi.spyOn(Enrollment, "exists").mockResolvedValue({ _id: "enrollment" });
    vi.spyOn(CourseGroup, "findOne").mockReturnValue({
      populate: vi.fn().mockResolvedValue(null),
    });
    await expect(
      assertCourseAccess(
        { user: { role: "student" }, userId: "student" },
        course
      )
    ).resolves.toBeUndefined();
  });

  it("denies a later level until every prior lesson is complete", async () => {
    vi.spyOn(Enrollment, "exists").mockResolvedValue({ _id: "enrollment" });
    vi.spyOn(CourseGroup, "findOne").mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        courses: [
          { _id: "course-prior", lessons: ["lesson-a", "lesson-b"] },
          course,
        ],
      }),
    });
    vi.spyOn(Enrollment, "findOne").mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        completedLessonIds: ["lesson-a"],
      }),
    });

    await expect(
      assertCourseAccess(
        { user: { role: "student" }, userId: "student" },
        course
      )
    ).rejects.toMatchObject({ statusCode: 403, code: "LEVEL_LOCKED" });
  });
});
