const express = require("express");
const siteSettingsController = require("../controllers/siteSettingsController");

const router = express.Router();

router.get("/", siteSettingsController.get);
router.put("/", /* TODO: adminOnly middleware */ siteSettingsController.update);
router.post("/reset", /* TODO: adminOnly middleware */ siteSettingsController.reset);

module.exports = router;
