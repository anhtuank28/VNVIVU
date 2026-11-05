const router = require("express").Router();
const chatController = require("../../controllers/client/chat.controller");

router.post("/message", chatController.postMessage);
router.get("/suggestions", chatController.getSuggestions);

module.exports = router;
