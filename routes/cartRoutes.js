const express = require("express");
const cartController = require("../controllers/cartController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticate, cartController.getCart);
router.put("/", authenticate, cartController.putCart);

module.exports = router;
