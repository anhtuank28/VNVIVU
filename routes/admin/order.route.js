const router = require("express").Router();

const orderController = require("../../controllers/admin/order.controller");

const authMiddleware = require("../../middlewares/admin/auth.middleware");

router.get("/list", authMiddleware.requireAuth("order-view"), orderController.list);
router.get("/edit/:id", authMiddleware.requireAuth("order-edit"), orderController.edit);
router.patch("/edit/:id",authMiddleware.requireAuth("order-edit"), orderController.editPatch)
module.exports = router;
