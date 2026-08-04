const Project = require("../models/Project");
const {
  buildCategoryFilter,
  createHttpError,
  getPagination,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");

const requiredFields = ["id", "title", "category", "year", "image"];

async function getAll(req, res, next) {
  try {
    const { limit, skip } = getPagination(req.query);
    const filter = buildCategoryFilter(req.query);
    const projects = await Project.find(filter)
      .sort({ order: 1, sheetRef: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, projects);
  } catch (err) {
    return next(err);
  }
}

async function reorder(req, res, next) {
  try {
    const { projectIds } = req.body;

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      throw createHttpError(400, "projectIds must be a non-empty array");
    }

    await Promise.all(
      projectIds.map((key, index) =>
        Project.findOneAndUpdate(
          { $or: [{ slug: key }, { id: key }] },
          { order: index + 1 }
        )
      )
    );

    const projects = await Project.find({
      $or: [{ slug: { $in: projectIds } }, { id: { $in: projectIds } }],
    }).sort({ order: 1, sheetRef: 1, createdAt: 1 });

    return sendSuccess(res, projects);
  } catch (err) {
    return next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const project = await Project.findOne({ slug: req.params.slug });

    if (!project) {
      throw createHttpError(404, "Project not found");
    }

    return sendSuccess(res, project);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    validateRequired(req.body, requiredFields);
    const project = await Project.create(req.body);
    return sendCreated(res, project);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const project = await Project.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      throw createHttpError(404, "Project not found");
    }

    return sendSuccess(res, project);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const project = await Project.findOneAndDelete({ slug: req.params.slug });

    if (!project) {
      throw createHttpError(404, "Project not found");
    }

    return sendSuccess(res, project);
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, getAll, getBySlug, remove, reorder, update };
