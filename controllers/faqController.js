const Faq = require("../models/Faq");
const { toSlug } = require("../utils/slug");
const {
  buildCategoryFilter,
  createHttpError,
  pickFields,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");

const requiredFields = ["question", "answer"];
const allowedFields = ["id", "question", "answer", "category", "published", "order"];

function asBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const normalized = String(value).toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return fallback;
}

async function uniqueFaqId(question) {
  const base = toSlug(question || "").slice(0, 48) || `faq-${Date.now().toString(36)}`;
  let id = base;
  let n = 2;
  while (await Faq.exists({ id })) {
    id = `${base}-${n++}`;
  }
  return id;
}

async function getAll(req, res, next) {
  try {
    const filter = buildCategoryFilter(req.query);
    if (req.query.published !== "all") {
      filter.published = { $ne: false };
    }

    const faqs = await Faq.find(filter).sort({ order: 1, createdAt: 1 });
    return sendSuccess(res, faqs);
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const faq = await Faq.findOne({ id: req.params.id });

    if (!faq) {
      throw createHttpError(404, "FAQ not found");
    }

    return sendSuccess(res, faq);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    validateRequired(req.body, requiredFields);
    const fields = pickFields(req.body, allowedFields);
    fields.published = asBoolean(fields.published, true);
    if (!fields.id) {
      fields.id = await uniqueFaqId(fields.question);
    }
    const faq = await Faq.create(fields);
    return sendCreated(res, faq);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const fields = pickFields(req.body, allowedFields);
    if (fields.published !== undefined) {
      fields.published = asBoolean(fields.published, true);
    }

    const faq = await Faq.findOneAndUpdate({ id: req.params.id }, fields, {
      new: true,
      runValidators: true,
    });

    if (!faq) {
      throw createHttpError(404, "FAQ not found");
    }

    return sendSuccess(res, faq);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const faq = await Faq.findOneAndDelete({ id: req.params.id });

    if (!faq) {
      throw createHttpError(404, "FAQ not found");
    }

    return sendSuccess(res, faq);
  } catch (err) {
    return next(err);
  }
}

async function reorder(req, res, next) {
  try {
    const { faqIds } = req.body;

    if (!Array.isArray(faqIds) || faqIds.length === 0) {
      throw createHttpError(400, "faqIds must be a non-empty array");
    }

    await Promise.all(
      faqIds.map((key, index) =>
        Faq.findOneAndUpdate({ id: key }, { order: index + 1 })
      )
    );

    const faqs = await Faq.find({ id: { $in: faqIds } }).sort({
      order: 1,
      createdAt: 1,
    });

    return sendSuccess(res, faqs);
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, getAll, getById, remove, reorder, update };
