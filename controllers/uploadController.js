const fs = require("fs");
const path = require("path");
const multer = require("multer");
const {
  createHttpError,
  sendCreated,
} = require("../controllers/controllerUtils");

const uploadDir = path.join(process.cwd(), "public", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
      ? ext
      : ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      cb(createHttpError(400, "Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

async function create(req, res, next) {
  try {
    if (!req.file) {
      throw createHttpError(400, "No image file uploaded");
    }

    return sendCreated(res, {
      url: `/uploads/${req.file.filename}`,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  uploadMiddleware: upload.single("file"),
  create,
};
