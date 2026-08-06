const express = require("express");
const userController = require("../controllers/userController");
const {
  authenticate,
  requireAdmin,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();
const studentAuth = [authenticate, requireDevice];
const adminAuth = [authenticate, requireDevice, requireAdmin];

router.get("/me", ...studentAuth, userController.getMe);
router.put("/me", ...studentAuth, userController.updateMe);
router.put("/me/password", ...studentAuth, userController.changePassword);

router.use(...adminAuth);

router.get("/", userController.getAll);
router.get("/:id", userController.getById);
router.post("/", userController.create);
router.put("/:id", userController.update);
router.delete("/:id", userController.remove);

module.exports = router;
