import { createRequire } from "node:module";
import { describe, expect, it, vi, beforeEach } from "vitest";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");
const Course = require("../../models/Course.js");
const CourseGroup = require("../../models/CourseGroup.js");
const Lesson = require("../../models/Lesson.js");
const VideoAsset = require("../../models/VideoAsset.js");
const VideoProcessingJob = require("../../models/VideoProcessingJob.js");
const DocumentAsset = require("../../models/DocumentAsset.js");
const { getQueueMetrics } = require("../../lib/videoProcessingQueue.js");
const { parseArgs } = require("../../scripts/r2-prune-orphans.js");
const { removeVideo } = require("../../controllers/videoUploadController.js");
const { removeDocument } = require("../../controllers/lessonDocumentController.js");
const courseController = require("../../controllers/courseController.js");
const lessonController = require("../../controllers/lessonController.js");

describe("R2 Courses & Queue Lifecycle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getQueueMetrics", () => {
    it("aggregates job counts by status and counts stale leases", async () => {
      vi.spyOn(VideoProcessingJob, "aggregate").mockResolvedValueOnce([
        { _id: "queued", count: 3 },
        { _id: "processing", count: 2 },
        { _id: "failed", count: 1 },
        { _id: "completed", count: 5 },
      ]);
      vi.spyOn(VideoProcessingJob, "countDocuments").mockResolvedValueOnce(1);

      const metrics = await getQueueMetrics();

      expect(metrics).toEqual({
        queued: 3,
        processing: 2,
        retry_wait: 0,
        completed: 5,
        failed: 1,
        staleLeases: 1,
        total: 11,
      });
    });

    it("returns zero counts when queue is empty", async () => {
      vi.spyOn(VideoProcessingJob, "aggregate").mockResolvedValueOnce([]);
      vi.spyOn(VideoProcessingJob, "countDocuments").mockResolvedValueOnce(0);

      const metrics = await getQueueMetrics();

      expect(metrics).toEqual({
        queued: 0,
        processing: 0,
        retry_wait: 0,
        completed: 0,
        failed: 0,
        staleLeases: 0,
        total: 0,
      });
    });
  });

  describe("r2-prune-orphans argument parser", () => {
    it("parses dry-run and retention flags properly", () => {
      const originalArgv = process.argv;
      try {
        process.argv = ["node", "scripts/r2-prune-orphans.js", "--dry-run", "--retention-days=14"];
        const parsed = parseArgs();
        expect(parsed.dryRun).toBe(true);
        expect(parsed.retentionDays).toBe(14);
      } finally {
        process.argv = originalArgv;
      }
    });

    it("defaults to live and 0 days when no flags provided", () => {
      const originalArgv = process.argv;
      try {
        process.argv = ["node", "scripts/r2-prune-orphans.js"];
        const parsed = parseArgs();
        expect(parsed.dryRun).toBe(false);
        expect(parsed.retentionDays).toBe(0);
      } finally {
        process.argv = originalArgv;
      }
    });
  });

  describe("Media Detachment & Removal Controllers", () => {
    it("removeVideo resets lesson video state and deletes VideoAsset/Job records", async () => {
      const courseId = new mongoose.Types.ObjectId();
      const lessonId = new mongoose.Types.ObjectId();
      const assetId = new mongoose.Types.ObjectId();

      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "intro-course",
        lessons: [lessonId],
      });

      const selectMock = vi.fn().mockResolvedValueOnce({
        _id: lessonId,
        id: "l1",
        videoObjectKey: "videos/course/lesson/vid.mp4",
      });
      vi.spyOn(Lesson, "findOne").mockReturnValueOnce({ select: selectMock });

      const assetSelectMock = vi.fn().mockResolvedValueOnce([
        {
          _id: assetId,
          source: { objectKey: "video-assets/c/l/a/source/vid.mp4" },
          outputPrefix: "video-assets/c/l/a/hls/",
        },
      ]);
      vi.spyOn(VideoAsset, "find").mockReturnValueOnce({ select: assetSelectMock });

      const deleteJobsSpy = vi.spyOn(VideoProcessingJob, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const deleteAssetsSpy = vi.spyOn(VideoAsset, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const updateLessonSpy = vi.spyOn(Lesson, "updateOne").mockResolvedValueOnce({ acknowledged: true });

      const req = {
        params: { slug: "intro-course", lessonId: lessonId.toString() },
      };
      let resultData: Record<string, unknown> | null = null;
      let statusCode = 200;
      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (body: { success: boolean; data: Record<string, unknown> }) => {
          resultData = body.data;
          return res;
        },
      };
      const next = vi.fn();

      await removeVideo(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(deleteJobsSpy).toHaveBeenCalledWith({ assetId: { $in: [assetId] } });
      expect(deleteAssetsSpy).toHaveBeenCalledWith({ _id: { $in: [assetId] } });
      expect(updateLessonSpy).toHaveBeenCalledWith(
        { _id: lessonId },
        {
          $set: { videoAvailable: false, videoProcessingStatus: "none" },
          $unset: {
            videoAssetId: 1,
            videoOriginalFilename: 1,
            videoProcessingError: 1,
            videoProcessingUpdatedAt: 1,
            videoObjectKey: 1,
            videoGeneration: 1,
          },
        }
      );
      expect(resultData).toEqual({
        lessonId: lessonId.toString(),
        videoAvailable: false,
        status: "none",
      });
    });

    it("removeDocument resets lesson document state and deletes DocumentAsset records", async () => {
      const courseId = new mongoose.Types.ObjectId();
      const lessonId = new mongoose.Types.ObjectId();
      const assetId = new mongoose.Types.ObjectId();

      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "intro-course",
        lessons: [lessonId],
      });

      const lessonSelectMock = vi.fn().mockResolvedValueOnce({
        _id: lessonId,
        documentGeneration: 1,
        documentObjectKey: "docs/c/l/a/doc.pdf",
      });
      vi.spyOn(Lesson, "findOne").mockReturnValueOnce({ select: lessonSelectMock });

      const lessonFindByIdSelectMock = vi.fn().mockResolvedValueOnce({
        _id: lessonId,
        documentObjectKey: "docs/c/l/a/doc.pdf",
      });
      vi.spyOn(Lesson, "findById").mockReturnValueOnce({ select: lessonFindByIdSelectMock });

      const docAssetSelectMock = vi.fn().mockResolvedValueOnce([
        { _id: assetId, objectKey: "docs/c/l/a/doc.pdf" },
      ]);
      vi.spyOn(DocumentAsset, "find").mockReturnValueOnce({ select: docAssetSelectMock });

      const deleteDocsSpy = vi.spyOn(DocumentAsset, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const updateLessonSpy = vi.spyOn(Lesson, "updateOne").mockResolvedValueOnce({ acknowledged: true });

      const req = {
        params: { slug: "intro-course", lessonId: lessonId.toString() },
      };
      let resultData: Record<string, unknown> | null = null;
      const res = {
        status: () => res,
        json: (body: { success: boolean; data: Record<string, unknown> }) => {
          resultData = body.data;
          return res;
        },
      };
      const next = vi.fn();

      await removeDocument(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(deleteDocsSpy).toHaveBeenCalledWith({ lessonId });
      expect(updateLessonSpy).toHaveBeenCalledWith(
        { _id: lessonId },
        {
          $set: { documentAvailable: false },
          $unset: {
            documentAssetId: 1,
            documentOriginalFilename: 1,
            documentObjectKey: 1,
            documentGeneration: 1,
          },
        }
      );
      expect(resultData).toEqual({
        lessonId: lessonId.toString(),
        documentAvailable: false,
        status: "none",
      });
    });
  });

  describe("Course Cascade Deletion", () => {
    it("courseController.remove deletes lessons, video assets, document assets, and pulls from groups", async () => {
      const courseId = new mongoose.Types.ObjectId();
      const lessonId = new mongoose.Types.ObjectId();
      const videoAssetId = new mongoose.Types.ObjectId();

      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "master-design",
        lessons: [lessonId],
      });

      const pullGroupSpy = vi.spyOn(CourseGroup, "updateMany").mockResolvedValueOnce({ acknowledged: true });

      const videoAssetSelectMock = vi.fn().mockResolvedValueOnce([{ _id: videoAssetId }]);
      vi.spyOn(VideoAsset, "find").mockReturnValueOnce({ select: videoAssetSelectMock });

      const deleteJobsSpy = vi.spyOn(VideoProcessingJob, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const deleteAssetsSpy = vi.spyOn(VideoAsset, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const deleteDocsSpy = vi.spyOn(DocumentAsset, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const deleteLessonsSpy = vi.spyOn(Lesson, "deleteMany").mockResolvedValueOnce({ acknowledged: true });
      const deleteCourseSpy = vi.spyOn(Course, "findByIdAndDelete").mockResolvedValueOnce({ _id: courseId });

      const req = { params: { slug: "master-design" } };
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
      expect(deleteJobsSpy).toHaveBeenCalled();
      expect(deleteAssetsSpy).toHaveBeenCalled();
      expect(deleteDocsSpy).toHaveBeenCalled();
      expect(deleteLessonsSpy).toHaveBeenCalledWith({ _id: { $in: [lessonId] } });
      expect(deleteCourseSpy).toHaveBeenCalledWith(courseId);
    });
  });
});
