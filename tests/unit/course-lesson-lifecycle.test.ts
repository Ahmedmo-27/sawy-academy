import { createRequire } from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");
const Course = require("../../models/Course.js");
const CourseGroup = require("../../models/CourseGroup.js");
const Lesson = require("../../models/Lesson.js");
const VideoAsset = require("../../models/VideoAsset.js");
const VideoProcessingJob = require("../../models/VideoProcessingJob.js");
const DocumentAsset = require("../../models/DocumentAsset.js");
const courseController = require("../../controllers/courseController.js");
const lessonController = require("../../controllers/lessonController.js");
const videoUploadController = require("../../controllers/videoUploadController.js");
const videoR2Storage = require("../../lib/videoR2Storage.js");

function mockLessonModel(lessonDoc: Record<string, any> | null) {
  vi.spyOn(Lesson, "findById").mockImplementation(() => {
    const promise = Promise.resolve(lessonDoc);
    (promise as any).select = vi.fn().mockResolvedValue(lessonDoc);
    return promise as any;
  });
  vi.spyOn(Lesson, "findOne").mockImplementation(() => {
    const promise = Promise.resolve(lessonDoc);
    (promise as any).select = vi.fn().mockResolvedValue(lessonDoc);
    return promise as any;
  });
}

describe("Course & Lesson Lifecycle and Cascade Cleanups", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("courseController.remove Cascade", () => {
    it("returns 404 when course does not exist", async () => {
      vi.spyOn(Course, "findOne").mockResolvedValueOnce(null);

      const req = { params: { slug: "non-existent-course" } };
      const res = {};
      const next = vi.fn();

      await courseController.remove(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Course not found",
        })
      );
    });

    it("handles course with 0 lessons cleanly", async () => {
      const courseId = new mongoose.Types.ObjectId();
      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "empty-course",
        lessons: [],
      });

      const pullGroupSpy = vi.spyOn(CourseGroup, "updateMany").mockResolvedValueOnce({ acknowledged: true });
      const deleteCourseSpy = vi.spyOn(Course, "findByIdAndDelete").mockResolvedValueOnce({ _id: courseId });
      const deletePrefixSpy = vi.spyOn(videoR2Storage, "deletePrefix").mockResolvedValue(undefined);

      const req = { params: { slug: "empty-course" } };
      let resultData: Record<string, unknown> | null = null;
      const res = {
        status: () => res,
        json: (body: { success: boolean; data: Record<string, unknown> }) => {
          resultData = body.data;
          return res;
        },
      };
      const next = vi.fn();

      await courseController.remove(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(pullGroupSpy).toHaveBeenCalledWith(
        { courses: courseId },
        { $pull: { courses: courseId } }
      );
      expect(deleteCourseSpy).toHaveBeenCalledWith(courseId);

      // Background promise flush
      await new Promise((r) => setTimeout(r, 10));
      expect(deletePrefixSpy).toHaveBeenCalledWith(`video-assets/${courseId}/`);
      expect(deletePrefixSpy).toHaveBeenCalledWith(`docs/${courseId}/`);
    });

    it("cascades across all child lessons, video assets, processing jobs, and doc assets", async () => {
      const courseId = new mongoose.Types.ObjectId();
      const lesson1Id = new mongoose.Types.ObjectId();
      const lesson2Id = new mongoose.Types.ObjectId();
      const videoAsset1Id = new mongoose.Types.ObjectId();
      const videoAsset2Id = new mongoose.Types.ObjectId();

      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "full-course",
        lessons: [lesson1Id, lesson2Id],
      });

      const pullGroupSpy = vi.spyOn(CourseGroup, "updateMany").mockResolvedValueOnce({ acknowledged: true });

      const videoAssetSelectMock = vi.fn().mockResolvedValueOnce([
        { _id: videoAsset1Id },
        { _id: videoAsset2Id },
      ]);
      vi.spyOn(VideoAsset, "find").mockReturnValueOnce({ select: videoAssetSelectMock });

      const deleteJobsSpy = vi.spyOn(VideoProcessingJob, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const deleteAssetsSpy = vi.spyOn(VideoAsset, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const deleteDocsSpy = vi.spyOn(DocumentAsset, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const deleteLessonsSpy = vi.spyOn(Lesson, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const deleteCourseSpy = vi.spyOn(Course, "findByIdAndDelete").mockResolvedValueOnce({ _id: courseId });
      const deletePrefixSpy = vi.spyOn(videoR2Storage, "deletePrefix").mockResolvedValue(undefined);

      const req = { params: { slug: "full-course" } };
      const res = {
        status: () => res,
        json: vi.fn(),
      };
      const next = vi.fn();

      await courseController.remove(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(pullGroupSpy).toHaveBeenCalledWith(
        { courses: courseId },
        { $pull: { courses: courseId } }
      );
      expect(deleteJobsSpy).toHaveBeenCalledWith({
        $or: [
          { assetId: { $in: [videoAsset1Id, videoAsset2Id] } },
          { lessonId: { $in: [lesson1Id, lesson2Id] } },
        ],
      });
      expect(deleteAssetsSpy).toHaveBeenCalledWith({
        $or: [
          { courseId: courseId },
          { lessonId: { $in: [lesson1Id, lesson2Id] } },
        ],
      });
      expect(deleteDocsSpy).toHaveBeenCalledWith({
        $or: [
          { courseId: courseId },
          { lessonId: { $in: [lesson1Id, lesson2Id] } },
        ],
      });
      expect(deleteLessonsSpy).toHaveBeenCalledWith({
        _id: { $in: [lesson1Id, lesson2Id] },
      });
      expect(deleteCourseSpy).toHaveBeenCalledWith(courseId);

      await new Promise((r) => setTimeout(r, 10));
      expect(deletePrefixSpy).toHaveBeenCalledWith(`video-assets/${courseId}/`);
      expect(deletePrefixSpy).toHaveBeenCalledWith(`docs/${courseId}/`);
    });
  });

  describe("lessonController.remove Cascade", () => {
    it("deletes lesson, removes from course lessons array, and cleans up video/doc assets", async () => {
      const courseId = new mongoose.Types.ObjectId();
      const lessonId = new mongoose.Types.ObjectId();
      const videoAssetId = new mongoose.Types.ObjectId();
      const docAssetId = new mongoose.Types.ObjectId();

      const courseSaveMock = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "course-slug",
        lessons: [lessonId],
        save: courseSaveMock,
      });

      mockLessonModel({
        _id: lessonId,
        videoObjectKey: "video-assets/c/l/old.mp4",
        documentObjectKey: "docs/c/l/old.pdf",
      });

      const videoSelectMock = vi.fn().mockResolvedValueOnce([
        {
          _id: videoAssetId,
          source: { objectKey: "video-assets/c/l/a/source/vid.mp4" },
          outputPrefix: "video-assets/c/l/a/hls/",
        },
      ]);
      vi.spyOn(VideoAsset, "find").mockReturnValueOnce({ select: videoSelectMock });

      const docSelectMock = vi.fn().mockResolvedValueOnce([
        { _id: docAssetId, objectKey: "docs/c/l/a/sheet.pdf" },
      ]);
      vi.spyOn(DocumentAsset, "find").mockReturnValueOnce({ select: docSelectMock });

      const deleteJobsSpy = vi.spyOn(VideoProcessingJob, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const deleteAssetsSpy = vi.spyOn(VideoAsset, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const deleteDocsSpy = vi.spyOn(DocumentAsset, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const deleteLessonSpy = vi.spyOn(Lesson, "findByIdAndDelete").mockResolvedValueOnce({ _id: lessonId });
      const deletePrefixSpy = vi.spyOn(videoR2Storage, "deletePrefix").mockResolvedValue(undefined);

      const req = {
        params: { slug: "course-slug", lessonId: lessonId.toString() },
      };
      const res = {
        status: () => res,
        json: vi.fn(),
      };
      const next = vi.fn();

      await lessonController.remove(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(courseSaveMock).toHaveBeenCalled();
      expect(deleteLessonSpy).toHaveBeenCalledWith(lessonId);
      expect(deleteJobsSpy).toHaveBeenCalledWith({ assetId: { $in: [videoAssetId] } });
      expect(deleteAssetsSpy).toHaveBeenCalledWith({ _id: { $in: [videoAssetId] } });
      expect(deleteDocsSpy).toHaveBeenCalledWith({ lessonId: lessonId });

      await new Promise((r) => setTimeout(r, 10));
      expect(deletePrefixSpy).toHaveBeenCalledWith(`video-assets/c/l/a/hls/`);
      expect(deletePrefixSpy).toHaveBeenCalledWith(`docs/${courseId}/${lessonId}/`);
    });
  });

  describe("videoUploadController.removeVideo Edge Cases", () => {
    it("handles lesson with no existing video without error (idempotent)", async () => {
      const courseId = new mongoose.Types.ObjectId();
      const lessonId = new mongoose.Types.ObjectId();

      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "c1",
        lessons: [lessonId],
      });

      mockLessonModel({
        _id: lessonId,
        id: "l1",
        videoObjectKey: null,
      });

      const assetSelectMock = vi.fn().mockResolvedValueOnce([]);
      vi.spyOn(VideoAsset, "find").mockReturnValueOnce({ select: assetSelectMock });

      const updateLessonSpy = vi.spyOn(Lesson, "updateOne").mockResolvedValueOnce({ acknowledged: true });

      const req = { params: { slug: "c1", lessonId: lessonId.toString() } };
      let resultData: Record<string, unknown> | null = null;
      const res = {
        status: () => res,
        json: (body: { success: boolean; data: Record<string, unknown> }) => {
          resultData = body.data;
          return res;
        },
      };
      const next = vi.fn();

      await videoUploadController.removeVideo(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(updateLessonSpy).toHaveBeenCalledWith(
        { _id: lessonId },
        expect.objectContaining({
          $set: { videoAvailable: false, videoProcessingStatus: "none" },
        })
      );
      expect(resultData).toEqual({
        lessonId: lessonId.toString(),
        videoAvailable: false,
        status: "none",
      });
    });

    it("returns 404 when lesson does not belong to the course", async () => {
      const courseId = new mongoose.Types.ObjectId();
      const otherLessonId = new mongoose.Types.ObjectId();

      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "c1",
        lessons: [otherLessonId],
      });
      mockLessonModel(null);

      const req = { params: { slug: "c1", lessonId: "alien-lesson-id" } };
      const res = {};
      const next = vi.fn();

      await videoUploadController.removeVideo(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Lesson not found",
        })
      );
    });
  });
});
