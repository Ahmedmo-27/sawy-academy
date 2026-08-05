const Cart = require("../models/Cart");
const {
  createHttpError,
  sendSuccess,
} = require("./controllerUtils");

const ALLOWED_KINDS = new Set(["product", "course", "diploma"]);

function serializeCart(doc) {
  const cart = doc?.toObject ? doc.toObject() : doc;

  return {
    items: (cart?.items || []).map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price || undefined,
      kind: item.kind,
      quantity: item.quantity,
      category: item.category || undefined,
      image: item.image || undefined,
    })),
    updatedAt: cart?.updatedAt
      ? new Date(cart.updatedAt).toISOString()
      : undefined,
  };
}

function normalizeItems(rawItems) {
  if (rawItems === undefined || rawItems === null) {
    throw createHttpError(400, "Cart items are required");
  }

  if (!Array.isArray(rawItems)) {
    throw createHttpError(400, "Cart items must be an array");
  }

  return rawItems.map((item, index) => {
    const id = item?.id;
    const name = item?.name;
    const kind = item?.kind;

    if (!id) {
      throw createHttpError(400, `Item ${index + 1} is missing an id`);
    }
    if (!name) {
      throw createHttpError(400, `Item ${index + 1} is missing a name`);
    }
    if (!ALLOWED_KINDS.has(kind)) {
      throw createHttpError(
        400,
        `Item ${index + 1} has an invalid kind`
      );
    }

    const quantity = Math.max(Number(item.quantity) || 1, 1);

    return {
      id: String(id).trim(),
      name: String(name).trim(),
      price: item.price ? String(item.price).trim() : undefined,
      kind,
      quantity,
      category: item.category ? String(item.category).trim() : undefined,
      image: item.image ? String(item.image).trim() : undefined,
    };
  });
}

async function getCart(req, res, next) {
  try {
    if (!req.auth) {
      throw createHttpError(401, "Authentication required");
    }

    const cart = await Cart.findOne({ userId: req.auth.userId });
    return sendSuccess(res, serializeCart(cart || { items: [] }));
  } catch (err) {
    return next(err);
  }
}

async function putCart(req, res, next) {
  try {
    if (!req.auth) {
      throw createHttpError(401, "Authentication required");
    }

    const items = normalizeItems(req.body?.items);

    const cart = await Cart.findOneAndUpdate(
      { userId: req.auth.userId },
      { $set: { items } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return sendSuccess(res, serializeCart(cart));
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getCart,
  putCart,
  serializeCart,
};
