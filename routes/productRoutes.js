const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

router.get("/", productController.getAll);
router.get("/:slug", productController.getBySlug);
router.post("/", /* TODO: adminOnly middleware */ productController.create);
router.put("/:slug", /* TODO: adminOnly middleware */ productController.update);
router.delete("/:slug", /* TODO: adminOnly middleware */ productController.remove);

module.exports = router;
