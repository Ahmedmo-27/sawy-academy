const express = require("express");
const courseController = require("../controllers/courseController");

const router = express.Router();

router.get("/", courseController.getAll);
router.get("/groups", courseController.getGroups);
router.get("/:slug", courseController.getBySlug);
router.post("/", /* TODO: adminOnly middleware */ courseController.create);
router.put("/:slug", /* TODO: adminOnly middleware */ courseController.update);
router.delete("/:slug", /* TODO: adminOnly middleware */ courseController.remove);

module.exports = router;
