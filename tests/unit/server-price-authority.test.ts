import { createRequire } from "node:module";
import { describe, it, expect, vi, beforeEach } from "vitest";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");
const Order = require("../../models/Order.js");
const Course = require("../../models/Course.js");
const Product = require("../../models/Product.js");
const CourseGroup = require("../../models/CourseGroup.js");
const Enrollment = require("../../models/Enrollment.js");
const orderController = require("../../controllers/orderController.js");

describe("Server-Side Price Authority on Checkout & Order Management", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Server Price Authority & Tamper Protection", () => {
    it("replaces tampered client price with canonical database course price", async () => {
      const courseObjectId = new mongoose.Types.ObjectId().toString();
      const mockCourse = {
        _id: courseObjectId,
        id: "c-101",
        title: "Environmental Studio 1",
        price: "EGP 4,500",
      };
      vi.spyOn(Course, "findById").mockResolvedValue(mockCourse);
      vi.spyOn(Course, "findOne").mockResolvedValue(mockCourse);

      vi.spyOn(Order, "create").mockImplementation(async (payload: any) => ({
        ...payload,
        _id: new mongoose.Types.ObjectId(),
      }));

      const req = {
        auth: {
          userId: new mongoose.Types.ObjectId().toString(),
          user: { name: "Ahmed Student", email: "student@sawy.edu" },
        },
        body: {
          screenshotUrl: "/uploads/proof.jpg",
          items: [
            {
              id: courseObjectId,
              name: "Hacked cheap course",
              price: "EGP 1", // Client attempts tampering
              quantity: 2,
            },
          ],
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await orderController.create(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 9000, // 4500 * 2 (not 1 * 2)
          items: [
            expect.objectContaining({
              itemId: courseObjectId,
              title: "Environmental Studio 1",
              price: "EGP 4,500",
              quantity: 2,
            }),
          ],
        })
      );
    });

    it("resolves canonical price for products and diploma bundles", async () => {
      const prodObjectId = new mongoose.Types.ObjectId().toString();
      const mockProduct = {
        _id: prodObjectId,
        id: "p-01",
        name: "Architectural T-Square",
        price: "EGP 850",
      };
      vi.spyOn(Product, "findById").mockResolvedValue(mockProduct);
      vi.spyOn(Product, "findOne").mockResolvedValue(mockProduct);

      vi.spyOn(CourseGroup, "find").mockReturnValue({
        populate: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId().toString(),
            title: "Comprehensive Diploma",
            bundlePrice: "EGP 12,000",
            courses: [{ price: "EGP 5000" }, { price: "EGP 8000" }],
          },
        ]),
      } as any);

      vi.spyOn(Order, "create").mockImplementation(async (payload: any) => ({
        ...payload,
        _id: new mongoose.Types.ObjectId(),
      }));

      const req = {
        auth: {
          userId: new mongoose.Types.ObjectId().toString(),
          user: { name: "Ahmed Student", email: "student@sawy.edu" },
        },
        body: {
          screenshotUrl: "/uploads/proof.jpg",
          items: [
            {
              id: prodObjectId,
              kind: "product",
              name: "Fake Product",
              price: "EGP 10",
              quantity: 1,
            },
            {
              id: "diploma-comprehensive-diploma",
              kind: "diploma",
              name: "Fake Diploma",
              price: "EGP 50",
              quantity: 1,
            },
          ],
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await orderController.create(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 12850, // 850 + 12000
          items: [
            expect.objectContaining({
              itemId: prodObjectId,
              title: "Architectural T-Square",
              price: "EGP 850",
              kind: "product",
            }),
            expect.objectContaining({
              itemId: "diploma-comprehensive-diploma",
              title: "Comprehensive Diploma",
              price: "EGP 12,000",
              kind: "diploma",
            }),
          ],
        })
      );
    });

    it("computes diploma bundle price from child courses sum if bundlePrice is not explicitly set", async () => {
      vi.spyOn(CourseGroup, "find").mockReturnValue({
        populate: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId().toString(),
            title: "Dynamic Studio Track",
            bundlePrice: "", // not set
            courses: [
              { price: "EGP 3,000" },
              { price: "EGP 4,500" },
            ],
          },
        ]),
      } as any);

      vi.spyOn(Order, "create").mockImplementation(async (payload: any) => ({
        ...payload,
        _id: new mongoose.Types.ObjectId(),
      }));

      const req = {
        auth: {
          userId: new mongoose.Types.ObjectId().toString(),
          user: { name: "Student", email: "student@sawy.edu" },
        },
        body: {
          screenshotUrl: "/uploads/proof.jpg",
          items: [
            {
              id: "diploma-dynamic-studio-track",
              kind: "diploma",
              quantity: 1,
            },
          ],
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await orderController.create(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 7500, // 3000 + 4500
          items: [
            expect.objectContaining({
              price: "EGP 7500",
              quantity: 1,
            }),
          ],
        })
      );
    });

    it("rejects order when course has zero or invalid catalog price", async () => {
      const courseObjectId = new mongoose.Types.ObjectId().toString();
      vi.spyOn(Course, "findById").mockResolvedValue({
        _id: courseObjectId,
        title: "Free Unpriced Course",
        price: "EGP 0",
      });

      const req = {
        auth: {
          userId: new mongoose.Types.ObjectId().toString(),
          user: { name: "Student", email: "student@sawy.edu" },
        },
        body: {
          screenshotUrl: "/uploads/proof.jpg",
          items: [{ id: courseObjectId, quantity: 1 }],
        },
      };

      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await orderController.create(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining("invalid price in catalog"),
        })
      );
    });

    it("rejects order when item cannot be verified in any catalog entity", async () => {
      vi.spyOn(Course, "findById").mockResolvedValue(null);
      vi.spyOn(Course, "findOne").mockResolvedValue(null);
      vi.spyOn(Product, "findById").mockResolvedValue(null);
      vi.spyOn(Product, "findOne").mockResolvedValue(null);
      vi.spyOn(CourseGroup, "find").mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      } as any);

      const req = {
        auth: {
          userId: new mongoose.Types.ObjectId().toString(),
          user: { name: "Ahmed Student", email: "student@sawy.edu" },
        },
        body: {
          screenshotUrl: "/uploads/proof.jpg",
          items: [
            {
              id: "non-existent-item-999",
              price: "EGP 100",
              quantity: 1,
            },
          ],
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await orderController.create(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining("could not be verified"),
        })
      );
    });

    it("falls back through entities if kind is not explicitly specified", async () => {
      const prodId = new mongoose.Types.ObjectId().toString();
      vi.spyOn(Course, "findById").mockResolvedValue(null);
      vi.spyOn(Course, "findOne").mockResolvedValue(null);
      vi.spyOn(Product, "findById").mockResolvedValue({
        _id: prodId,
        name: "Technical Compass",
        price: "EGP 420",
      });

      vi.spyOn(Order, "create").mockImplementation(async (payload: any) => ({
        ...payload,
        _id: new mongoose.Types.ObjectId(),
      }));

      const req = {
        auth: {
          userId: new mongoose.Types.ObjectId().toString(),
          user: { name: "Student", email: "student@sawy.edu" },
        },
        body: {
          screenshotUrl: "/uploads/proof.jpg",
          items: [{ id: prodId, quantity: 3 }],
        },
      };

      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await orderController.create(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1260, // 420 * 3
          items: [
            expect.objectContaining({
              itemId: prodId,
              title: "Technical Compass",
              price: "EGP 420",
              quantity: 3,
              kind: "product",
            }),
          ],
        })
      );
    });
  });

  describe("Checkout Request Validation & Security Edge Cases", () => {
    it("rejects unauthenticated order submission with 401", async () => {
      const req = { body: { items: [{ id: "c1" }] } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await orderController.create(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: "Authentication required",
        })
      );
    });

    it("rejects empty items array with 400", async () => {
      const req = {
        auth: { userId: "u1", user: { name: "A", email: "a@b.com" } },
        body: { screenshotUrl: "/uploads/p.png", items: [] },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await orderController.create(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Order must include at least one item",
        })
      );
    });

    it("rejects items missing an id with 400", async () => {
      const req = {
        auth: { userId: "u1", user: { name: "A", email: "a@b.com" } },
        body: {
          screenshotUrl: "/uploads/p.png",
          items: [{ name: "Course without id" }],
        },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await orderController.create(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.stringContaining("missing an id"),
        })
      );
    });

    it("rejects invalid payment proof screenshot paths with 400", async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      vi.spyOn(Course, "findById").mockResolvedValue({
        _id: courseId,
        title: "Course",
        price: "EGP 500",
      });

      const req = {
        auth: { userId: "u1", user: { name: "A", email: "a@b.com" } },
        body: {
          screenshotUrl: "https://malicious-external-site.com/fake.png",
          items: [{ id: courseId, quantity: 1 }],
        },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await orderController.create(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Invalid payment proof upload",
        })
      );
    });
  });

  describe("Order Verification & Enrollment Provisioning", () => {
    it("approve creates enrollments for individual courses and diploma subcourses, skipping products", async () => {
      const course1Id = new mongoose.Types.ObjectId();
      const course2Id = new mongoose.Types.ObjectId();
      const orderId = new mongoose.Types.ObjectId();
      const studentId = new mongoose.Types.ObjectId();

      const orderDoc = {
        _id: orderId,
        id: "ORD-2026-001",
        userId: studentId,
        status: "pending",
        items: [
          { kind: "course", itemId: course1Id.toString() },
          { kind: "diploma", itemId: "diploma-advanced-track" },
          { kind: "product", itemId: "prod-99" },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Order, "findOne").mockResolvedValue(orderDoc);
      vi.spyOn(Course, "findById").mockResolvedValue({ _id: course1Id });
      vi.spyOn(CourseGroup, "find").mockReturnValue({
        populate: vi.fn().mockResolvedValue([
          {
            title: "Advanced Track",
            courses: [{ _id: course2Id }],
          },
        ]),
      } as any);

      const upsertSpy = vi.spyOn(Enrollment, "findOneAndUpdate").mockResolvedValue({ acknowledged: true });

      const req = {
        auth: { userId: "admin1", user: { role: "admin" } },
        params: { id: "ORD-2026-001" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await orderController.approve(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(orderDoc.status).toBe("verified");
      expect(orderDoc.save).toHaveBeenCalled();

      // Course 1 enrollment
      expect(upsertSpy).toHaveBeenCalledWith(
        { userId: studentId, courseId: course1Id },
        expect.anything(),
        expect.anything()
      );
      // Diploma Course 2 enrollment
      expect(upsertSpy).toHaveBeenCalledWith(
        { userId: studentId, courseId: course2Id },
        expect.anything(),
        expect.anything()
      );
      // Product was skipped
      expect(upsertSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ courseId: "prod-99" }),
        expect.anything(),
        expect.anything()
      );
    });

    it("reject orders sets status to rejected with reason", async () => {
      const orderDoc = {
        _id: new mongoose.Types.ObjectId(),
        id: "ORD-123",
        status: "pending",
        reason: undefined,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Order, "findOne").mockResolvedValue(orderDoc);

      const req = {
        auth: { userId: "admin1", user: { role: "admin" } },
        params: { id: "ORD-123" },
        body: { reason: "Screenshot was unreadable" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await orderController.reject(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(orderDoc.status).toBe("rejected");
      expect(orderDoc.reason).toBe("Screenshot was unreadable");
      expect(orderDoc.save).toHaveBeenCalled();
    });
  });

  describe("Order Access Authorization", () => {
    it("denies student access when querying all orders without me filter", async () => {
      const req = {
        auth: { userId: "u1", user: { role: "student" } },
        query: { userId: "other-user-99" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await orderController.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: "You can only view your own orders",
        })
      );
    });

    it("allows student to view their own orders", async () => {
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        id: "ORD-1",
        userId: "u1",
        userName: "Ahmed",
        userEmail: "ahmed@sawy.edu",
        amount: 4500,
        status: "pending",
        items: [{ title: "Course 1", quantity: 1, price: "EGP 4500" }],
      };

      vi.spyOn(Order, "find").mockReturnValue({
        sort: vi.fn().mockResolvedValue([mockOrder]),
      } as any);

      const req = {
        auth: { userId: "u1", user: { role: "student" } },
        query: { userId: "me" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await orderController.getAll(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ id: "ORD-1", amount: 4500 }),
          ]),
        })
      );
    });
  });
});
