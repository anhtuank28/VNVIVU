const router = require("express").Router();
const multer = require("multer"); //thư viện giúp upload lên các file, video, ảnh
const cloudinaryHelper = require("../../helpers/cloudinary.helper");

const upload = multer({ storage: cloudinaryHelper.storage });

const tourController = require("../../controllers/admin/tour.controller");

const tourValidate = require("../../validates/admin/tour.validate");
const authMiddleware = require("../../middlewares/admin/auth.middleware");

router.get("/list", authMiddleware.requireAuth("tour-view"), tourController.list);
router.get("/create", authMiddleware.requireAuth("tour-create"), tourController.create);
router.post("/create", authMiddleware.requireAuth("tour-create"), upload.none(), tourValidate.createPost, tourController.createPost);
router.get("/trash", authMiddleware.requireAuth("tour-delete"), tourController.trash);
router.get("/edit/:id", authMiddleware.requireAuth("tour-edit"), tourController.edit);
router.patch("/delete/:id", authMiddleware.requireAuth("tour-delete"), tourController.deletePatch);
router.patch("/edit/:id", authMiddleware.requireAuth("tour-edit"), upload.none(), tourValidate.createPost, tourController.editPatch);

router.patch("/change-multi", authMiddleware.requireAuth("tour-edit"), tourController.changeMultiPatch);
router.patch("/trash/change-multi", authMiddleware.requireAuth("tour-delete"), tourController.trashChangeMultiPatch);
router.patch("/undo/:id", authMiddleware.requireAuth("tour-delete"), tourController.undoPatch);
router.patch("/delete-destroy/:id", authMiddleware.requireAuth("tour-delete"), tourController.deleteDestroyPatch);
module.exports = router;
