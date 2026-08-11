const express = require("express");
const faqController = require("../controllers/faqController");
const {
  authenticate,
  requireAdmin,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();
const adminWrite = [authenticate, requireDevice, requireAdmin];

router.get("/", faqController.getAll);
router.patch("/reorder", adminWrite, faqController.reorder);
router.get("/:id", faqController.getById);
router.post("/", adminWrite, faqController.create);
router.put("/:id", adminWrite, faqController.update);
router.delete("/:id", adminWrite, faqController.remove);

module.exports = router;
