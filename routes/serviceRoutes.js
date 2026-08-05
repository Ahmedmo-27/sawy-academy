const express = require("express");
const serviceController = require("../controllers/serviceController");
const {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", optionalAuthenticate, serviceController.create);
router.get("/", authenticate, serviceController.getAll);
router.get("/:id", authenticate, serviceController.getById);
router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  serviceController.updateStatus
);

module.exports = router;
