const SettingwebsiteInfo = require("../../models/setting-website-model")
const bcrypt = require("bcryptjs");
const permissionConfig=require("../../config/permission");
const Role = require("../../models/role.model");
const AccountAdmin = require("../../models/account-admin.model");

module.exports.list = async (req, res) => {
  res.render("admin/pages/setting-list", {
    pageTitle: "cài đặt chung",
  });
};
module.exports.websiteInfo = async (req, res) => {
  let settingWebsiteInfo = await SettingwebsiteInfo.findOne({});

  if (!settingWebsiteInfo) {
    settingWebsiteInfo = {
      websiteName: "VNVIVU",
      phone: "",
      email: "",
      address: "",
      logo: "",
      favicon: "",
      footerDescription: "Khám phá thế giới qua những chuyến đi tuyệt vời cùng VnVivu. Chúng tôi mang đến những trải nghiệm du lịch đẳng cấp và an toàn.",
      facebook: "https://www.facebook.com/anh.tuan.246083?mibextid=wwXIfr&mibextid=wwXIfr",
      instagram: "",
      twitter: "",
      youtube: "",
      copyright: "© 2024 VnVivu. All rights reserved."
    };
  }

  res.render("admin/pages/setting-website-info", {
    pageTitle: "thông tin website",
    settingWebsiteInfo: settingWebsiteInfo
  });
};
module.exports.websiteInfoPatch = async (req, res) => {
  if(req.files && req.files.logo){
    req.body.logo = req.files.logo[0].path;
  } else {
    delete req.body.logo;
  }
  
  if(req.files && req.files.favicon){
    req.body.favicon = req.files.favicon[0].path;
  } else {
    delete req.body.favicon;
  }

  const settingwebsiteInfo = await SettingwebsiteInfo.findOne({});
  if (settingwebsiteInfo) {
    await SettingwebsiteInfo.updateOne({ _id: settingwebsiteInfo.id }, req.body);
  } else {
    const newRecord = new SettingwebsiteInfo(req.body);
    await newRecord.save();
  }

  // Sửa res.flash thành req.flash (nếu bạn dùng thư viện express-flash)
  if (req.flash) {
    req.flash("success", "Cập nhật thành công");
  }

  res.json({
    code: "success"
  });
};
module.exports.accountAdminList = async (req, res) => {
  const accountAdminList=await AccountAdmin.find({deleted:false}).sort({createdAt:"desc"});
  for(const item of accountAdminList){
    if(item.role){
      const roleInfo=await Role.findOne({
        _id:item.role
      });

      if(roleInfo){
        item.roleName=roleInfo.name;
      }
    }
  }
  res.render("admin/pages/setting-account-admin-list", {
    pageTitle: "Tài khoản quản trị",
    accountAdminList:accountAdminList
  });
};
module.exports.accountAdminCreate = async (req, res) => {
  const roleList= await Role.find({
    deleted: false
  })

  res.render("admin/pages/setting-account-admin-create", {
    pageTitle: "Tạo tài khoản quản trị",
    roleList:roleList
  });
};
module.exports.accountAdminEdit = async (req, res) => {
 try{
   const roleList= await Role.find({
    deleted: false
  })

  const id=req.params.id;
  const accountAdminDetail=await AccountAdmin.findOne({
    _id:id,
    deleted:false
  })

  if(!accountAdminDetail){
    res.redirect(`/${pathAdmin}/setting/account-admin/list`);
    return;
  }
  res.render("admin/pages/setting-account-admin-edit", {
    pageTitle: "Chỉnh sửa tài khoản quản trị",
    roleList:roleList,
    accountAdminDetail:accountAdminDetail
  });
 }catch(error){
      res.redirect(`/${pathAdmin}/setting/account-admin/list`);

 }
};
module.exports.accountAdminCreatePost = async (req, res) => {
  const existAccount=await AccountAdmin.findOne({
    email:req.body.email
  })

  if(existAccount){
    res.json({
      code:"error",
      message: "Email exits"
    })
    return;
  }

  req.body.createdBy=req.account.id;
  req.body.updatedBy=req.account.id;
  req.body.avatar=req.file?req.file.path:"";

  const salt = await bcrypt.genSalt(10); //tạo ra chuỗi ngẫu nhiên có 10 ký tự
     req.body.password = await bcrypt.hash(req.body.password, salt);

    const newAccount= new AccountAdmin(req.body);
    await newAccount.save();

  req.flash("success","Tạo tài khoản quản trị thành công");
  res.json({
    code:"success"
  })
};
module.exports.accountAdminEditPatch = async (req, res) => {
  try{ 
   const id=req.params.id;
  
   req.body.updatedBy=req.account.id;

  const emailExist = await AccountAdmin.findOne({
    _id: { $ne: id },
    email: req.body.email,
    deleted: false
  });

  if (emailExist) {
    res.json({
      code: "error",
      message: "Email đã tồn tại!"
    });
    return;
  }

  if(req.file){
     req.body.avatar=req.file.path;
  }else{
    delete req.body.avatar;
  }
  if(req.body.password){
    const salt = await bcrypt.genSalt(10); //tạo ra chuỗi ngẫu nhiên có 10 ký tự
     req.body.password = await bcrypt.hash(req.body.password, salt);
  }
  await AccountAdmin.updateOne({
    _id:id,
    deleted:false
  },req.body)

  req.flash("success","Cập nhật tài khoản quản trị thành công");
  res.json({
    code:"success"
  })}
 catch(error){
  res.json({
    code: "error",
    message: "Đã có lỗi xảy ra!"
  });
 }
};
module.exports.roleList = async (req, res) => {
  const find = {
    deleted: false
  };

  if (req.query.keyword) {
    const keywordRegex = new RegExp(req.query.keyword, "i");
    find.name = keywordRegex;
  }

  const roleList= await Role.find(find);

  res.render("admin/pages/setting-role-list", {
    pageTitle: "Nhóm quyền",
    roleList:roleList
  });
};
module.exports.roleCreate = async (req, res) => {
  
  res.render("admin/pages/setting-role-create", {
    pageTitle: "Tạo nhóm quyền",
    permissionList: permissionConfig.permissionList
  });
};
module.exports.roleCreatePost = async (req, res) => {
    if (req.account) {
        req.body.createdBy = req.account.id;
        req.body.updatedBy = req.account.id;
    }

    const newRecord= new Role(req.body);
    await newRecord.save();

    if (req.flash) {
        req.flash("success","Tạo nhóm quyền thành công");
    }
    
    res.json({
        code: "success"
    });
};

module.exports.roleDelete = async (req, res) => {
  const id = req.params.id;

  await Role.updateOne({ _id: id }, {
    deleted: true,
    deletedAt: new Date(),
    deletedBy: req.account ? req.account.id : ""
  });

  res.json({
    code: "success"
  });
};

module.exports.roleChangeMulti = async (req, res) => {
  const option = req.body.option;
  const ids = req.body.ids;

  if (option === "delete") {
    await Role.updateMany({ _id: { $in: ids } }, {
      deleted: true,
      deletedAt: new Date(),
      deletedBy: req.account ? req.account.id : ""
    });
  }

  res.json({
    code: "success"
  });
};

module.exports.roleTrash = async (req, res) => {
  const find = {
    deleted: true
  };

  if (req.query.keyword) {
    const keywordRegex = new RegExp(req.query.keyword, "i");
    find.name = keywordRegex;
  }

  const roleList = await Role.find(find);
  res.render("admin/pages/setting-role-trash", {
    pageTitle: "Thùng rác nhóm quyền",
    roleList: roleList
  });
};

module.exports.roleUndo = async (req, res) => {
  const id = req.params.id;
  await Role.updateOne({ _id: id }, { deleted: false, deletedAt: null, deletedBy: null });
  res.json({ code: "success" });
};

module.exports.roleDeleteDestroy = async (req, res) => {
  const id = req.params.id;
  await Role.deleteOne({ _id: id });
  res.json({ code: "success" });
};

module.exports.roleTrashChangeMulti = async (req, res) => {
  const option = req.body.option;
  const ids = req.body.ids;

  if (option === "undo") {
    await Role.updateMany({ _id: { $in: ids } }, { deleted: false, deletedAt: null, deletedBy: null });
  } else if (option === "delete-destroy") {
    await Role.deleteMany({ _id: { $in: ids } });
  }

  res.json({ code: "success" });
};

module.exports.roleEdit = async (req, res) => {
  try{
    const id=req.params.id;

  const roleDetail = await Role.findOne({
    _id:id,
    deleted:false
  })

  if(roleDetail){
     res.render("admin/pages/setting-role-edit", {
    pageTitle: "Chỉnh sửa nhóm quyền",
    permissionList: permissionConfig.permissionList,
    roleDetail:roleDetail
  });
  }else{
        res.direct(`/${pathAdmin}/setting/role/list`);

  }
 
  }catch(error){
    res.direct(`/${pathAdmin}/setting/role/list`);
  }
  
};

module.exports.roleEditPatch = async (req, res) => {
  try{
    const id=req.params.id;
    req.body.updatedBy=req.account.id;

    await Role.updateOne({
      _id:id,
      deleted:false
    },req.body)

    req.flash("success","Sửa nhóm quyền thành công");
    
    res.json({
        code: "success"
    });

  }catch(error){
    res.json({
      code:"error",
      message: "id khong ton tai"
    })
  }
    
};
