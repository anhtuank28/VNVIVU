const router = require("express").Router();

const searchController = require("../../controllers/client/search.controller.js");

router.get("/", searchController.list);
module.exports = router;
