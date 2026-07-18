const express = require("express");
const homePageController = require("../controllers/homePageController");

const router = express.Router();

router.get("/", homePageController.get);
router.put("/", /* TODO: adminOnly middleware */ homePageController.update);
router.patch("/reorder", /* TODO: adminOnly middleware */ homePageController.reorder);
router.post("/sections", /* TODO: adminOnly middleware */ homePageController.createSection);
router.put("/sections/:id", /* TODO: adminOnly middleware */ homePageController.updateSection);
router.delete("/sections/:id", /* TODO: adminOnly middleware */ homePageController.removeSection);
router.post("/reset", /* TODO: adminOnly middleware */ homePageController.reset);

module.exports = router;
