const express = require("express");
const orderController = require("../controllers/orderController");
const {
  authenticate,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, orderController.create);
router.get("/", authenticate, orderController.getAll);
router.get("/:id", authenticate, orderController.getById);
router.patch(
  "/:id/approve",
  authenticate,
  requireAdmin,
  orderController.approve
);
router.patch(
  "/:id/reject",
  authenticate,
  requireAdmin,
  orderController.reject
);

module.exports = router;
