module.exports.list = async (req, res) => {
  res.render("admin/pages/user-list", {
    pageTitle: "quản lý người dùng",
  });
};
