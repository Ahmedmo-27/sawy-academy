const fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
  createHttpError,
  sendCreated,
} = require("../controllers/controllerUtils");
const {
  isPrivateR2Configured,
  isPublicR2Configured,
} = require("../lib/r2Config");
const { putPublicWebsiteAsset } = require("../lib/publicR2Storage");
const {
  putPrivatePaymentProof,
  putPrivateServiceReference,
} = require("../lib/privateR2Storage");
const { WEBSITE_ASSET_PAGES, buildGuestServiceReferenceOwner } = require("../lib/r2ObjectKeys");

const uploadDir = path.join(process.cwd(), "public", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const UPLOAD_PURPOSES = new Set([
  "website-asset",
  "local",
  "payment",
  "service-reference",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      cb(createHttpError(400, "Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

function resolvePurpose(raw) {
  const purpose = String(raw || "website-asset")
    .trim()
    .toLowerCase();
  if (UPLOAD_PURPOSES.has(purpose)) {
    return purpose;
  }
  throw createHttpError(
    400,
    'Invalid upload purpose. Use "website-asset", "payment", "service-reference", or "local".'
  );
}

function extensionFor(file) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (IMAGE_EXTS.has(ext)) return ext;
  const fromMime = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  }[file.mimetype];
  return fromMime || ".jpg";
}

function saveLocalUpload(file) {
  const filename = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}${extensionFor(file)}`;
  const absolute = path.join(uploadDir, filename);
  fs.writeFileSync(absolute, file.buffer);
  return {
    url: `/uploads/${filename}`,
    storage: "local",
  };
}

async function create(req, res, next) {
  try {
    if (!req.file) {
      throw createHttpError(400, "No image file uploaded");
    }

    const purpose = resolvePurpose(req.body?.purpose);

    if (purpose === "local") {
      return sendCreated(res, saveLocalUpload(req.file));
    }

    if (purpose === "payment") {
      if (!req.auth?.userId) {
        throw createHttpError(401, "Authentication required");
      }

      if (!isPrivateR2Configured()) {
        return sendCreated(res, {
          ...saveLocalUpload(req.file),
          fallback: "private-r2-unconfigured",
        });
      }

      const result = await putPrivatePaymentProof({
        userId: req.auth.userId.toString(),
        body: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname || `payment${extensionFor(req.file)}`,
      });

      return sendCreated(res, {
        url: result.objectKey,
        objectKey: result.objectKey,
        storage: "r2-private",
      });
    }

    if (purpose === "service-reference") {
      const guestName = String(
        req.body?.guestName || req.body?.name || ""
      ).trim();
      if (!guestName) {
        throw createHttpError(
          400,
          "Enter your name on the form before uploading reference images"
        );
      }

      if (!isPrivateR2Configured()) {
        return sendCreated(res, {
          ...saveLocalUpload(req.file),
          fallback: "private-r2-unconfigured",
        });
      }

      const ownerSegment = buildGuestServiceReferenceOwner(guestName);
      const result = await putPrivateServiceReference({
        ownerSegment,
        body: req.file.buffer,
        contentType: req.file.mimetype,
        filename:
          req.file.originalname || `reference${extensionFor(req.file)}`,
      });

      return sendCreated(res, {
        url: result.objectKey,
        objectKey: result.objectKey,
        storage: "r2-private",
        ownerSegment,
      });
    }

    // website-asset: public R2 when configured; otherwise local fallback for dev.
    if (!isPublicR2Configured()) {
      return sendCreated(res, {
        ...saveLocalUpload(req.file),
        fallback: "public-r2-unconfigured",
      });
    }

    const page = req.body?.page || "shared";
    if (
      page &&
      !WEBSITE_ASSET_PAGES.includes(String(page).trim().toLowerCase())
    ) {
      throw createHttpError(
        400,
        `Invalid page. Allowed: ${WEBSITE_ASSET_PAGES.join(", ")}`
      );
    }

    const result = await putPublicWebsiteAsset({
      body: req.file.buffer,
      contentType: req.file.mimetype,
      filename: req.file.originalname || `asset${extensionFor(req.file)}`,
      page,
      entityId: req.body?.entityId,
    });

    return sendCreated(res, {
      url: result.url,
      objectKey: result.objectKey,
      storage: "r2-public",
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  uploadMiddleware: upload.single("file"),
  create,
};
