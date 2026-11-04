const router = require("express").Router();
const multer = require("multer");
const cloudinaryHelper = require("../../helpers/cloudinary.helper");
const authMiddleware = require("../../middlewares/client/auth.middleware");
const tourController = require("../../controllers/client/tour.controller.js");

const upload = multer({ storage: cloudinaryHelper.storage });

router.get("/detail/:slug", tourController.detail);

// [POST] /tour/review/:tourId
router.post(
  "/review/:tourId",
  authMiddleware.requireAuth,
  upload.array("images", 5),
  tourController.reviewPost
);

module.exports = router;
