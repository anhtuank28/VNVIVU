const Tour = require("../../models/tour.model");
const Category = require("../../models/category.model");

module.exports.home = async (req, res) => {
  try {
    const featuredTours = await Tour.find({ deleted: false, status: "active", isFeatured: true })
        .sort({ position: "desc" })
        .limit(4);

    const getToursByParentCategoryName = async (parentName) => {
      const parentCat = await Category.findOne({ name: parentName, deleted: false, status: "active" });
      if (!parentCat) return [];

      const childCats = await Category.find({ parent: parentCat._id.toString(), deleted: false, status: "active" });
      const childCatIds = childCats.map(cat => cat._id.toString());

      const tours = await Tour.find({
        category: { $in: childCatIds },
        deleted: false,
        status: "active",
        isFeatured: true
      }).limit(4);

      return tours;
    };

    const domesticTours = await getToursByParentCategoryName("Tour Trong Nước");
    const internationalTours = await getToursByParentCategoryName("Tour Nước Ngoài");

    const Article = require("../../models/article.model");
    const recentArticles = await Article.find({ deleted: false, status: "active" })
      .sort({ position: "asc" })
      .limit(5);

    res.render("client/pages/home.pug", {
      pageTitle: "Trang chủ",
      tourListSection2: featuredTours,
      tourListSection4: domesticTours,
      tourListSection5: internationalTours,
      recentArticles: recentArticles,
      isHome: true
    });
  } catch (error) {
    console.error(error);
    res.redirect("back");
  }
};
module.exports.termsOfService = (req, res) => {
  res.render("client/pages/terms-of-service.pug");
};

module.exports.privacyPolicy = (req, res) => {
  res.render("client/pages/privacy-policy.pug");
};
