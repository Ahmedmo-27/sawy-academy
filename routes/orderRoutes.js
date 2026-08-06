const express = require("express");
const orderController = require("../controllers/orderController");
const {
  authenticate,
  requireAdmin,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();
const studentAuth = [authenticate, requireDevice];
const adminWrite = [authenticate, requireDevice, requireAdmin];

router.post("/", ...studentAuth, orderController.create);
router.get("/", ...studentAuth, orderController.getAll);
router.get("/:id", ...studentAuth, orderController.getById);
router.patch("/:id/approve", ...adminWrite, orderController.approve);
router.patch("/:id/reject", ...adminWrite, orderController.reject);

module.exports = router;
