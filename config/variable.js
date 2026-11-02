module.exports.pathAdmin = "admin456";
module.exports.paymentMethod=[
    {
        label:"Thanh toán tiền mặt",
        value:"money"
    },
    {
        label:"Ví MoMo",
        value:"momo"
    },
    {
        label:"Chuyển khoản ngân hàng",
        value:"bank"
    },
    {
        label:"Chuyển khoản qua zalo pay",
        value:"zalopay"
    },
    {
        label:"Chuyển khoản qua VNpay",
        value:"vnpay"
    },
];

module.exports.paymentStatus=[
    {
        label:"Chưa thanh toán",
        value:"unpaid"
    },
    {
        label:"Đã thanh toán",
        value:"paid"
    }
]

module.exports.orderStatus=[
    {
        label:"khởi tạo",
        value:"initial"
    },
    {
        label:"Hoàn chỉnh",
        value:"done"
    },
    {
        label:"Huỷ",
        value:"cancel"
    },
]