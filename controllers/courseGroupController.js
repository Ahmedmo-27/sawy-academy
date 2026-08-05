const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseGroup = require("../models/CourseGroup");
const {
  createHttpError,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");

require("../models/Lesson");

const requiredFields = ["title", "subtitle", "type"];

async function resolveCourseIds(courseIds) {
  if (!Array.isArray(courseIds)) {
    return courseIds;
  }

  const resolved = [];

  for (const value of courseIds) {
    if (!value) continue;

    const asString = String(value);
    let course = null;

    if (mongoose.Types.ObjectId.isValid(asString)) {
      course = await Course.findById(asString).catch(() => null);
    }

    if (!course) {
      course = await Course.findOne({
        $or: [{ id: asString }, { slug: asString }],
      });
    }

    if (!course) {
      throw createHttpError(400, `Course not found: ${asString}`);
    }

    resolved.push(course._id);
  }

  return resolved;
}

function populateGroup(query) {
  return query.populate({
    path: "courses",
    populate: [{ path: "relatedProductIds" }, { path: "lessons" }],
  });
}

async function findGroupByParam(idParam) {
  const value = String(idParam).trim();

  if (mongoose.Types.ObjectId.isValid(value)) {
    const byObjectId = await CourseGroup.findById(value);
    if (byObjectId) return byObjectId;
  }

  return null;
}

async function create(req, res, next) {
  try {
    validateRequired(req.body, requiredFields);

    const payload = {
      title: req.body.title,
      subtitle: req.body.subtitle,
      type: req.body.type,
      bundlePrice: req.body.bundlePrice,
    };

    if (Object.prototype.hasOwnProperty.call(req.body, "courses")) {
      payload.courses = await resolveCourseIds(req.body.courses);
    }

    const group = await CourseGroup.create(payload);
    const populated = await populateGroup(CourseGroup.findById(group._id));
    return sendCreated(res, populated);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const group = await findGroupByParam(req.params.id);

    if (!group) {
      throw createHttpError(404, "Course group not found");
    }

    const payload = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(req.body, "courses")) {
      payload.courses = await resolveCourseIds(req.body.courses);
    }

    const updated = await populateGroup(
      CourseGroup.findByIdAndUpdate(group._id, payload, {
        new: true,
        runValidators: true,
      })
    );

    return sendSuccess(res, updated);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const group = await findGroupByParam(req.params.id);

    if (!group) {
      throw createHttpError(404, "Course group not found");
    }

    await CourseGroup.findByIdAndDelete(group._id);
    return sendSuccess(res, group);
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, remove, update };
