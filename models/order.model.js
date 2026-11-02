const mongoose=require("mongoose");
const schema=new mongoose.Schema(
    {
        orderCode:String,
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        fullName:String,
        phone:String,
        note:String,
        items:Array,
        subTotal:Number,
        discountAmount: {
            type: Number,
            default: 0
        },
        couponCode: String,
        total:Number,
        paymentMethod:String,
        paymentStatus:String,
        status:String,
        updatedBy:String,
        deleted:{
            type:Boolean,
            default:false
        },
        deletedBy:String,
        deletedAt:Date
    },{
        timestamps:true,
    }
);
const Order=mongoose.model('Order',schema,"orders");
module.exports=Order;