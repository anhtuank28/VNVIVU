const categoryHelper = require("../../helpers/category.helper");
const Category = require("../../models/category.model");
const City = require("../../models/city.model");
const Tour = require("../../models/tour.model");
const AccountAdmin = require("../../models/account-admin.model");
const moment = require("moment");

module.exports.list = async (req, res) => {
  const find = {
    deleted: false
  };

  // Lọc theo trạng thái
  if (req.query.status) {
    find.status = req.query.status;
  }

  // Lọc theo người tạo
  if (req.query.createdBy) {
    find.createdBy = req.query.createdBy;
  }

  // Lọc theo ngày tạo
  const dateFilter = {};
  if (req.query.startDate) {
    const startDate = moment(req.query.startDate).startOf("date").toDate();
    dateFilter.$gte = startDate;
  }
  if (req.query.endDate) {
    const endDate = moment(req.query.endDate).endOf("date").toDate();
    dateFilter.$lte = endDate;
  }
  if (Object.keys(dateFilter).length > 0) {
    find.createdAt = dateFilter;
  }

  // Tìm kiếm
  if (req.query.keyword) {
    const slugify = require("slugify");
    const keyword = slugify(req.query.keyword, { lower: true });
    const keywordRegex = new RegExp(keyword);
    find.slug = keywordRegex;
  }

  // Lọc theo mức giá
  if (req.query.price) {
    const priceParts = req.query.price.split("-");
    const priceFilter = {};
    if (priceParts[0]) {
      priceFilter.$gte = parseInt(priceParts[0]);
    }
    if (priceParts[1]) {
      priceFilter.$lte = parseInt(priceParts[1]);
    }
    if (Object.keys(priceFilter).length > 0) {
      find.priceNewAdult = priceFilter;
    }
  }

  // Phân trang
  const limitItems = 5;
  let page = 1;
  if (req.query.page) {
    const currentPage = parseInt(req.query.page);
    if (currentPage > 0) {
      page = currentPage;
    }
  }
  const totalRecord = await Tour.countDocuments(find);
  const totalPage = Math.max(1, Math.ceil(totalRecord / limitItems));
  if (page > totalPage) {
    page = totalPage;
  }
  const skip = (page - 1) * limitItems;
  const pagination = {
    skip: skip,
    totalRecord: totalRecord,
    totalPage: totalPage,
    currentPage: page
  };

  const tourList = await Tour.find(find).sort({
    position: "asc"
  }).limit(limitItems).skip(skip);

  for (const item of tourList) {
    if (item.createdBy) {
      const infoAccountCreated = await AccountAdmin.findOne({
        _id: item.createdBy
      });
      if (infoAccountCreated) {
        item.createdByFullName = infoAccountCreated.fullName;
      }
    }
    if (item.updatedBy) {
      const infoAccountUpdated = await AccountAdmin.findOne({
        _id: item.updatedBy
      });
      if (infoAccountUpdated) {
        item.updatedByFullName = infoAccountUpdated.fullName;
      }
    }

    item.createdAtFormat = moment(item.createdAt).format("HH:mm - DD/MM/YYYY");
    item.updatedAtFormat = moment(item.updatedAt).format("HH:mm - DD/MM/YYYY");
  }

  // Danh sách tài khoản quản trị
  const accountAdminList = await AccountAdmin.find({}).select("id fullName");

  res.render("admin/pages/tour-list", {
    pageTitle: "Quản lý tour",
    tourList: tourList,
    accountAdminList: accountAdminList,
    pagination: pagination
  });
};
module.exports.create = async (req, res) => {
  const categoryList = await Category.find({
    deleted: false
  })


  const categoryTree = categoryHelper.buildCategoryTree(categoryList);

  const cityList = await City.find({ deleted: false });

  res.render("admin/pages/tour-create", {
    pageTitle: "tạo tour",
    categoryList: categoryTree,
    cityList: cityList
  });
};

module.exports.createPost = async (req, res) => {
  if (req.body.position) {
    req.body.position = parseInt(req.body.position);
  } else {
    const totalRecord = await Tour.countDocuments({});
    req.body.position = totalRecord + 1;
  }

  req.body.createdBy = req.account.id;
  req.body.updatedBy = req.account.id;
  
  if (!req.body.avatar) {
    req.body.avatar = "";
  }
  
  if (req.body.images) {
    // If multiple images, body.images might be an array. If one, it might be a string.
    req.body.images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
  } else {
    req.body.images = [];
  }

  req.body.priceAdult = req.body.priceAdult ? parseInt(req.body.priceAdult) : 0;
  req.body.priceChildren = req.body.priceChildren ? parseInt(req.body.priceChildren) : 0;
  req.body.priceBaby = req.body.priceBaby ? parseInt(req.body.priceBaby) : 0;

  req.body.priceNewAdult = req.body.priceNewAdult ? parseInt(req.body.priceNewAdult) : req.body.priceAdult;
  req.body.priceNewChildren = req.body.priceNewChildren ? parseInt(req.body.priceNewChildren) : req.body.priceChildren;
  req.body.priceNewBaby = req.body.priceNewBaby ? parseInt(req.body.priceNewBaby) : req.body.priceBaby;

  req.body.stockAdult = req.body.stockAdult ? parseInt(req.body.stockAdult) : 0;
  req.body.stockChildren = req.body.stockChildren ? parseInt(req.body.stockChildren) : 0;
  req.body.stockBaby = req.body.stockBaby ? parseInt(req.body.stockBaby) : 0;

  req.body.locations = Array.isArray(req.body.locations) ? req.body.locations : (req.body.locations ? JSON.parse(req.body.locations) : []);
  req.body.departureDate = req.body.departureDate ? new Date(req.body.departureDate) : null;
  req.body.schedules = Array.isArray(req.body.schedules) ? req.body.schedules : (req.body.schedules ? JSON.parse(req.body.schedules) : []);
  req.body.isFeatured = req.body.isFeatured === "true";


  const newRecord = new Tour(req.body);
  await newRecord.save();

  req.flash("success", "Tạo tour thành công")

  res.json({
    code: "success",
    message: "Tạo tour thành công"
  })
}
module.exports.editPatch = async (req, res) => {
  try{
    const id=req.params.id;
  if (req.body.position) {
    req.body.position = parseInt(req.body.position);
  } else {
    const totalRecord = await Tour.countDocuments({});
    req.body.position = totalRecord + 1;
  }

  req.body.updatedBy = req.account.id;
   if (!req.body.avatar) {
      delete req.body.avatar;
    }

    if (req.body.images) {
      req.body.images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    } else {
      req.body.images = [];
    }

  req.body.priceAdult = req.body.priceAdult ? parseInt(req.body.priceAdult) : 0;
  req.body.priceChildren = req.body.priceChildren ? parseInt(req.body.priceChildren) : 0;
  req.body.priceBaby = req.body.priceBaby ? parseInt(req.body.priceBaby) : 0;

  req.body.priceNewAdult = req.body.priceNewAdult ? parseInt(req.body.priceNewAdult) : req.body.priceAdult;
  req.body.priceNewChildren = req.body.priceNewChildren ? parseInt(req.body.priceNewChildren) : req.body.priceChildren;
  req.body.priceNewBaby = req.body.priceNewBaby ? parseInt(req.body.priceNewBaby) : req.body.priceBaby;

  req.body.stockAdult = req.body.stockAdult ? parseInt(req.body.stockAdult) : 0;
  req.body.stockChildren = req.body.stockChildren ? parseInt(req.body.stockChildren) : 0;
  req.body.stockBaby = req.body.stockBaby ? parseInt(req.body.stockBaby) : 0;

  req.body.locations = Array.isArray(req.body.locations) ? req.body.locations : (req.body.locations ? JSON.parse(req.body.locations) : []);
  req.body.departureDate = req.body.departureDate ? new Date(req.body.departureDate) : null;
  req.body.schedules = Array.isArray(req.body.schedules) ? req.body.schedules : (req.body.schedules ? JSON.parse(req.body.schedules) : []);
  req.body.isFeatured = req.body.isFeatured === "true";

    await Tour.updateOne({
      _id:id,
      deleted:false
    }, req.body);

    req.flash("success","sua tour thanh cong")

  res.json({
    code: "success",
  })
  }
  catch(error){
    res.json({
      code:"error",
      message:"Id khong hop le"
    })
  }
  
}
module.exports.trash = async (req, res) => {
  const find = {
    deleted: true
  };

  // Lọc theo trạng thái
  if (req.query.status) {
    find.status = req.query.status;
  }

  // Lọc theo người tạo
  if (req.query.createdBy) {
    find.createdBy = req.query.createdBy;
  }

  // Lọc theo ngày tạo
  const dateFilter = {};
  if (req.query.startDate) {
    const startDate = moment(req.query.startDate).startOf("date").toDate();
    dateFilter.$gte = startDate;
  }
  if (req.query.endDate) {
    const endDate = moment(req.query.endDate).endOf("date").toDate();
    dateFilter.$lte = endDate;
  }
  if (Object.keys(dateFilter).length > 0) {
    find.createdAt = dateFilter;
  }

  // Tìm kiếm
  if (req.query.keyword) {
    const slugify = require("slugify");
    const keyword = slugify(req.query.keyword, { lower: true });
    const keywordRegex = new RegExp(keyword);
    find.slug = keywordRegex;
  }

  // Lọc theo mức giá
  if (req.query.price) {
    const priceParts = req.query.price.split("-");
    const priceFilter = {};
    if (priceParts[0]) {
      priceFilter.$gte = parseInt(priceParts[0]);
    }
    if (priceParts[1]) {
      priceFilter.$lte = parseInt(priceParts[1]);
    }
    if (Object.keys(priceFilter).length > 0) {
      find.priceNewAdult = priceFilter;
    }
  }

  // Phân trang
  const limitItems = 5;
  let page = 1;
  if (req.query.page) {
    const currentPage = parseInt(req.query.page);
    if (currentPage > 0) {
      page = currentPage;
    }
  }
  const totalRecord = await Tour.countDocuments(find);
  const totalPage = Math.max(1, Math.ceil(totalRecord / limitItems));
  if (page > totalPage) {
    page = totalPage;
  }
  const skip = (page - 1) * limitItems;
  const pagination = {
    skip: skip,
    totalRecord: totalRecord,
    totalPage: totalPage,
    currentPage: page
  };

  const tourList = await Tour.find(find).sort({
    deletedAt: "desc"
  }).limit(limitItems).skip(skip);

  for (const item of tourList) {
    if (item.createdBy) {
      const infoAccountCreated = await AccountAdmin.findOne({
        _id: item.createdBy
      });
      if (infoAccountCreated) {
        item.createdByFullName = infoAccountCreated.fullName;
      }
    }
    if (item.deletedBy) {
      const infoAccountDeleted = await AccountAdmin.findOne({
        _id: item.deletedBy
      });
        item.deletedByFullName = infoAccountDeleted.fullName;
      
    }

    item.createdAtFormat = moment(item.createdAt).format("HH:mm - DD/MM/YYYY");
    item.deletedAtFormat = moment(item.deletedAt).format("HH:mm - DD/MM/YYYY");
  }

  res.render("admin/pages/tour-trash", {
    pageTitle: "thùng rác tour",
    tourList:tourList,
    pagination: pagination
  });
};

module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id;
    const tourDetail = await Tour.findOne({
      _id: id,
      deleted: false
    });

    if (tourDetail) {
      tourDetail.departureDateFormat = moment(tourDetail.departureDate).format("YYYY-MM-DD");
    
      const categoryList = await Category.find({
        deleted: false
      });
      const categoryTree = categoryHelper.buildCategoryTree(categoryList);

      const cityList = await City.find({ deleted: false });
      res.render("admin/pages/tour-edit", {
        pageTitle: "Chỉnh sửa tour",
        categoryList: categoryTree,
        cityList: cityList,
        tourDetail: tourDetail
      });
    } else {
      res.redirect(`/${pathAdmin}/tour/list`);
    }
  } catch(err) {
    console.log(err);
    res.redirect(`/${pathAdmin}/tour/list`);
  }
};

module.exports.deletePatch = async (req, res) => {
  try {
    const id = req.params.id;

    await Tour.updateOne({
      _id: id
    }, {
      deleted: true,
      deletedBy: req.account.id,
      deletedAt: Date.now()
    });

    req.flash('success', "Xoá tour thành công");

    res.json({
      code: 'success'
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Id không hợp lệ"
    });
  }
};
module.exports.deleteDestroyPatch = async (req, res) => {
  try {
    const id = req.params.id;

    await Tour.deleteOne({
      _id: id
    }, 
    );

    req.flash('success', "Xoá tour thành công");

    res.json({
      code: 'success'
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Id không hợp lệ"
    });
  }
};
module.exports.undoPatch = async (req, res) => {
  try {
    const id = req.params.id;

    await Tour.updateOne({
      _id: id
    }, {
      deleted: false,
    });

    req.flash('success', "khôi phục thành công tour thành công");

    res.json({
      code: 'success'
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Id không hợp lệ"
    });
  }
};

module.exports.trashChangeMultiPatch = async (req, res) => {
  try {
    const { option, ids } = req.body;

    switch (option) {
      case "undo":
        await Tour.updateMany({
          _id: { $in: ids }
        }, {
          deleted: false
        });
        req.flash("success", "Khôi phục thành công");
        break;
      case "delete-destroy":
        await Tour.deleteMany({
          _id: { $in: ids }
        });
        req.flash("success", "Xoá thành công");
        break;
    }

    res.json({
      code: "success"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Id không tồn tại trong hệ thống"
    });
  }
};

module.exports.changeMultiPatch = async (req, res) => {
  try {
    const { option, ids } = req.body;

    switch (option) {
      case "active":
      case "inactive":
        await Tour.updateMany({
          _id: { $in: ids }
        }, {
          status: option
        });
        req.flash("success", "Đổi trạng thái thành công");
        break;
      case "featured-true":
      case "featured-false":
        const isFeatured = option === "featured-true";
        await Tour.updateMany({
          _id: { $in: ids }
        }, {
          isFeatured: isFeatured
        });
        req.flash("success", "Cập nhật hiển thị nổi bật thành công");
        break;
      case "delete":
        await Tour.updateMany({
          _id: { $in: ids }
        }, {
          deleted: true,
          deletedBy: req.account.id,
          deletedAt: Date.now()
        });
        req.flash("success", "Xoá thành công");
        break;
    }

    res.json({
      code: "success"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Id không tồn tại trong hệ thống"
    });
  }
};