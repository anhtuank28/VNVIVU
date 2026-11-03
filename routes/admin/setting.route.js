const router = require("express").Router();
const multer = require("multer"); //thư viện giúp upload lên các file, video, ảnh
const cloudinaryHelper = require("../../helpers/cloudinary.helper");

const upload = multer({ storage: cloudinaryHelper.storage });

const settingController = require("../../controllers/admin/setting.controller");

const authMiddleware = require("../../middlewares/admin/auth.middleware");

router.get("/list", authMiddleware.requireAuth("setting-view"), settingController.list);
router.get("/website-info", authMiddleware.requireAuth("setting-view"), settingController.websiteInfo);
router.patch("/website-info", authMiddleware.requireAuth("setting-edit"), upload.fields([
    {name:"logo", maxCount: 1},
    {name: "favicon",maxCount:1}
]), settingController.websiteInfoPatch);
router.get("/account-admin/list", authMiddleware.requireAuth("account-view"), settingController.accountAdminList);
router.get("/account-admin/create", authMiddleware.requireAuth("account-create"), settingController.accountAdminCreate);
router.post("/account-admin/create", authMiddleware.requireAuth("account-create"), upload.single("avatar"), settingController.accountAdminCreatePost);
router.get("/account-admin/edit/:id", authMiddleware.requireAuth("account-edit"), settingController.accountAdminEdit);

const roleValidate = require("../../validates/admin/role.validate");

router.get("/role/list", authMiddleware.requireAuth("role-view"), settingController.roleList);
router.get("/role/create", authMiddleware.requireAuth("role-create"), settingController.roleCreate);
router.post("/role/create", authMiddleware.requireAuth("role-create"), roleValidate.createPost, settingController.roleCreatePost);
router.patch("/account-admin/edit/:id", authMiddleware.requireAuth("account-edit"), upload.single("avatar"), settingController.accountAdminEditPatch);

router.patch("/role/delete/:id", authMiddleware.requireAuth("role-delete"), settingController.roleDelete);
router.patch("/role/change-multi", authMiddleware.requireAuth("role-edit"), settingController.roleChangeMulti);

// Trash routes
router.get("/role/trash", authMiddleware.requireAuth("role-delete"), settingController.roleTrash);
router.patch("/role/undo/:id", authMiddleware.requireAuth("role-delete"), settingController.roleUndo);
router.patch("/role/delete-destroy/:id", authMiddleware.requireAuth("role-delete"), settingController.roleDeleteDestroy);
router.patch("/role/trash/change-multi", authMiddleware.requireAuth("role-delete"), settingController.roleTrashChangeMulti);

router.get("/role/edit/:id", authMiddleware.requireAuth("role-edit"), settingController.roleEdit);
router.patch("/role/edit/:id", authMiddleware.requireAuth("role-edit"), roleValidate.createPost, settingController.roleEditPatch);


module.exports = router;
