const express = require("express");
const userController = require("../controllers/userController");
const {
  authenticate,
  requireAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", authenticate, userController.getMe);
router.put("/me", authenticate, userController.updateMe);
router.put("/me/password", authenticate, userController.changePassword);

router.use(authenticate, requireAdmin);

router.get("/", userController.getAll);
router.get("/:id", userController.getById);
router.post("/", userController.create);
router.put("/:id", userController.update);
router.delete("/:id", userController.remove);

module.exports = router;
