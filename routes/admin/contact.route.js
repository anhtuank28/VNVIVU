const router = require("express").Router();

const contactController = require("../../controllers/admin/contact.controller");

const authMiddleware = require("../../middlewares/admin/auth.middleware");

router.get("/list", authMiddleware.requireAuth("contact-view"), contactController.list);

router.get("/send", authMiddleware.requireAuth("contact-view"), contactController.sendMail);
router.post("/send", authMiddleware.requireAuth("contact-view"), contactController.sendMailPost);

module.exports = router;
