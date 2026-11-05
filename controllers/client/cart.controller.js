const Tour = require("../../models/tour.model");
const City = require("../../models/city.model");
const Coupon = require("../../models/coupon.model");
const moment = require("moment");

module.exports.cart = async (req, res) => {
  const coupons = await Coupon.find({
    status: "active",
    deleted: false,
    quantity: { $gt: 0 }
  });

  res.render("client/pages/cart", {
    pageTitle: "Giỏ hàng",
    coupons: coupons
  });
};

module.exports.detail=async(req,res)=>{
  const cart=req.body;
  const validCart = [];

  for(const item of cart){
    const tourInfo=await Tour.findOne({
      _id:item.tourId,
      status:"active",
      deleted:false
    });

    if(tourInfo){
      item.avatar=tourInfo.avatar;
      item.name=tourInfo.name;
      item.slug=tourInfo.slug;
      item.departureDateFormat=moment(tourInfo.departureDate).format("DD/MM/YYYY");
      item.priceNewAdult=tourInfo.priceNewAdult;
      item.priceNewChildren=tourInfo.priceNewChildren;
      item.priceNewBaby=tourInfo.priceNewBaby;

      const city = item.locationFrom ? await City.findOne({
        _id:item.locationFrom
      }) : null;
      item.locationFromName = city ? city.name : "Chưa xác định";
      
      validCart.push(item);
    }
  }

  res.json({
    code:"success",
    cart:validCart
  })
}
