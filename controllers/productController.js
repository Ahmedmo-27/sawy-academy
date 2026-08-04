const Product = require("../models/Product");
const {
  buildCategoryFilter,
  createHttpError,
  getPagination,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");

const requiredFields = ["id", "name", "description", "price", "category", "image"];

async function getAll(req, res, next) {
  try {
    const { limit, skip } = getPagination(req.query);
    const filter = buildCategoryFilter(req.query);
    const products = await Product.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, products);
  } catch (err) {
    return next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const product = await Product.findOne({ id: req.params.slug });

    if (!product) {
      throw createHttpError(404, "Product not found");
    }

    return sendSuccess(res, product);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    validateRequired(req.body, requiredFields);
    const product = await Product.create(req.body);
    return sendCreated(res, product);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const product = await Product.findOneAndUpdate(
      { id: req.params.slug },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      throw createHttpError(404, "Product not found");
    }

    return sendSuccess(res, product);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.slug });

    if (!product) {
      throw createHttpError(404, "Product not found");
    }

    return sendSuccess(res, product);
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, getAll, getBySlug, remove, update };
