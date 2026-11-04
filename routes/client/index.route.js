const router = require("express").Router();
const tourRoutes = require("./tour.route");
const homeRoutes = require("./home.route");
const cartRoutes = require("./cart.route");
const contactRouters = require("./contact.route");
const categoryRouters = require("./category.route");
const searchRouters = require("./search.route");
const orderRouters = require("./order.route");
const articleRoutes = require("./article.route");
const chatRoutes = require("./chat.route");

const settingMiddleWare = require("../../middlewares/client/setting.middleware");
const categoryMiddleWare = require("../../middlewares/client/category.middleware");
const authMiddleWare = require("../../middlewares/client/auth.middleware");

router.use(settingMiddleWare.websiteInfo);
router.use(categoryMiddleWare.list);
router.use(authMiddleWare.userInfo);

router.use("/", homeRoutes);
router.use("/auth", require("./auth.route"));

router.use("/tour", tourRoutes);
router.use("/cart", cartRoutes);
router.use("/contact", contactRouters);
router.use("/category", categoryRouters);
router.use("/search", searchRouters);
router.use("/order", orderRouters);
router.use("/article", articleRoutes);
router.use("/chat", chatRoutes);

module.exports = router;
