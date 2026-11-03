const router = require("express").Router();
const multer = require("multer"); 
const cloudinaryHelper = require("../../helpers/cloudinary.helper");

const upload = multer({ storage: cloudinaryHelper.storage });

const articleController = require("../../controllers/admin/article.controller");
const articleValidate = require("../../validates/admin/article.validate");


router.get("/list", articleController.list);

router.get("/create", articleController.create);
router.post("/create", upload.none(), articleValidate.createPost, articleController.createPost);

router.get("/edit/:id", articleController.edit);
router.patch("/edit/:id", upload.none(), articleValidate.createPost, articleController.editPatch);

router.patch("/change-multi", articleController.changeMultiPatch);

router.get("/trash", articleController.trash);
router.patch("/delete/:id", articleController.deletePatch);

router.patch("/trash/change-multi", articleController.trashChangeMultiPatch);
router.patch("/undo/:id", articleController.undoPatch);
router.patch("/delete-destroy/:id", articleController.deleteDestroyPatch);

module.exports = router;
