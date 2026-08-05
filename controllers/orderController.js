const mongoose = require("mongoose");
const Order = require("../models/Order");
const Course = require("../models/Course");
const CourseGroup = require("../models/CourseGroup");
const Enrollment = require("../models/Enrollment");
const { toSlug } = require("../utils/slug");
const {
  createHttpError,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");

function parsePrice(price) {
  if (typeof price !== "string") return 0;
  const digits = price.replace(/[^\d.]/g, "");
  const value = Number(digits);
  return Number.isFinite(value) ? value : 0;
}

function generateOrderId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${date}-${suffix}`;
}

function serializeOrder(doc) {
  const order = doc.toObject ? doc.toObject() : doc;

  return {
    _id: order._id.toString(),
    id: order.id,
    userName: order.userName,
    userEmail: order.userEmail,
    amount: order.amount,
    status: order.status,
    paymentScreenshotUrl: order.paymentScreenshotUrl,
    instaPayScreenshot: order.paymentScreenshotUrl,
    submittedAt: order.submittedAt
      ? new Date(order.submittedAt).toISOString()
      : undefined,
    createdAt: order.createdAt
      ? new Date(order.createdAt).toISOString()
      : undefined,
    updatedAt: order.updatedAt
      ? new Date(order.updatedAt).toISOString()
      : undefined,
    reason: order.reason,
    items: (order.items || []).map((item) => ({
      title: item.title,
      quantity: item.quantity,
      price: item.price,
    })),
  };
}

function normalizeItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw createHttpError(400, "Order must include at least one item");
  }

  return rawItems.map((item, index) => {
    const itemId = item.id || item.itemId;
    const title = item.name || item.title;

    if (!itemId) {
      throw createHttpError(400, `Item ${index + 1} is missing an id`);
    }
    if (!title) {
      throw createHttpError(400, `Item ${index + 1} is missing a name`);
    }

    const quantity = Math.max(Number(item.quantity) || 1, 1);

    return {
      itemId: String(itemId).trim(),
      title: String(title).trim(),
      quantity,
      price: item.price ? String(item.price).trim() : undefined,
      kind: item.kind,
    };
  });
}

function computeAmount(items) {
  return items.reduce(
    (total, item) => total + parsePrice(item.price) * item.quantity,
    0
  );
}

function canAccessOrder(order, auth) {
  if (!auth) return false;
  if (auth.user.role === "admin") return true;
  return order.userId.toString() === auth.userId.toString();
}

async function resolveCourse(itemId) {
  const value = String(itemId).trim();

  if (mongoose.Types.ObjectId.isValid(value)) {
    const byObjectId = await Course.findById(value);
    if (byObjectId) return byObjectId;
  }

  return (
    (await Course.findOne({ id: value })) ||
    (await Course.findOne({ slug: value }))
  );
}

async function resolveDiplomaCourses(itemId) {
  const value = String(itemId).trim();
  const slug = value.startsWith("diploma-")
    ? value.slice("diploma-".length)
    : value;

  if (!slug) return [];

  const groups = await CourseGroup.find({}).populate("courses");
  const group = groups.find((entry) => toSlug(entry.title) === slug);

  if (!group) return [];
  return group.courses || [];
}

async function upsertEnrollment(userId, courseId, orderId) {
  await Enrollment.findOneAndUpdate(
    { userId, courseId },
    {
      $setOnInsert: {
        userId,
        courseId,
        orderId,
        completedLessonIds: [],
      },
    },
    { upsert: true, new: true }
  );
}

async function createEnrollmentsFromOrder(order) {
  const userId = order.userId;
  const orderId = order._id;

  for (const item of order.items || []) {
    if (item.kind === "product") continue;

    if (item.kind === "diploma") {
      const courses = await resolveDiplomaCourses(item.itemId);
      for (const course of courses) {
        await upsertEnrollment(userId, course._id, orderId);
      }
      continue;
    }

    if (item.kind === "course" || !item.kind) {
      const course = await resolveCourse(item.itemId);
      if (course) {
        await upsertEnrollment(userId, course._id, orderId);
      }
    }
  }
}

async function create(req, res, next) {
  try {
    if (!req.auth) {
      throw createHttpError(401, "Authentication required");
    }

    validateRequired(req.body, ["items", "screenshotUrl"]);

    const items = normalizeItems(req.body.items);
    const amount = computeAmount(items);

    if (amount <= 0) {
      throw createHttpError(400, "Order total must be greater than zero");
    }

    const order = await Order.create({
      id: generateOrderId(),
      userId: req.auth.userId,
      userName: req.auth.user.name,
      userEmail: req.auth.user.email,
      amount,
      status: "pending",
      paymentScreenshotUrl: String(req.body.screenshotUrl).trim(),
      items,
      submittedAt: new Date(),
    });

    return sendCreated(res, serializeOrder(order));
  } catch (err) {
    return next(err);
  }
}

async function getAll(req, res, next) {
  try {
    if (!req.auth) {
      throw createHttpError(401, "Authentication required");
    }

    const filter = {};

    if (req.auth.user.role === "admin") {
      if (req.query.status) {
        filter.status = String(req.query.status);
      }
    } else if (req.query.userId === "me") {
      filter.userId = req.auth.userId;
    } else {
      throw createHttpError(403, "You can only view your own orders");
    }

    const orders = await Order.find(filter).sort({ submittedAt: -1, createdAt: -1 });
    return sendSuccess(res, orders.map(serializeOrder));
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    if (!req.auth) {
      throw createHttpError(401, "Authentication required");
    }

    const order = await Order.findOne({
      $or: [{ id: req.params.id }, { _id: req.params.id }],
    });

    if (!order) {
      throw createHttpError(404, "Order not found");
    }

    if (!canAccessOrder(order, req.auth)) {
      throw createHttpError(403, "You do not have access to this order");
    }

    return sendSuccess(res, serializeOrder(order));
  } catch (err) {
    return next(err);
  }
}

async function approve(req, res, next) {
  try {
    const order = await Order.findOne({
      $or: [{ id: req.params.id }, { _id: req.params.id }],
    });

    if (!order) {
      throw createHttpError(404, "Order not found");
    }

    if (order.status !== "verified") {
      order.status = "verified";
      order.reason = undefined;
      await order.save();
    }

    await createEnrollmentsFromOrder(order);

    return sendSuccess(res, serializeOrder(order));
  } catch (err) {
    return next(err);
  }
}

async function reject(req, res, next) {
  try {
    validateRequired(req.body, ["reason"]);

    const order = await Order.findOne({
      $or: [{ id: req.params.id }, { _id: req.params.id }],
    });

    if (!order) {
      throw createHttpError(404, "Order not found");
    }

    order.status = "rejected";
    order.reason = String(req.body.reason).trim();
    await order.save();

    return sendSuccess(res, serializeOrder(order));
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  approve,
  create,
  getAll,
  getById,
  reject,
};
