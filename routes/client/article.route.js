const express = require("express");
const router = express.Router();

const articleController = require("../../controllers/client/article.controller");

router.get("/", articleController.index);
router.get("/:slug", articleController.detail);

module.exports = router;
