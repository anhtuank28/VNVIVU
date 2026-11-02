const mongoose = require("mongoose");
const schema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true
        },
        type: {
            type: String,
            default: "percent", // 'percent' hoặc 'amount'
        },
        value: {
            type: Number,
            required: true
        },
        minOrderValue: {
            type: Number,
            default: 0
        },
        quantity: {
            type: Number,
            default: 1
        },
        status: {
            type: String,
            default: "active"
        },
        expireAt: Date,
        createdBy: String,
        updatedBy: String,
        deleted: {
            type: Boolean,
            default: false
        },
        deletedBy: String,
        deletedAt: Date
    },
    {
        timestamps: true
    }
);

const Coupon = mongoose.model("Coupon", schema, "coupons");
module.exports = Coupon;
