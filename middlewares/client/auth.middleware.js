const jwt = require("jsonwebtoken");
const User = require("../../models/user.model");

module.exports.userInfo = async (req, res, next) => {
  if (req.cookies.tokenUser) {
    try {
      const decoded = jwt.verify(req.cookies.tokenUser, process.env.JWT_SECRET);
      const user = await User.findOne({
        _id: decoded.id,
        deleted: false,
        status: "active"
      }).select("-password");

      if (user) {
        res.locals.user = user;
      }
    } catch (error) {
      // Invalid token, do nothing
    }
  }
  next();
};

module.exports.requireAuth = async (req, res, next) => {
  const isAjax = req.xhr || (req.headers.accept && req.headers.accept.includes("json")) || req.headers["x-requested-with"] === "XMLHttpRequest";

  if (!req.cookies.tokenUser) {
    if (isAjax) {
      return res.status(401).json({ code: "error", message: "Vui lòng đăng nhập để tiếp tục." });
    }
    res.redirect("/auth/login");
    return;
  }

  try {
    const decoded = jwt.verify(req.cookies.tokenUser, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.id,
      deleted: false,
      status: "active"
    });

    if (!user) {
      res.clearCookie("tokenUser");
      if (isAjax) {
        return res.status(401).json({ code: "error", message: "Tài khoản không tồn tại hoặc đã bị khóa." });
      }
      res.redirect("/auth/login");
      return;
    }

    req.user = user; // Attach for the next handlers
    res.locals.user = user;
    next();
  } catch (error) {
    res.clearCookie("tokenUser");
    if (isAjax) {
      return res.status(401).json({ code: "error", message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." });
    }
    res.redirect("/auth/login");
  }
};
