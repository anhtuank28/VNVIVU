const router = require("express").Router();
const multer = require("multer"); //thư viện giúp upload lên các file, video, ảnh
const categoryController = require("../../controllers/admin/category.controller");

const cloudinaryHelper = require("../../helpers/cloudinary.helper");

const categoryValidate = require("../../validates/admin/category.validate")

const upload = multer({ storage: cloudinaryHelper.storage });


const authMiddleware = require("../../middlewares/admin/auth.middleware");

router.get("/list", authMiddleware.requireAuth("category-view"), categoryController.list);
router.get("/create", authMiddleware.requireAuth("category-create"), categoryController.create);
router.post("/create", authMiddleware.requireAuth("category-create"), upload.single("avatar"), categoryValidate.createPost, categoryController.createPost);
router.get("/edit/:id", authMiddleware.requireAuth("category-edit"), categoryController.edit)
router.patch("/edit/:id", authMiddleware.requireAuth("category-edit"), upload.single("avatar"), categoryValidate.createPost, categoryController.editPatch)
router.patch("/delete/:id", authMiddleware.requireAuth("category-delete"), categoryController.deletePatch)
router.patch("/change-multi", authMiddleware.requireAuth("category-edit"), categoryController.changeMultiPatch)
module.exports = router;
