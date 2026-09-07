import { createRequire } from "node:module";
import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");
const Course = require("../../models/Course.js");
const Lesson = require("../../models/Lesson.js");
const DocumentAsset = require("../../models/DocumentAsset.js");
const lessonDocumentController = require("../../controllers/lessonDocumentController.js");
const lessonVideoAccessPolicy = require("../../lib/lessonVideoAccessPolicy.js");
const privateR2Storage = require("../../lib/privateR2Storage.js");
const r2Config = require("../../lib/r2Config.js");

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
  vi.spyOn(lessonVideoAccessPolicy, "findLesson").mockResolvedValue(lessonDoc);
}

describe("Lesson Document Controller & Edge Cases", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("downloadDocument", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const req = { params: { lessonId: "l1" } };
      const res = {};
      const next = vi.fn();

      await lessonDocumentController.downloadDocument(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: "Authentication required",
        })
      );
    });

    it("rejects when lesson parent course cannot be found (404)", async () => {
      const lessonId = new mongoose.Types.ObjectId();
      mockLessonModel({ _id: lessonId, id: "l1" });
      vi.spyOn(Course, "findOne").mockResolvedValueOnce(null);

      const req = {
        auth: { userId: "u1", user: { role: "student" } },
        params: { lessonId: lessonId.toString() },
      };
      const res = {};
      const next = vi.fn();

      await lessonDocumentController.downloadDocument(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Parent course not found",
        })
      );
    });

    it("enforces course access policy and propagates 403 on unenrolled student", async () => {
      const lessonId = new mongoose.Types.ObjectId();
      const courseId = new mongoose.Types.ObjectId();
      mockLessonModel({ _id: lessonId, id: "l1" });
      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "bio-arch",
      });
      vi.spyOn(lessonVideoAccessPolicy, "assertCourseAccess").mockRejectedValueOnce({
        statusCode: 403,
        message: "Course enrollment required",
      });

      const req = {
        auth: { userId: "u-unauthorized", user: { role: "student" } },
        params: { lessonId: lessonId.toString() },
      };
      const res = {};
      const next = vi.fn();

      await lessonDocumentController.downloadDocument(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: "Course enrollment required",
        })
      );
    });

    it("returns 404 when lesson has documentAvailable: false or missing key", async () => {
      const lessonId = new mongoose.Types.ObjectId();
      const courseId = new mongoose.Types.ObjectId();
      mockLessonModel({
        _id: lessonId,
        id: "l1",
        documentAvailable: false,
        documentObjectKey: null,
      });
      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "bio-arch",
      });
      vi.spyOn(lessonVideoAccessPolicy, "assertCourseAccess").mockResolvedValueOnce(undefined);

      const req = {
        auth: { userId: "u1", user: { role: "student" } },
        params: { lessonId: lessonId.toString() },
      };
      const res = {};
      const next = vi.fn();

      await lessonDocumentController.downloadDocument(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: "Lesson document is not available",
        })
      );
    });

    it("streams PDF document with headers for enrolled student", async () => {
      const lessonId = new mongoose.Types.ObjectId();
      const courseId = new mongoose.Types.ObjectId();
      mockLessonModel({
        _id: lessonId,
        id: "l1",
        documentAvailable: true,
        documentObjectKey: "docs/course/lesson/asset/sheet-01.pdf",
        documentOriginalFilename: "Lesson-01-Sheet.pdf",
      });
      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "bio-arch",
      });
      vi.spyOn(lessonVideoAccessPolicy, "assertCourseAccess").mockResolvedValueOnce(undefined);

      const fakeStream = new Readable({
        read() {
          this.push(Buffer.from("%PDF-1.4 sample content"));
          this.push(null);
        },
      });
      const pipeSpy = vi.spyOn(fakeStream, "pipe").mockImplementation((dest) => dest);

      vi.spyOn(privateR2Storage, "getPrivateObject").mockResolvedValueOnce({
        Body: fakeStream,
        ContentType: "application/pdf",
        ContentLength: 1024,
      });

      const headers: Record<string, string> = {};
      const res = {
        set: vi.fn((key: string, value: string) => {
          headers[key] = value;
          return res;
        }),
      };
      const req = {
        auth: { userId: "u1", user: { role: "student" } },
        params: { lessonId: lessonId.toString() },
      };
      const next = vi.fn();

      await lessonDocumentController.downloadDocument(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.set).toHaveBeenCalledWith("Cache-Control", "private, no-store");
      expect(res.set).toHaveBeenCalledWith("Content-Type", "application/pdf");
      expect(res.set).toHaveBeenCalledWith(
        "Content-Disposition",
        'inline; filename="Lesson-01-Sheet.pdf"'
      );
      expect(res.set).toHaveBeenCalledWith("Content-Length", "1024");
      expect(pipeSpy).toHaveBeenCalledWith(res);
    });

    it("passes unexpected R2 storage errors to next(err)", async () => {
      const lessonId = new mongoose.Types.ObjectId();
      const courseId = new mongoose.Types.ObjectId();
      mockLessonModel({
        _id: lessonId,
        id: "l1",
        documentAvailable: true,
        documentObjectKey: "docs/course/lesson/asset/sheet-01.pdf",
      });
      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "bio-arch",
      });
      vi.spyOn(lessonVideoAccessPolicy, "assertCourseAccess").mockResolvedValueOnce(undefined);

      vi.spyOn(privateR2Storage, "getPrivateObject").mockRejectedValueOnce(
        new Error("R2 Connection Timeout")
      );

      const req = {
        auth: { userId: "u1", user: { role: "student" } },
        params: { lessonId: lessonId.toString() },
      };
      const res = { set: vi.fn() };
      const next = vi.fn();

      await lessonDocumentController.downloadDocument(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: "R2 Connection Timeout" })
      );
    });
  });

  describe("uploadDocument & Edge Cases", () => {
    it("returns 400 when req.file is missing", async () => {
      const req = { params: { slug: "c1", lessonId: "l1" } };
      const res = {};
      const next = vi.fn();

      await lessonDocumentController.uploadDocument(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "No lesson document uploaded",
        })
      );
    });

    it("returns 503 when private R2 is not configured", async () => {
      vi.spyOn(r2Config, "isPrivateR2Configured").mockReturnValueOnce(false);

      const req = {
        file: { path: "/tmp/fake.pdf", originalname: "sheet.pdf", size: 100 },
        params: { slug: "c1", lessonId: "l1" },
      };
      const res = {};
      const next = vi.fn();

      await lessonDocumentController.uploadDocument(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 503,
          message: expect.stringContaining("Private R2 is not configured"),
        })
      );
    });
  });

  describe("getDocumentStatus", () => {
    it("returns ready status with asset details when document is available", async () => {
      const courseId = new mongoose.Types.ObjectId();
      const lessonId = new mongoose.Types.ObjectId();
      const assetId = new mongoose.Types.ObjectId();

      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "c1",
        lessons: [lessonId],
      });

      mockLessonModel({
        _id: lessonId,
        documentAvailable: true,
        documentAssetId: assetId,
        documentOriginalFilename: "master-drawing.pdf",
      });

      vi.spyOn(DocumentAsset, "findById").mockResolvedValueOnce({
        _id: assetId,
        filename: "master-drawing.pdf",
        status: "ready",
      });

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

      await lessonDocumentController.getDocumentStatus(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(resultData).toEqual({
        lessonId: lessonId.toString(),
        documentAvailable: true,
        assetId: assetId.toString(),
        filename: "master-drawing.pdf",
        status: "ready",
        generation: 0,
      });
    });

    it("returns none status when lesson has no document attached", async () => {
      const courseId = new mongoose.Types.ObjectId();
      const lessonId = new mongoose.Types.ObjectId();

      vi.spyOn(Course, "findOne").mockResolvedValueOnce({
        _id: courseId,
        slug: "c1",
        lessons: [lessonId],
      });

      mockLessonModel({
        _id: lessonId,
        documentAvailable: false,
        documentAssetId: null,
      });

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

      await lessonDocumentController.getDocumentStatus(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(resultData).toEqual({
        lessonId: lessonId.toString(),
        documentAvailable: false,
        assetId: null,
        filename: null,
        status: "none",
        generation: 0,
      });
    });
  });
});
