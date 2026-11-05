const Tour = require("../../models/tour.model");
const Order = require("../../models/order.model");
const Coupon = require("../../models/coupon.model");
const variableHelper=require("../../config/variable");
const generateHelper=require("../../helpers/generate.helper");
const sortHelper=require("../../helpers/sort.helper");
// Node v10.15.3
const axios = require('axios').default; // npm install axios
const CryptoJS = require('crypto-js'); // npm install crypto-js
const moment = require("moment");
module.exports.createOrder = async (req, res) => {
    try {
        req.body.orderCode="OD"+generateHelper.generateRandomNumber(10);
        // --- BƯỚC 1: KIỂM TRA TẤT CẢ CÁC TOUR (VALIDATION) ---
        let itemsData = [];

        for (const item of req.body.items) {
            const infoTour = await Tour.findOne({
                _id: item.tourId || item.id,
                status: "active",
                deleted: false
            });

            if (!infoTour) {
                return res.json({
                    code: "error",
                    message: "Một số tour trong đơn hàng không tồn tại hoặc đã ngừng hoạt động!"
                });
            }

            // Gắn thêm dữ liệu vào item
            item.priceNewAdult = infoTour.priceNewAdult;
            item.priceNewChildren = infoTour.priceNewChildren;
            item.priceNewBaby = infoTour.priceNewBaby;
            item.departureDate = infoTour.departureDate;
            item.avatar = infoTour.avatar;
            item.name = infoTour.name;
            
            // Kiểm tra số lượng còn lại
            if (infoTour.stockAdult < item.quantityAdult || infoTour.stockChildren < item.quantityChildren || infoTour.stockBaby < item.quantityBaby) {
                return res.json({
                    code: "error",
                    message: `Số lượng chỗ của tour ${item.name} đã hết, vui lòng chọn lại`
                });
            }

            itemsData.push({
                item: item,
                infoTour: infoTour
            });
        }

        // --- BƯỚC 2: TRỪ KHO VÀ TÍNH TIỀN (EXECUTION) ---
        for (const data of itemsData) {
            await Tour.updateOne({
                _id: data.item.tourId || data.item.id
            }, {
                stockAdult: data.infoTour.stockAdult - data.item.quantityAdult,
                stockChildren: data.infoTour.stockChildren - data.item.quantityChildren,
                stockBaby: data.infoTour.stockBaby - data.item.quantityBaby,
            });
        }

        req.body.subTotal = req.body.items.reduce((sum, item) => {
            // Frontend đã lọc các item được check, nên ở đây tính tổng hết
            return sum + ((item.priceNewAdult * item.quantityAdult) + (item.priceNewChildren * item.quantityChildren) + (item.priceNewBaby * item.quantityBaby));
        }, 0);

        // tạm tính
        req.body.discount = 0;
        
        if (req.body.couponCode) {
            const couponInfo = await Coupon.findOne({
                code: req.body.couponCode,
                status: "active",
                deleted: false
            });
            if (couponInfo && couponInfo.quantity > 0) {
                if (req.body.subTotal >= couponInfo.minOrderValue) {
                    if (couponInfo.type === "percent") {
                        req.body.discount = (req.body.subTotal * couponInfo.value) / 100;
                    } else {
                        req.body.discount = couponInfo.value;
                    }
                    if (req.body.discount > req.body.subTotal) {
                        req.body.discount = req.body.subTotal;
                    }
                    
                    // Trừ số lượng coupon
                    await Coupon.updateOne(
                        { _id: couponInfo._id },
                        { $inc: { quantity: -1 } }
                    );
                }
            }
        }
        
        // thanh toán
        req.body.total = req.body.subTotal - req.body.discount;
        // trạng thái thanh toán
        req.body.paymentStatus = "unpaid";
        // trạng thái đơn hàng
        req.body.status = "initial";
        
        if (res.locals.user) {
            req.body.userId = res.locals.user.id;
        }
        
        const newRecord = new Order(req.body);
        await newRecord.save();

        return res.json({
            code: "success",
            message: "Đặt hàng thành công",
            orderId: newRecord.id
        });

    } catch (error) {
        console.error(error);
        return res.json({
            code: "error",
            message: "Lỗi hệ thống"
        });
    }
}

module.exports.success = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        let order = null;
        if (orderId) {
            // Dùng lean() để Mongoose trả về plain object, giúp ta có thể dễ dàng gắn thêm thuộc tính
            order = await Order.findOne({ _id: orderId }).lean();
        }

        if (order) {
            const methodInfo = variableHelper.paymentMethod.find(item => item.value == order.paymentMethod);
            order.paymentMethodName = methodInfo ? methodInfo.label : "Thanh toán trực tiếp";
        }
        res.render("client/pages/order-success", {
            pageTitle: "Đặt hàng thành công",
            order: order
        });
    } catch (error) {
        console.error(error);
        res.redirect("/");
    }
}

module.exports.paymentZaloPay=async(req,res)=>{
  try{
     const orderId=req.query.orderId;
  const orderDetail=await Order.findOne({
    _id:orderId,
    deleted:false,
    paymentStatus:"unpaid"
  })
  if(!orderDetail){
    res.redirect("/");
    return;
  }

const config = {
    app_id: process.env.ZALOPAY_APPID,
    key1: process.env.ZALOPAY_KEY1,
    key2: process.env.ZALOPAY_KEY2,
    endpoint: `${process.env.ZALOPAY_DOMAIN}/v2/create`
};

const embed_data = { 
       redirecturl:`${process.env.DOMAIN_WEBSITE}/order/success?orderId=${orderDetail.orderId}&phone=${orderDetail.phone}`
};

const items = [{}];
const transID = Math.floor(Math.random() * 1000000);
const order = {
    app_id: config.app_id,
    app_trans_id: `${moment().format('YYMMDD')}_${transID}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
    app_user: `${orderDetail.phone}-${orderDetail.id}`,
    app_time: Date.now(), // miliseconds
    item: JSON.stringify(items),
    embed_data: JSON.stringify(embed_data),
    amount: orderDetail.total,
    description: `Thanh toán đơn hàng ${orderDetail.orderCode}`,
    bank_code: "",
    callback_url:`${process.env.DOMAIN_WEBSITE}/order/payment-zalopay-result`,
};

// appid|app_trans_id|appuser|amount|apptime|embeddata|item
const data = config.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

const response= await axios.post(config.endpoint, null, { params: order })
        console.log(response);

   if(response.data.return_code==1){
    
    res.redirect(response.data.order_url);
   }else{

    res.redirect("/");
   }
  }catch(error){
    console.log(error);
    res.redirect("/");
  }
}

module.exports.paymentZaloPayResultPost=async(req,res)=>{
    console.log(req.body);
    
const config = {
  key2: process.env.ZALOPAY_KEY2
};
 let result = {};

  try {
    let dataStr = req.body.data;
    let reqMac = req.body.mac;

    let mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
    console.log("mac =", mac);


    // kiểm tra callback hợp lệ (đến từ ZaloPay server)
    if (reqMac !== mac) {
      // callback không hợp lệ
      result.return_code = -1;
      result.return_message = "mac not equal";
    }
    else {
      // thanh toán thành công
      // merchant cập nhật trạng thái cho đơn hàng
      let dataJson = JSON.parse(dataStr, config.key2);
        const [phone,orderId]=dataJson.app_user.split("-");

        await Order.updateOne({
            _id:orderId,
            phone:phone,
            deleted:false
        },{
          paymentStatus:"paid"  
        })

      result.return_code = 1;
      result.return_message = "success";
    }
    } catch (ex) {
    result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
    result.return_message = ex.message;
  }

  // thông báo kết quả cho ZaloPay server
  res.json(result);


}

module.exports.paymentVnPay=async(req,res)=>{
    try{
        const orderId=req.query.orderId;
        const orderDetail=await Order.findOne({
            _id:orderId,
            paymentStatus:"unpaid",
            deleted:false
        
    });
    if(!orderDetail){
        res.redirect("/");
        return;
    }

     let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');
        
        let ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
        
        // VNPay Sandbox rất hay báo lỗi với IPv6, ta ép về 127.0.0.1 nếu không có IPv4 hợp lệ
        ipAddr = '127.0.0.1';
           
        let tmnCode =process.env.VNPAY_CODE;
        let secretKey =process.env.VNPAY_SECRET;
        let vnpUrl =process.env.VNPAY_URL;
        let returnUrl = `${process.env.DOMAIN_WEBSITE}/order/payment-vnpay-result`;
        let orderIdVNP = `${orderId}-${Date.now()}`;
        let amount = orderDetail.total;
        let bankCode =""; 
        
        let locale = "vn";
        let currCode = 'VND';
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderIdVNP;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma don hang ' + orderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        if(bankCode !== null && bankCode !== ''){
            vnp_Params['vnp_BankCode'] = bankCode;
        }
    
        vnp_Params = sortHelper.sortObject(vnp_Params);
    
        let querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let crypto = require("crypto");     
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
        
    
        res.redirect(vnpUrl)
    }catch(error){
        console.error("Lỗi tạo URL VNPay:", error);
        res.redirect("/");
    }
}

module.exports.paymentVnPayResult=async(req,res)=>{
      let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortHelper.sortObject(vnp_Params);

    let secretKey = process.env.VNPAY_SECRET;

    let querystring = require('qs');
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");     
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");     

    if(secureHash === signed){
        if(vnp_Params["vnp_ResponseCode"]=="00" && vnp_Params["vnp_TransactionStatus"]=="00"){
            const [orderId,date]=vnp_Params['vnp_TxnRef'].split("-");

            const orderDetail=await Order.findOne({
                _id:orderId,
                deleted:false
            })

            if(!orderDetail){
                return res.redirect("/");
            }

            await Order.updateOne({
                _id:orderId,
                deleted:false
            },{
                paymentStatus:"paid"
            })
            console.log(orderDetail);
            console.log(`${process.env.DOMAIN_WEBSITE}/order/success?orderId=${orderId}&phone=${orderDetail.phone}`);
            
            res.redirect(`${process.env.DOMAIN_WEBSITE}/order/success?orderId=${orderId}&phone=${orderDetail.phone}`)
        }else{
            res.redirect("/")
        }
    } else{
        res.redirect("/")
    }
}


module.exports.checkCoupon = async (req, res) => {
    try {
        const { code, totalOrder } = req.body;
        
        const coupon = await Coupon.findOne({
            code: code,
            status: "active",
            deleted: false
        });

        if (!coupon) {
            return res.json({ code: "error", message: "Mã giảm giá không tồn tại hoặc đã hết hạn!" });
        }

        if (coupon.quantity <= 0) {
            return res.json({ code: "error", message: "Mã giảm giá đã hết lượt sử dụng!" });
        }

        if (coupon.expireAt && new Date(coupon.expireAt) < new Date()) {
            return res.json({ code: "error", message: "Mã giảm giá đã hết hạn!" });
        }

        if (totalOrder < coupon.minOrderValue) {
            return res.json({ code: "error", message: `Đơn hàng tối thiểu phải từ ${coupon.minOrderValue.toLocaleString("vi-VN")}đ` });
        }

        let discount = 0;
        if (coupon.type === "percent") {
            discount = (totalOrder * coupon.value) / 100;
        } else {
            discount = coupon.value;
        }

        if (discount > totalOrder) discount = totalOrder;

        return res.json({
            code: "success",
            message: "Áp dụng mã giảm giá thành công!",
            discount: discount
        });
    } catch (error) {
        console.error(error);
        return res.json({ code: "error", message: "Lỗi hệ thống!" });
    }
};
