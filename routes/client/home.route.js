const router = require("express").Router();

const homeController = require("../../controllers/client/home.controller.js");

router.get("/", homeController.home);
router.get("/terms-of-service", homeController.termsOfService);
router.get("/privacy-policy", homeController.privacyPolicy);

module.exports = router;
