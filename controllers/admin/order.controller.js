const Order = require("../../models/order.model");
const City = require("../../models/city.model");
const variableConfig=require("../../config/variable");
const moment = require("moment");


module.exports.list = async (req, res) => {
  const find={
    deleted:false
  }

  // Filter processing
  if (req.query.status) {
    find.status = req.query.status;
  }
  if (req.query.paymentMethod) {
    find.paymentMethod = req.query.paymentMethod;
  }
  if (req.query.paymentStatus) {
    find.paymentStatus = req.query.paymentStatus;
  }
  if (req.query.fromDate || req.query.toDate) {
    find.createdAt = {};
    if (req.query.fromDate) {
      find.createdAt.$gte = new Date(req.query.fromDate);
    }
    if (req.query.toDate) {
      const toDate = new Date(req.query.toDate);
      toDate.setHours(23, 59, 59, 999);
      find.createdAt.$lte = toDate;
    }
  }

  // Search keyword (could be phone or orderCode or fullName)
  if (req.query.keyword) {
    const keywordRegex = new RegExp(req.query.keyword, "i");
    find.$or = [
      { orderCode: keywordRegex },
      { fullName: keywordRegex },
      { phone: keywordRegex },
    ];
  }

  const orderList=await Order.find(find).sort({createdAt:'desc'});

  for(const orderDetail of orderList){
    const pm = variableConfig.paymentMethod.find(item=>item.value==orderDetail.paymentMethod);
    orderDetail.paymentMethodName= pm ? pm.label : orderDetail.paymentMethod;

    const ps = variableConfig.paymentStatus.find(item=>item.value==orderDetail.paymentStatus);
    orderDetail.paymentStatusName= ps ? ps.label : orderDetail.paymentStatus;

    const os = variableConfig.orderStatus.find(item=>item.value==orderDetail.status);
    orderDetail.statusName= os ? os.label : orderDetail.status;

    orderDetail.createdAtDate=moment(orderDetail.createdAt).format("HH:mm");
    orderDetail.createdAtTime=moment(orderDetail.createdAt).format("DD/MM/YYYY");
  }

  res.render("admin/pages/order-list", {
    pageTitle: "quan ly don hang",
    orderList:orderList,
    query: req.query
  });
};
module.exports.edit = async (req, res) => {
  try{
  const id=req.params.id;

  const orderDetail=await Order.findOne({
    _id:id,
    deleted:false
  })
  orderDetail.createdAtFormat=moment(orderDetail.createdAt).format("YYYY-MM-DDTHH:mm");
  for(const item of orderDetail.items){
    const city=await City.findOne({
      _id:item.locationFrom
    })
    item.locationFromName=city.name;
    item.departureDateFormat=moment(item.departureDate).format("DD/MM/YYYY");
  }

  res.render("admin/pages/order-edit", {
    pageTitle: `Đơn hàng ${orderDetail.orderCode}`,
    orderDetail:orderDetail,
    paymentMethod:variableConfig.paymentMethod,
        paymentStatus:variableConfig.paymentStatus,
        orderStatus:variableConfig.orderStatus

  });
  }catch(error){
    console.error(error);
    res.redirect(`/${variableConfig.pathAdmin}/order/list`);
  }

};
module.exports.editPatch=async(req,res)=>{
  try{
    const id=req.params.id;
    const order=await Order.findOne({
      _id:id,
      deleted:false
    });
    if(!order){
      res.json({
        code:'error',
        message:"Thông tin đơn hàng không hợp lệ"
      })
      return;
    }

    await Order.updateOne({
      _id:id,
      deleted:false
    },req.body);
    req.flash("success","Cập nhập thay đổi thành công");
    res.json({
      code:"success"
    }
    )
  }catch(error)
{
  res.json({
    code:"error",
    message:"thông tin đơn hàng không hợp lệ"
  })
}}

