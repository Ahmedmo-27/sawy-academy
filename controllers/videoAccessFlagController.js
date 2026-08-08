const mongoose = require("mongoose");
const HlsKeyAccessLog = require("../models/HlsKeyAccessLog");
const Session = require("../models/Session");
const User = require("../models/User");
const VideoAccessFlag = require("../models/VideoAccessFlag");
const {
  createHttpError,
  getPagination,
  sendSuccess,
} = require("./controllerUtils");

const STATUSES = new Set(["open", "in_review", "resolved", "dismissed"]);

function assertObjectId(value, label = "Record") {
  if (!mongoose.isValidObjectId(value)) {
    throw createHttpError(400, `${label} identifier is invalid`);
  }
}

function populateFlag(query) {
  return query
    .populate("userId", "name email")
    .populate("lessonId", "title slug sheetRef")
    .populate("reviewedBy", "name email");
}

async function listFlags(req, res, next) {
  try {
    const {
      limit: requestedLimit,
      page,
      skip: requestedSkip,
    } = getPagination(req.query);
    const limit = Math.min(requestedLimit, 100);
    const skip =
      req.query.skip !== undefined ? requestedSkip : (page - 1) * limit;
    const filter = {};
    if (req.query.status) {
      if (!STATUSES.has(req.query.status)) {
        throw createHttpError(400, "Review status is invalid");
      }
      filter.status = req.query.status;
    }
    if (req.query.userId) {
      assertObjectId(req.query.userId, "User");
      filter.userId = req.query.userId;
    }
    if (req.query.lessonId) {
      assertObjectId(req.query.lessonId, "Lesson");
      filter.lessonId = req.query.lessonId;
    }

    const [flags, total] = await Promise.all([
      populateFlag(
        VideoAccessFlag.find(filter)
          .sort({ lastDetectedAt: -1 })
          .skip(skip)
          .limit(limit)
      ).lean(),
      VideoAccessFlag.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      flags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getFlag(req, res, next) {
  try {
    assertObjectId(req.params.flagId, "Flag");
    const flag = await populateFlag(
      VideoAccessFlag.findById(req.params.flagId)
    ).lean();
    if (!flag) throw createHttpError(404, "Video access flag not found");

    const logLimit = Math.min(
      Math.max(Number.parseInt(req.query.logLimit || "50", 10) || 50, 1),
      100
    );
    const logs = await HlsKeyAccessLog.find({
      userId: flag.userId._id || flag.userId,
      assetId: flag.assetId,
    })
      .sort({ occurredAt: -1 })
      .limit(logLimit)
      .populate("lessonId", "title slug sheetRef")
      .lean();

    return sendSuccess(res, { flag, logs });
  } catch (error) {
    return next(error);
  }
}

async function updateFlag(req, res, next) {
  try {
    assertObjectId(req.params.flagId, "Flag");
    const update = {};
    if (req.body.status !== undefined) {
      if (!STATUSES.has(req.body.status)) {
        throw createHttpError(400, "Review status is invalid");
      }
      update.status = req.body.status;
      update.reviewedAt = new Date();
      update.reviewedBy = req.auth.userId;
    }
    if (req.body.notes !== undefined) {
      update.notes = String(req.body.notes).trim().slice(0, 5000);
    }
    if (Object.keys(update).length === 0) {
      throw createHttpError(400, "Status or notes are required");
    }

    const flag = await populateFlag(
      VideoAccessFlag.findByIdAndUpdate(
        req.params.flagId,
        { $set: update },
        { new: true, runValidators: true }
      )
    ).lean();
    if (!flag) throw createHttpError(404, "Video access flag not found");
    return sendSuccess(res, flag);
  } catch (error) {
    return next(error);
  }
}

async function revokeUserSessions(req, res, next) {
  try {
    assertObjectId(req.params.userId, "User");
    const user = await User.exists({ _id: req.params.userId });
    if (!user) throw createHttpError(404, "User not found");
    const result = await Session.deleteMany({ userId: req.params.userId });
    return sendSuccess(res, { revokedCount: result.deletedCount || 0 });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getFlag,
  listFlags,
  revokeUserSessions,
  updateFlag,
};
