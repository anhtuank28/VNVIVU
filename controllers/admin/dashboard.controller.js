const AccountAdmin = require("../../models/account-admin.model");
const Order = require("../../models/order.model");
const variableConfig = require("../../config/variable");
const moment = require("moment");


module.exports.dashboard = async (req, res) => {
  const overview={
    totalAdmin: 0,
      totalCategory: 0,
      totalOrder: 0,
      totalUser: 0,
      totalPrice:0
  };

  overview.totalAdmin=await AccountAdmin.countDocuments({
    deleted:false
  })

  const orderList=await Order.find({
    deleted:false
  }).sort({ createdAt: "desc" })

  overview.totalOrder=orderList.length;
  overview.totalPrice=orderList.reduce((sum,item)=>{
    return sum+item.total;
  },0)

  const recentOrders = orderList.slice(0, 5);

  for (const orderDetail of recentOrders) {
    const pm = variableConfig.paymentMethod.find(item => item.value == orderDetail.paymentMethod);
    orderDetail.paymentMethodName = pm ? pm.label : orderDetail.paymentMethod;

    const ps = variableConfig.paymentStatus.find(item => item.value == orderDetail.paymentStatus);
    orderDetail.paymentStatusName = ps ? ps.label : orderDetail.paymentStatus;

    const os = variableConfig.orderStatus.find(item => item.value == orderDetail.status);
    orderDetail.statusName = os ? os.label : orderDetail.status;

    orderDetail.createdAtDate = moment(orderDetail.createdAt).format("DD/MM/YYYY");
    orderDetail.createdAtTime = moment(orderDetail.createdAt).format("HH:mm");
  }

  res.render("admin/pages/dashboard", {
    pageTitle: "dashboard",
    overview:overview,
    recentOrders: recentOrders
})
}

module.exports.revenueChartPost=async(req,res)=>{
  const {currentMonth,currentYear,previousMonth,previousYear,arrayDay}=req.body;

  // truy van tat ca don hang trong thang hien tai
  const ordersCurrentMonth=await Order.find({
    deleted:false,
    createdAt:{
      $gte:new Date(currentYear,currentMonth-1,1),
      $lt: new Date(currentYear,currentMonth,1),
    }
  })
  // truy van tat ca don hang trong thang truoc
  const ordersPreviousMonth=await Order.find({
    deleted:false,
    createdAt:{
      $gte:new Date(previousYear,previousMonth-1,1),
      $lt: new Date(previousYear,previousMonth,1),
    }
  })

  //tao mang doanh thu theo tung ngay
  const dataMonthCurrent=[];
  const dataMonthPrevious=[];

  for(const day of arrayDay){
    //tinh tong doanh thu theo tung ngay cua thang nay
    let totalCurrent=0;
    for(const order of ordersCurrentMonth){
      const orderDate=new Date(order.createdAt).getDate();
      if(day==orderDate){
        totalCurrent+=order.total
;      }
    }
    dataMonthCurrent.push(totalCurrent);
   
    let totalPrevious=0;
    for(const order of ordersPreviousMonth){
      const orderDate=new Date(order.createdAt).getDate();
      if(day==orderDate){
        totalPrevious+=order.total
;      }
    }
    dataMonthPrevious.push(totalPrevious);
    //tinh tong doanh thu theo tung ngay cua thang truoc

  }
  

  res.json({
    code:"success",
    dataMonthCurrent:dataMonthCurrent,
    dataMonthPrevious:dataMonthPrevious
  })
}
