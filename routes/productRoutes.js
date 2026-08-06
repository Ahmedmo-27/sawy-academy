const express = require("express");
const productController = require("../controllers/productController");
const {
  authenticate,
  requireAdmin,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();
const adminWrite = [authenticate, requireDevice, requireAdmin];

router.get("/", productController.getAll);
router.get("/:slug", productController.getBySlug);
router.post("/", adminWrite, productController.create);
router.put("/:slug", adminWrite, productController.update);
router.delete("/:slug", adminWrite, productController.remove);

module.exports = router;
