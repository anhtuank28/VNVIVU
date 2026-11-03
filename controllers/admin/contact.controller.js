const moment = require("moment");
const Contact = require("../../models/contact.model");
const mailHelper = require("../../helpers/mail.helper");
const variableConfig = require("../../config/variable");
const pathAdmin = variableConfig.pathAdmin;

module.exports.list = async (req, res) => {
  const find={
    deleted:false
  }

  const contactList=await Contact.find(find).sort({createdAt:"desc"});
  for(const item of contactList){
    item.createdAtFormat=moment(item.createdAt).format("HH:mm-DD/MM/YYYY");
  }

  res.render("admin/pages/contact-list", {
    pageTitle: "Thông tin liên hệ",
    contactList:contactList
  });
};

// [GET] /admin/contact/send
module.exports.sendMail = async (req, res) => {
  res.render("admin/pages/contact-send", {
    pageTitle: "Gửi thư nhận tin",
  });
};

// [POST] /admin/contact/send
module.exports.sendMailPost = async (req, res) => {
  try {
    const { subject, content } = req.body;
    
    // Lấy toàn bộ email từ database
    const contacts = await Contact.find({ deleted: false }).select("email");
    
    // Nếu có contacts thì tiến hành gửi mail
    if(contacts.length > 0) {
      // Gửi riêng cho từng email trong background
      for (const contact of contacts) {
        if(contact.email) {
          mailHelper.sendMail(contact.email, subject, content);
        }
      }
      
      req.flash("success", `Đã gửi email thành công tới ${contacts.length} người dùng!`);
    } else {
      req.flash("error", "Không có người dùng nào để gửi email!");
    }
    
    res.redirect(`/${pathAdmin}/contact/list`);
  } catch (error) {
    console.error("Lỗi gửi email hàng loạt:", error);
    req.flash("error", "Đã có lỗi xảy ra khi gửi email!");
    res.redirect("back");
  }
};
