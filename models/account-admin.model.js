const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  status: String,
  password:String,
  avatar:String,
  role:String,
  positionCompany:String,
  createdBy:String,
  updatedBy:String,
  phone:String,
  deleted:{
    type:Boolean,
    default:false
  },
  deletedBy:String,
  deletedAt:Date
},{
  timestamps: true,
});

const AccountAdmin = mongoose.model("AccountAdmin", schema, "accounts-admin");
module.exports = AccountAdmin;
