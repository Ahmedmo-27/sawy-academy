const express = require("express");
const researchController = require("../controllers/researchController");

const router = express.Router();

router.get("/", researchController.getAll);
router.get("/:slug", researchController.getBySlug);
router.post("/", /* TODO: adminOnly middleware */ researchController.create);
router.put("/:slug", /* TODO: adminOnly middleware */ researchController.update);
router.delete("/:slug", /* TODO: adminOnly middleware */ researchController.remove);

module.exports = router;
