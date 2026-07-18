const Course = require("../models/Course");
const CourseGroup = require("../models/CourseGroup");
const Product = require("../models/Product");
// Register Lesson so course.lessons can be populated.
require("../models/Lesson");
const {
  createHttpError,
  getPagination,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");

const requiredFields = ["id", "title", "description", "level", "instructor", "price"];

function populateCourse(query, includeLessons = false) {
  const populatedQuery = query.populate("relatedProductIds");

  if (includeLessons) {
    return populatedQuery.populate("lessons");
  }

  return populatedQuery;
}

async function resolveRelatedProductIds(relatedProductIds) {
  if (!Array.isArray(relatedProductIds)) {
    return relatedProductIds;
  }

  const resolved = [];

  for (const value of relatedProductIds) {
    if (!value) continue;

    const asString = String(value);
    const product =
      (await Product.findById(asString).catch(() => null)) ||
      (await Product.findOne({ id: asString }));

    if (!product) {
      throw createHttpError(400, `Related product not found: ${asString}`);
    }

    resolved.push(product._id);
  }

  return resolved;
}

async function getAll(req, res, next) {
  try {
    const { limit, skip } = getPagination(req.query);
    const courses = await populateCourse(Course.find({}))
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, courses);
  } catch (err) {
    return next(err);
  }
}

async function getGroups(req, res, next) {
  try {
    const groups = await CourseGroup.find({})
      .sort({ createdAt: 1 })
      .populate({
        path: "courses",
        populate: [{ path: "relatedProductIds" }, { path: "lessons" }],
      });

    return sendSuccess(res, groups);
  } catch (err) {
    return next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const course = await populateCourse(
      Course.findOne({ slug: req.params.slug }),
      true
    );

    if (!course) {
      throw createHttpError(404, "Course not found");
    }

    return sendSuccess(res, course);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    validateRequired(req.body, requiredFields);
    const payload = {
      ...req.body,
      relatedProductIds: await resolveRelatedProductIds(req.body.relatedProductIds),
    };
    const course = await Course.create(payload);
    const populatedCourse = await populateCourse(Course.findById(course._id), true);
    return sendCreated(res, populatedCourse);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const payload = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(req.body, "relatedProductIds")) {
      payload.relatedProductIds = await resolveRelatedProductIds(
        req.body.relatedProductIds
      );
    }

    const course = await populateCourse(
      Course.findOneAndUpdate(
        { slug: req.params.slug },
        payload,
        { new: true, runValidators: true }
      ),
      true
    );

    if (!course) {
      throw createHttpError(404, "Course not found");
    }

    return sendSuccess(res, course);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const course = await Course.findOneAndDelete({ slug: req.params.slug });

    if (!course) {
      throw createHttpError(404, "Course not found");
    }

    return sendSuccess(res, course);
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, getAll, getBySlug, getGroups, remove, update };
