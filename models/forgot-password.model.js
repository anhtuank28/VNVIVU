const moongose=require("mongoose");

const schema=new moongose.Schema(
    {
        email:String,
        otp:String,
        expireAt:{
            type:Date,
            expires:0
        }
    },{
        timestamps:true, //tự động sinh ra trường createAt và updateAt
    }
);

const forgotPassword=moongose.model("forgotPassword",schema,"forgot-password");

module.exports=forgotPassword