const Contact = require("../../models/contact.model");

module.exports.show = (req, res) => {
  res.render("client/pages/contact", {
    pageTitle: "Liên hệ"
  });
};

module.exports.createPost=async (req,res)=>{
    const {email}=req.body;
    if (!email) {
        return res.json({ code: "error", message: "Vui lòng nhập email!" });
    }
    const existEmail=await Contact.findOne({
        email:email
    });
    if(existEmail){
        res.json({
            code:"error",
            message:"Email của bạn đã gửi liên hệ, chúng tôi sẽ phản hồi sớm!"
        });
        return;
    }

    const newRecord= new Contact(req.body);
    await newRecord.save();

    req.flash("success","Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.");

    res.json({
        code:"success"
    })
}