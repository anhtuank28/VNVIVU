const router = require("express").Router();

const userController = require("../../controllers/admin/user.controller");

const authMiddleware = require("../../middlewares/admin/auth.middleware");

router.get("/list", authMiddleware.requireAuth("user-view"), userController.list);

module.exports = router;
