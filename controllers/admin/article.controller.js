const Article = require("../../models/article.model");
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

  // Tìm kiếm
  if (req.query.keyword) {
    const slugify = require("slugify");
    const keyword = slugify(req.query.keyword, { lower: true });
    const keywordRegex = new RegExp(keyword);
    find.slug = keywordRegex;
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
  const totalRecord = await Article.countDocuments(find);
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

  const articleList = await Article.find(find).sort({
    position: "asc"
  }).limit(limitItems).skip(skip);

  for (const item of articleList) {
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

  const accountAdminList = await AccountAdmin.find({}).select("id fullName");

  res.render("admin/pages/article-list", {
    pageTitle: "Quản lý tin tức",
    articleList: articleList,
    accountAdminList: accountAdminList,
    pagination: pagination
  });
};

module.exports.create = async (req, res) => {
  res.render("admin/pages/article-create", {
    pageTitle: "Thêm mới tin tức"
  });
};

module.exports.createPost = async (req, res) => {
  if (req.body.position) {
    req.body.position = parseInt(req.body.position);
  } else {
    const totalRecord = await Article.countDocuments({});
    req.body.position = totalRecord + 1;
  }

  req.body.createdBy = req.account.id;
  req.body.updatedBy = req.account.id;
  
  if (!req.body.avatar) {
    req.body.avatar = "";
  }

  const newRecord = new Article(req.body);
  await newRecord.save();

  req.flash("success", "Tạo bài viết thành công");

  res.json({
    code: "success",
    message: "Tạo bài viết thành công"
  });
}

module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id;
    const articleDetail = await Article.findOne({
      _id: id,
      deleted: false
    });

    if (articleDetail) {
      res.render("admin/pages/article-edit", {
        pageTitle: "Chỉnh sửa tin tức",
        articleDetail: articleDetail
      });
    } else {
      res.redirect(`/${pathAdmin}/article/list`);
    }
  } catch(err) {
    res.redirect(`/${pathAdmin}/article/list`);
  }
};

module.exports.editPatch = async (req, res) => {
  try{
    const id = req.params.id;
    if (req.body.position) {
      req.body.position = parseInt(req.body.position);
    }

    req.body.updatedBy = req.account.id;
    if (!req.body.avatar) {
      delete req.body.avatar;
    }

    await Article.updateOne({
      _id: id,
      deleted: false
    }, req.body);

    req.flash("success", "Sửa bài viết thành công");

    res.json({
      code: "success",
    });
  }
  catch(error){
    res.json({
      code: "error",
      message: "Id không hợp lệ"
    });
  }
}

module.exports.trash = async (req, res) => {
  const find = {
    deleted: true
  };

  // Phân trang
  const limitItems = 5;
  let page = 1;
  if (req.query.page) {
    const currentPage = parseInt(req.query.page);
    if (currentPage > 0) {
      page = currentPage;
    }
  }
  const totalRecord = await Article.countDocuments(find);
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

  const articleList = await Article.find(find).sort({
    deletedAt: "desc"
  }).limit(limitItems).skip(skip);

  for (const item of articleList) {
    if (item.deletedBy) {
      const infoAccountDeleted = await AccountAdmin.findOne({
        _id: item.deletedBy
      });
      if(infoAccountDeleted) {
        item.deletedByFullName = infoAccountDeleted.fullName;
      }
    }
    item.deletedAtFormat = moment(item.deletedAt).format("HH:mm - DD/MM/YYYY");
  }

  res.render("admin/pages/article-trash", {
    pageTitle: "Thùng rác tin tức",
    articleList: articleList,
    pagination: pagination
  });
};

module.exports.deletePatch = async (req, res) => {
  try {
    const id = req.params.id;

    await Article.updateOne({
      _id: id
    }, {
      deleted: true,
      deletedBy: req.account.id,
      deletedAt: Date.now()
    });

    req.flash('success', "Xoá bài viết thành công");

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

    await Article.deleteOne({
      _id: id
    });

    req.flash('success', "Xoá bài viết vĩnh viễn thành công");

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

    await Article.updateOne({
      _id: id
    }, {
      deleted: false,
    });

    req.flash('success', "Khôi phục bài viết thành công");

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

module.exports.changeMultiPatch = async (req, res) => {
  try {
    const { option, ids } = req.body;

    switch (option) {
      case "active":
      case "inactive":
        await Article.updateMany({
          _id: { $in: ids }
        }, {
          status: option
        });
        req.flash("success", "Đổi trạng thái thành công");
        break;
      case "delete":
        await Article.updateMany({
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

module.exports.trashChangeMultiPatch = async (req, res) => {
  try {
    const { option, ids } = req.body;

    switch (option) {
      case "undo":
        await Article.updateMany({
          _id: { $in: ids }
        }, {
          deleted: false
        });
        req.flash("success", "Khôi phục thành công");
        break;
      case "delete-destroy":
        await Article.deleteMany({
          _id: { $in: ids }
        });
        req.flash("success", "Xoá vĩnh viễn thành công");
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
