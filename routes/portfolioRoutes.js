const express = require("express");
const projectController = require("../controllers/projectController");

const router = express.Router();

router.get("/", projectController.getAll);
router.patch("/reorder", /* TODO: adminOnly middleware */ projectController.reorder);
router.get("/:slug", projectController.getBySlug);
router.post("/", /* TODO: adminOnly middleware */ projectController.create);
router.put("/:slug", /* TODO: adminOnly middleware */ projectController.update);
router.delete("/:slug", /* TODO: adminOnly middleware */ projectController.remove);

module.exports = router;
