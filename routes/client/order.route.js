const router=require("express").Router();
const orderController=require("../../controllers/client/order.controller");


router.post("/create",orderController.createOrder)
router.post("/check-coupon", orderController.checkCoupon)
router.get("/success",orderController.success)
router.get("/payment-zalopay",orderController.paymentZaloPay)
router.post("/payment-zalopay-result",orderController.paymentZaloPayResultPost)
router.get("/payment-vnpay",orderController.paymentVnPay)
router.get("/payment-vnpay-result",orderController.paymentVnPayResult)

module.exports=router;