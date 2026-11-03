const router = require("express").Router();
const accountRoutes = require("./account.route");
const dashboardRoutes = require("./dashboard.route");
const categoryRoutes = require("./category.route");
const tourRoutes = require("./tour.route");
const orderRoutes = require("./order.route");
const userRoutes = require("./user.route");
const contactRoutes = require("./contact.route");
const settingRoutes = require("./setting.route");
const profileRoutes = require("./profile.route");
const articleRoutes = require("./article.route");

const authMiddleware=require("../../middlewares/admin/auth.middleware");

// Redirect root to dashboard
router.get("/", (req, res) => {
  res.redirect(`/${require("../../config/variable").pathAdmin}/dashboard`);
});


router.use((req,res,next)=>{
  res.setHeader("Cache-control","no-store")
  next();
})

router.use("/account", accountRoutes);
router.use("/dashboard",authMiddleware.verityToken ,dashboardRoutes);
router.use("/category",authMiddleware.verityToken, categoryRoutes);
router.use("/tour",authMiddleware.verityToken, tourRoutes);
router.use("/order",authMiddleware.verityToken, orderRoutes);
router.use("/coupon",authMiddleware.verityToken, require("./coupon.route"));
router.use("/user",authMiddleware.verityToken, userRoutes);
router.use("/contact",authMiddleware.verityToken, contactRoutes);
router.use("/setting",authMiddleware.verityToken, settingRoutes);
router.use("/profile",authMiddleware.verityToken, profileRoutes);
router.use("/article",authMiddleware.verityToken, articleRoutes);

const uploadRoutes = require("./upload.route");
router.use("/upload", authMiddleware.verityToken, uploadRoutes);

router.use((req, res) => {
  res.status(404).send("404 Not Found");
});
module.exports = router;
