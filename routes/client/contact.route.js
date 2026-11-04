const router = require("express").Router();

const contactController=require("../../controllers/client/contact.controller");
router.get("/", contactController.show);
router.post("/create", contactController.createPost);
module.exports=router;