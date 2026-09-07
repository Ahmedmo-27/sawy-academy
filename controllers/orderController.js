const mongoose = require("mongoose");
const Order = require("../models/Order");
const Course = require("../models/Course");
const CourseGroup = require("../models/CourseGroup");
const Product = require("../models/Product");
const Enrollment = require("../models/Enrollment");
const { toSlug } = require("../utils/slug");
const {
  createHttpError,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");
const {
  isPaymentProofObjectKey,
} = require("../lib/r2ObjectKeys");
const { getPrivateObject } = require("../lib/privateR2Storage");
const { isPrivateR2Configured } = require("../lib/r2Config");
const {
  sendOrderReceivedEmail,
  sendAdminNewOrderAlert,
  sendOrderApprovedEmail,
  sendOrderRejectedEmail,
} = require("../lib/email/mailer");

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
  const rawScreenshot = order.paymentScreenshotUrl || "";
  const paymentScreenshotUrl = isPaymentProofObjectKey(rawScreenshot)
    ? `/api/orders/${encodeURIComponent(order.id)}/payment-screenshot`
    : rawScreenshot;

  return {
    _id: order._id.toString(),
    id: order.id,
    userName: order.userName,
    userEmail: order.userEmail,
    amount: order.amount,
    status: order.status,
    paymentScreenshotUrl,
    instaPayScreenshot: paymentScreenshotUrl,
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

async function resolveProduct(itemId) {
  const value = String(itemId).trim();
  if (mongoose.Types.ObjectId.isValid(value)) {
    const byObjectId = await Product.findById(value);
    if (byObjectId) return byObjectId;
  }
  return await Product.findOne({ id: value });
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

async function resolveDiplomaGroup(itemId) {
  const value = String(itemId).trim();
  if (mongoose.Types.ObjectId.isValid(value)) {
    const byObjectId = await CourseGroup.findById(value).populate("courses");
    if (byObjectId) return byObjectId;
  }
  const slug = value.startsWith("diploma-")
    ? value.slice("diploma-".length)
    : value;

  const groups = await CourseGroup.find({}).populate("courses");
  const group = groups.find(
    (entry) => toSlug(entry.title) === slug || String(entry._id) === value
  );
  return group || null;
}

async function resolveDiplomaCourses(itemId) {
  const group = await resolveDiplomaGroup(itemId);
  return group?.courses || [];
}

async function resolveCanonicalItem(rawItem, index) {
  const itemId = rawItem.id || rawItem.itemId;
  if (!itemId) {
    throw createHttpError(400, `Item ${index + 1} is missing an id`);
  }

  const rawKind = String(rawItem.kind || "").toLowerCase().trim();
  const quantity = Math.max(Number(rawItem.quantity) || 1, 1);
  const trimmedId = String(itemId).trim();

  let canonicalTitle = "";
  let canonicalPrice = "";
  let resolvedKind = rawKind;

  if (rawKind === "diploma" || trimmedId.startsWith("diploma-")) {
    const group = await resolveDiplomaGroup(trimmedId);
    if (!group) {
      throw createHttpError(400, `Diploma group ${trimmedId} could not be verified`);
    }
    resolvedKind = "diploma";
    canonicalTitle = group.title;
    canonicalPrice = group.bundlePrice || "";
    if (!canonicalPrice && Array.isArray(group.courses)) {
      const sum = group.courses.reduce((acc, c) => acc + parsePrice(c.price), 0);
      canonicalPrice = `EGP ${sum}`;
    }
  } else if (rawKind === "product") {
    const product = await resolveProduct(trimmedId);
    if (!product) {
      throw createHttpError(400, `Product ${trimmedId} could not be verified`);
    }
    resolvedKind = "product";
    canonicalTitle = product.name;
    canonicalPrice = product.price;
  } else {
    // Course or unspecified
    const course = await resolveCourse(trimmedId);
    if (course) {
      resolvedKind = "course";
      canonicalTitle = course.title;
      canonicalPrice = course.price;
    } else {
      const product = await resolveProduct(trimmedId);
      if (product) {
        resolvedKind = "product";
        canonicalTitle = product.name;
        canonicalPrice = product.price;
      } else {
        const group = await resolveDiplomaGroup(trimmedId);
        if (group) {
          resolvedKind = "diploma";
          canonicalTitle = group.title;
          canonicalPrice = group.bundlePrice || "";
          if (!canonicalPrice && Array.isArray(group.courses)) {
            const sum = group.courses.reduce((acc, c) => acc + parsePrice(c.price), 0);
            canonicalPrice = `EGP ${sum}`;
          }
        } else {
          throw createHttpError(400, `Item ${trimmedId} could not be verified in catalog`);
        }
      }
    }
  }

  if (!canonicalPrice || parsePrice(canonicalPrice) <= 0) {
    throw createHttpError(
      400,
      `Item "${canonicalTitle || trimmedId}" has an invalid price in catalog`
    );
  }

  return {
    itemId: trimmedId,
    title: canonicalTitle || String(rawItem.name || rawItem.title || "").trim() || trimmedId,
    quantity,
    price: canonicalPrice,
    kind: resolvedKind,
  };
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

    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      throw createHttpError(400, "Order must include at least one item");
    }

    const items = await Promise.all(
      req.body.items.map((item, index) => resolveCanonicalItem(item, index))
    );
    const amount = computeAmount(items);

    if (amount <= 0) {
      throw createHttpError(400, "Order total must be greater than zero");
    }

    const screenshotUrl = String(req.body.screenshotUrl).trim();
    const userId = req.auth.userId.toString();
    const isLocalUpload = screenshotUrl.startsWith("/uploads/");
    const isPrivateProof = isPaymentProofObjectKey(screenshotUrl, userId);
    if (!isLocalUpload && !isPrivateProof) {
      throw createHttpError(400, "Invalid payment proof upload");
    }

    const order = await Order.create({
      id: generateOrderId(),
      userId: req.auth.userId,
      userName: req.auth.user.name,
      userEmail: req.auth.user.email,
      amount,
      status: "pending",
      paymentScreenshotUrl: screenshotUrl,
      items,
      submittedAt: new Date(),
    });

    sendOrderReceivedEmail({
      to: req.auth.user.email,
      name: req.auth.user.name,
      orderId: order.id,
      amount,
      items,
    }).catch(() => {});

    sendAdminNewOrderAlert({
      orderId: order.id,
      userName: req.auth.user.name,
      userEmail: req.auth.user.email,
      amount,
      items,
    }).catch(() => {});

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

    sendOrderApprovedEmail({
      to: order.userEmail,
      name: order.userName,
      orderId: order.id,
      items: order.items || [],
    }).catch(() => {});

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

    sendOrderRejectedEmail({
      to: order.userEmail,
      name: order.userName,
      orderId: order.id,
      reason: order.reason,
    }).catch(() => {});

    return sendSuccess(res, serializeOrder(order));
  } catch (err) {
    return next(err);
  }
}

async function getPaymentScreenshot(req, res, next) {
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

    const objectKey = String(order.paymentScreenshotUrl || "").trim();
    if (!isPaymentProofObjectKey(objectKey)) {
      throw createHttpError(404, "Payment proof is not stored in private R2");
    }

    if (!isPrivateR2Configured()) {
      throw createHttpError(503, "Private R2 is not configured");
    }

    const object = await getPrivateObject(objectKey);
    if (!object.Body) {
      throw createHttpError(404, "Payment proof not found");
    }

    res.set("Cache-Control", "private, no-store");
    res.set("Vary", "Cookie, Authorization, X-Device-Id");
    res.set("Content-Type", object.ContentType || "image/jpeg");
    res.set("Content-Disposition", "inline");
    if (object.ContentLength) {
      res.set("Content-Length", String(object.ContentLength));
    }

    object.Body.pipe(res);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  approve,
  create,
  getAll,
  getById,
  getPaymentScreenshot,
  reject,
};
