const express = require("express");
const homePageController = require("../controllers/homePageController");
const {
  authenticate,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();
const adminWrite = [authenticate, requireAdmin];

router.get("/", homePageController.get);
router.put("/", adminWrite, homePageController.update);
router.patch("/reorder", adminWrite, homePageController.reorder);
router.post("/sections", adminWrite, homePageController.createSection);
router.put("/sections/:id", adminWrite, homePageController.updateSection);
router.delete("/sections/:id", adminWrite, homePageController.removeSection);
router.post("/reset", adminWrite, homePageController.reset);

module.exports = router;
