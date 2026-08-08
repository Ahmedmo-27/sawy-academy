const Research = require("../models/Research");
const {
  buildCategoryFilter,
  createHttpError,
  getPagination,
  pickFields,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");

const requiredFields = ["id", "title", "year", "category", "venue", "abstract"];
const allowedFields = [
  "id",
  "title",
  "year",
  "category",
  "venue",
  "abstract",
  "collaborators",
  "authors",
  "publicationDate",
  "doi",
  "citation",
  "pdfUrl",
  "externalUrl",
  "keywords",
  "image",
  "figures",
  "slug",
];

const researchCategories = new Set([
  "Published",
  "Conference",
  "Ongoing",
  "Book",
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildResearchFilter(query) {
  const filter = buildCategoryFilter(query);
  if (query.category && !researchCategories.has(query.category)) {
    filter.category = { $in: [] };
  }

  const search = String(query.q || "").trim().slice(0, 120);
  if (search) {
    const expression = new RegExp(escapeRegExp(search), "i");
    filter.$or = [
      "title",
      "abstract",
      "venue",
      "collaborators",
      "authors",
      "keywords",
      "doi",
      "year",
    ].map((field) => ({ [field]: expression }));
  }
  return filter;
}

function getResearchSort(value) {
  if (value === "oldest") return { year: 1, publicationDate: 1, title: 1 };
  if (value === "title") return { title: 1, year: -1, _id: 1 };
  return { year: -1, publicationDate: -1, createdAt: -1, _id: 1 };
}

async function getAll(req, res, next) {
  try {
    const pagination = getPagination(req.query);
    const limit = Math.min(pagination.limit, 100);
    const skip = req.query.skip !== undefined
      ? pagination.skip
      : (pagination.page - 1) * limit;
    const filter = buildResearchFilter(req.query);
    const sort = getResearchSort(req.query.sort);
    const [researches, total] = await Promise.all([
      Research.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit),
      Research.countDocuments(filter),
    ]);

    if (req.query.paginated === "true" || req.query.paginated === "1") {
      return sendSuccess(res, {
        items: researches,
        total,
        page: pagination.page,
        pageSize: limit,
        hasMore: skip + researches.length < total,
      });
    }

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
    const research = await Research.create(pickFields(req.body, allowedFields));
    return sendCreated(res, research);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const research = await Research.findOneAndUpdate(
      { slug: req.params.slug },
      pickFields(req.body, allowedFields),
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
