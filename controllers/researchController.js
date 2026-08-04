const Research = require("../models/Research");
const {
  buildCategoryFilter,
  createHttpError,
  getPagination,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");

const requiredFields = ["id", "title", "year", "category", "venue", "abstract"];

async function getAll(req, res, next) {
  try {
    const { limit, skip } = getPagination(req.query);
    const filter = buildCategoryFilter(req.query);
    const researches = await Research.find(filter)
      .sort({ year: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, researches);
  } catch (err) {
    return next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const research = await Research.findOne({ slug: req.params.slug });

    if (!research) {
      throw createHttpError(404, "Research not found");
    }

    return sendSuccess(res, research);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    validateRequired(req.body, requiredFields);
    const research = await Research.create(req.body);
    return sendCreated(res, research);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const research = await Research.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true }
    );

    if (!research) {
      throw createHttpError(404, "Research not found");
    }

    return sendSuccess(res, research);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const research = await Research.findOneAndDelete({ slug: req.params.slug });

    if (!research) {
      throw createHttpError(404, "Research not found");
    }

    return sendSuccess(res, research);
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, getAll, getBySlug, remove, update };
