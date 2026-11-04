const router = require("express").Router();
const categoryController=require("../../controllers/client/category.controller");

router.get("/all", categoryController.listAll);
router.get("/:slug",categoryController.list);

module.exports=router;