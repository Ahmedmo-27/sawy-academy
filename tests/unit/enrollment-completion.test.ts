import { createRequire } from "node:module";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  indexProgressByEnrollments,
  isLevelCompleted,
  resolveLevelAccess,
  getPrerequisiteMessage,
  isLevelLocked,
} from "@/lib/courseProgress";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");
const Enrollment = require("../../models/Enrollment.js");
const Course = require("../../models/Course.js");
const Lesson = require("../../models/Lesson.js");
const enrollmentController = require("../../controllers/enrollmentController.js");

describe("Enrollment Lesson Completion & Dynamic Progress - Full Edge Cases", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("completeLesson Endpoint & Access Control", () => {
    const l1 = {
      _id: "650000000000000000000001",
      id: "lesson-1",
      title: "BioGeometry Foundations",
      slug: "biogeometry-foundations",
      order: 1,
      sheetRef: "L-01",
    };
    const l2 = {
      _id: "650000000000000000000002",
      id: "lesson-2",
      title: "Harmonic Grids",
      slug: "harmonic-grids",
      order: 2,
      sheetRef: "L-02",
    };
    const l3 = {
      _id: "650000000000000000000003",
      id: "lesson-3",
      title: "Field Resonances",
      slug: "field-resonances",
      order: 3,
      sheetRef: "L-03",
    };

    const mockCourse = {
      _id: "650000000000000000000101",
      id: "course-level-1",
      slug: "level-1",
      title: "Level 1: Fundamentals",
      lessons: [l1, l2, l3],
    };

    it("rejects unauthenticated requests with 401", async () => {
      const req = { params: { courseKey: "level-1", lessonKey: "lesson-1" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await enrollmentController.completeLesson(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: "Authentication required",
        })
      );
    });

    it("returns 404 if course is not found", async () => {
      vi.spyOn(Course, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      } as any);

      const req = {
        auth: { userId: "user-1", user: { role: "student" } },
        params: { courseKey: "missing-course", lessonKey: "lesson-1" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await enrollmentController.completeLesson(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Course not found",
        })
      );
    });

    it("returns 404 if lesson is not found in course or catalog", async () => {
      vi.spyOn(Course, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCourse),
      } as any);
      vi.spyOn(Lesson, "findOne").mockResolvedValue(null);

      const req = {
        auth: { userId: "user-1", user: { role: "student" } },
        params: { courseKey: "level-1", lessonKey: "unknown-lesson" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await enrollmentController.completeLesson(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Lesson not found",
        })
      );
    });

    it("rejects unenrolled student with 403 ENROLLMENT_REQUIRED", async () => {
      vi.spyOn(Course, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCourse),
      } as any);
      vi.spyOn(Enrollment, "findOne").mockResolvedValue(null);

      const req = {
        auth: { userId: "user-1", user: { role: "student" } },
        params: { courseKey: "level-1", lessonKey: "lesson-1" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await enrollmentController.completeLesson(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          code: "ENROLLMENT_REQUIRED",
        })
      );
    });

    it("allows admin to mark lesson complete without pre-existing enrollment", async () => {
      vi.spyOn(Course, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCourse),
      } as any);
      vi.spyOn(Enrollment, "findOne").mockResolvedValue(null);

      const createdDoc = {
        _id: "enr-admin-1",
        courseId: mockCourse,
        completedLessonIds: [l1._id],
        populate: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Enrollment, "create").mockResolvedValue(createdDoc as any);

      const req = {
        auth: { userId: "admin-user", user: { role: "admin" } },
        params: { courseKey: "level-1", lessonKey: "lesson-1" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await enrollmentController.completeLesson(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(Enrollment.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            enrollment: expect.objectContaining({
              completedLessons: 1,
              totalLessons: 3,
            }),
          }),
        })
      );
    });

    it("marks final lesson and updates course completion flag to true", async () => {
      vi.spyOn(Course, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCourse),
      } as any);
      vi.spyOn(Enrollment, "findOne").mockResolvedValue({
        _id: "enr-555",
        userId: "user-1",
        courseId: mockCourse._id,
        completedLessonIds: [l1._id, l2._id],
      });

      vi.spyOn(Enrollment, "findOneAndUpdate").mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: "enr-555",
          courseId: mockCourse,
          completedLessonIds: [l1._id, l2._id, l3._id],
        }),
      } as any);

      const req = {
        auth: { userId: "user-1", user: { role: "student" } },
        params: { courseKey: "level-1", lessonKey: "lesson-3" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await enrollmentController.completeLesson(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            enrollment: expect.objectContaining({
              completedLessons: 3,
              totalLessons: 3,
              completed: true,
              nextLessonSlug: null,
            }),
          }),
        })
      );
    });
  });

  describe("uncompleteLesson Endpoint & Rollback", () => {
    const l1 = {
      _id: "650000000000000000000001",
      id: "lesson-1",
      title: "Lesson 1",
      slug: "lesson-1",
      order: 1,
    };
    const mockCourse = {
      _id: "650000000000000000000101",
      slug: "level-1",
      lessons: [l1],
    };

    it("reverts course completed flag to false when lesson is uncompleted", async () => {
      vi.spyOn(Course, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCourse),
      } as any);
      vi.spyOn(Enrollment, "findOne").mockResolvedValue({
        _id: "enr-555",
        userId: "user-1",
        courseId: mockCourse._id,
        completedLessonIds: [l1._id],
      });

      vi.spyOn(Enrollment, "findOneAndUpdate").mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: "enr-555",
          courseId: mockCourse,
          completedLessonIds: [],
        }),
      } as any);

      const req = {
        auth: { userId: "user-1", user: { role: "student" } },
        params: { courseKey: "level-1", lessonKey: "lesson-1" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await enrollmentController.uncompleteLesson(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            enrollment: expect.objectContaining({
              completedLessons: 0,
              totalLessons: 1,
              completed: false,
              nextLessonSlug: "lesson-1",
            }),
          }),
        })
      );
    });
  });

  describe("getCourseEnrollment Query", () => {
    it("returns null data if student is not enrolled", async () => {
      const mockCourse = { _id: "course-1", slug: "c1", lessons: [] };
      vi.spyOn(Course, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCourse),
      } as any);
      vi.spyOn(Enrollment, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      } as any);

      const req = {
        auth: { userId: "user-1", user: { role: "student" } },
        params: { courseKey: "c1" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await enrollmentController.getCourseEnrollment(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null,
      });
    });
  });

  describe("Track Progression & Level Gate Rules", () => {
    const trackLevels = [
      { order: 1, courseId: "c-1", courseSlug: "level-1" },
      { order: 2, courseId: "c-2", courseSlug: "level-2" },
      { order: 3, courseId: "c-3", courseSlug: "level-3" },
      { order: 4, courseId: "c-4", courseSlug: "level-4" },
    ];

    it("calculates multi-level progressive unlocked states correctly", () => {
      const enrollments = [
        {
          id: "e1",
          courseId: "c-1",
          courseSlug: "level-1",
          courseTitle: "Level 1",
          completedLessons: 5,
          totalLessons: 5,
          completed: true,
        },
        {
          id: "e2",
          courseId: "c-2",
          courseSlug: "level-2",
          courseTitle: "Level 2",
          completedLessons: 2,
          totalLessons: 4,
          completed: false,
        },
      ];

      const progressByOrder = indexProgressByEnrollments(trackLevels, enrollments as any);

      // Level 1: Fully complete
      const l1Access = resolveLevelAccess({
        levelOrder: 1,
        isAuthenticated: true,
        previousLevelCompleted: true,
        current: progressByOrder.get(1),
      });
      expect(l1Access.state).toBe("unlocked_completed");
      expect(l1Access.locked).toBe(false);
      expect(l1Access.progress).toBe(1);

      // Level 2: In progress (unlocked because Level 1 is finished)
      const l2Access = resolveLevelAccess({
        levelOrder: 2,
        isAuthenticated: true,
        previousLevelCompleted: isLevelCompleted(progressByOrder, 1),
        current: progressByOrder.get(2),
      });
      expect(l2Access.state).toBe("unlocked_in_progress");
      expect(l2Access.locked).toBe(false);
      expect(l2Access.progress).toBe(0.5);

      // Level 3: Locked (Level 2 is not complete)
      const l3Access = resolveLevelAccess({
        levelOrder: 3,
        isAuthenticated: true,
        previousLevelCompleted: isLevelCompleted(progressByOrder, 2),
        current: progressByOrder.get(3),
      });
      expect(l3Access.state).toBe("locked");
      expect(l3Access.locked).toBe(true);
      expect(l3Access.message).toBe("Complete Level 2 first");

      // Level 4: Locked (Level 3 is not complete)
      const l4Access = resolveLevelAccess({
        levelOrder: 4,
        isAuthenticated: true,
        previousLevelCompleted: isLevelCompleted(progressByOrder, 3),
        current: progressByOrder.get(4),
      });
      expect(l4Access.state).toBe("locked");
      expect(l4Access.locked).toBe(true);
    });

    it("locks Level 2 for unauthenticated visitors with sign-in prompt", () => {
      const progressByOrder = indexProgressByEnrollments(trackLevels, []);

      // Guest on Level 1
      const l1Guest = resolveLevelAccess({
        levelOrder: 1,
        isAuthenticated: false,
        previousLevelCompleted: true,
        current: null,
      });
      expect(l1Guest.state).toBe("unlocked_not_started");
      expect(l1Guest.locked).toBe(false);

      // Guest on Level 2
      const l2Guest = resolveLevelAccess({
        levelOrder: 2,
        isAuthenticated: false,
        previousLevelCompleted: false,
        current: null,
      });
      expect(l2Guest.state).toBe("locked");
      expect(l2Guest.locked).toBe(true);
      expect(l2Guest.message).toBe("Sign in and complete Level 1 to unlock");
    });

    it("handles lock and prerequisite message helpers", () => {
      expect(isLevelLocked(1, false)).toBe(false);
      expect(isLevelLocked(2, false)).toBe(true);
      expect(isLevelLocked(2, true)).toBe(false);

      expect(getPrerequisiteMessage(1, true)).toBeUndefined();
      expect(getPrerequisiteMessage(3, true)).toBe("Complete Level 2 first");
      expect(getPrerequisiteMessage(3, false)).toBe("Sign in and complete Level 2 to unlock");
    });
  });
});
