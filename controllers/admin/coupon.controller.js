const Coupon = require("../../models/coupon.model");

// [GET] /admin/coupon/list
module.exports.list = async (req, res) => {
    const coupons = await Coupon.find({
        deleted: false
    }).sort({ createdAt: "desc" });

    res.render("admin/pages/coupon-list", {
        pageTitle: "Quản lý mã giảm giá",
        coupons: coupons
    });
};

// [GET] /admin/coupon/create
module.exports.create = (req, res) => {
    res.render("admin/pages/coupon-create", {
        pageTitle: "Thêm mã giảm giá"
    });
};

// [POST] /admin/coupon/create
module.exports.createPost = async (req, res) => {
    try {
        const existCode = await Coupon.findOne({
            code: req.body.code,
            deleted: false
        });

        if (existCode) {
            req.flash("error", "Mã giảm giá đã tồn tại!");
            res.redirect("back");
            return;
        }

        const newCoupon = new Coupon(req.body);
        await newCoupon.save();
        
        req.flash("success", "Tạo mã giảm giá thành công!");
        res.redirect(`/${res.locals.pathAdmin}/coupon/list`);
    } catch (error) {
        req.flash("error", "Lỗi tạo mã giảm giá!");
        res.redirect("back");
    }
};

// [GET] /admin/coupon/edit/:id
module.exports.edit = async (req, res) => {
    try {
        const id = req.params.id;
        const coupon = await Coupon.findOne({
            _id: id,
            deleted: false
        });

        res.render("admin/pages/coupon-edit", {
            pageTitle: "Chỉnh sửa mã giảm giá",
            coupon: coupon
        });
    } catch (error) {
        res.redirect(`/${res.locals.pathAdmin}/coupon/list`);
    }
};

// [PATCH] /admin/coupon/edit/:id
module.exports.editPatch = async (req, res) => {
    try {
        const id = req.params.id;
        
        // Kiểm tra code có trùng với mã khác không
        const existCode = await Coupon.findOne({
            code: req.body.code,
            _id: { $ne: id },
            deleted: false
        });

        if (existCode) {
            req.flash("error", "Mã giảm giá đã tồn tại!");
            res.redirect("back");
            return;
        }

        await Coupon.updateOne({ _id: id }, req.body);
        req.flash("success", "Cập nhật thành công!");
        res.redirect("back");
    } catch (error) {
        req.flash("error", "Cập nhật thất bại!");
        res.redirect("back");
    }
};

// [DELETE] /admin/coupon/delete/:id
module.exports.deleteItem = async (req, res) => {
    try {
        const id = req.params.id;
        await Coupon.updateOne({ _id: id }, {
            deleted: true,
            deletedAt: new Date()
        });
        res.json({ code: "success" });
    } catch (error) {
        res.json({ code: "error" });
    }
};
