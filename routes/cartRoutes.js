const express = require("express");
const cartController = require("../controllers/cartController");
const {
  authenticate,
  requireDevice,
} = require("../middleware/authMiddleware");

const router = express.Router();
const studentAuth = [authenticate, requireDevice];

router.get("/", ...studentAuth, cartController.getCart);
router.put("/", ...studentAuth, cartController.putCart);

module.exports = router;
