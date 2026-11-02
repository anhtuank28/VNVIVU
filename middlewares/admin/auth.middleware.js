const jwt=require("jsonwebtoken");
const AccountAdmin = require('../../models/account-admin.model');
const Role = require("../../models/role.model");

module.exports.verityToken= async (req,res,next)=>{
    try{
        const token=req.cookies.token;
        if(!token){
            res.redirect(`/${pathAdmin}/account/login`);
            return;
        }

        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const {id,email}=decoded;

        const exitsAccount=await AccountAdmin.findOne({
            _id:id,
            email:email,
            status:"active"
        } )
        if(!exitsAccount){
            res.clearCookie("token");
            res.redirect(`/${pathAdmin}/account/login`);
            return;
        }

        const role = exitsAccount.role ? await Role.findOne({
            _id: exitsAccount.role
        }) : null;
        exitsAccount.roleName = role ? role.name : "Quản trị viên";
    

        const SettingwebsiteInfo = require('../../models/setting-website-model');
        const settingWebsiteInfo = await SettingwebsiteInfo.findOne({});

        req.account=exitsAccount;//Để gắn nick mà đang tìm được trong db vào thuộc tính account và gửi req lên controller
        res.locals.account=exitsAccount;//để trong các file pug có thể dùng được exitsAccount
        res.locals.settingWebsiteInfo = settingWebsiteInfo;
        
        res.locals.permissions = role ? role.permissions : [];
        
        next();
    }catch(error){
        res.clearCookie("token");
        res.redirect(`/${pathAdmin}/account/login`);
    }
}

module.exports.requireAuth = (permission) => {
    return (req, res, next) => {
        if (!res.locals.permissions) {
            res.send(`<script>alert("Bạn không có quyền truy cập trang này!"); window.history.back();</script>`);
            return;
        }

        if (res.locals.permissions.includes(permission)) {
            next();
        } else {
            res.send(`<script>alert("Bạn không có quyền truy cập trang này!"); window.history.back();</script>`);
        }
    };
};