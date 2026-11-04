const User = require("../../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// [GET] /auth/register
module.exports.register = async (req, res) => {
  res.render("client/pages/auth/register", {
    pageTitle: "Đăng ký tài khoản",
  });
};

// [POST] /auth/register
module.exports.registerPost = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    const existEmail = await User.findOne({ email: email, deleted: false });

    if (existEmail) {
      res.json({
        code: "error",
        message: "Email đã tồn tại!",
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      fullName: fullName,
      email: email,
      password: hashedPassword,
      phone: phone,
    });

    await user.save();

    // Tự động đăng nhập sau khi đăng ký
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.cookie("tokenUser", token);

    res.json({
      code: "success",
      message: "Đăng ký tài khoản thành công!",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi hệ thống, vui lòng thử lại sau!",
    });
  }
};

// [GET] /auth/login
module.exports.login = async (req, res) => {
  res.render("client/pages/auth/login", {
    pageTitle: "Đăng nhập",
  });
};

// [POST] /auth/login
module.exports.loginPost = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email,
      deleted: false,
    });

    if (!user) {
      res.json({
        code: "error",
        message: "Tài khoản không chính xác!",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.json({
        code: "error",
        message: "Tài khoản không chính xác!",
      });
      return;
    }

    if (user.status !== "active") {
      res.json({
        code: "error",
        message: "Tài khoản của bạn đã bị khóa!",
      });
      return;
    }

    // Tạo JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    
    res.cookie("tokenUser", token);

    res.json({
      code: "success",
      message: "Đăng nhập thành công!",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Lỗi hệ thống, vui lòng thử lại sau!",
    });
  }
};

// [GET] /auth/logout
module.exports.logout = async (req, res) => {
  res.clearCookie("tokenUser");
  req.flash("success", "Đăng xuất thành công!");
  res.redirect("/");
};
