const Tour = require("../../models/tour.model");
const City = require("../../models/city.model");
const Category = require("../../models/category.model");
const Review = require("../../models/review.model");
const Order = require("../../models/order.model");
const moment = require("moment");

// Hàm tiện ích: Tính toán lại ratingAverage và ratingQuantity cho Tour
const recalculateTourRating = async (tourId) => {
  const reviews = await Review.find({
    tourId: tourId,
    status: "active",
    deleted: false
  });

  const quantity = reviews.length;
  let average = 5.0;

  if (quantity > 0) {
    const totalScore = reviews.reduce((sum, item) => sum + item.rating, 0);
    average = Math.round((totalScore / quantity) * 10) / 10;
  }

  await Tour.updateOne(
    { _id: tourId },
    {
      ratingAverage: average,
      ratingQuantity: quantity
    }
  );

  return { ratingAverage: average, ratingQuantity: quantity };
};

module.exports.detail = async (req, res) => {
  const slug=req.params.slug;

  //tìm tour theo 
  const tourDetail=await Tour.findOne({
    slug:slug,
    status:"active",
    deleted:false
  })

  if(tourDetail){
    if (tourDetail.departureDate) {
      tourDetail.departureDateFormat = moment(tourDetail.departureDate).format("DD/MM/YYYY");
    }

    const breadcrumb={
      image: tourDetail.avatar,
      title: tourDetail.name,
      list:[
        {
          link: "/",
          title: "Trang chủ"
        }
      ]
    }

    if (tourDetail.category) {
      let currentCategory = await Category.findOne({
          _id: tourDetail.category,
          deleted: false,
          status: "active"
      });

      if (currentCategory) {
          const parentCategories = [currentCategory];
          
          while (currentCategory.parent) {
              currentCategory = await Category.findOne({
                  _id: currentCategory.parent,
                  deleted: false,
                  status: "active"
              });

              if (currentCategory) {
                  parentCategories.unshift(currentCategory);
              } else {
                  break;
              }
          }

          for (const parent of parentCategories) {
              breadcrumb.list.push({
                  link: `/category/${parent.slug}`,
                  title: parent.name
              });
          }
      }
    }

    breadcrumb.list.push({
        link: `/tour/detail/${tourDetail.slug}`,
        title: tourDetail.name
    });

    const cityList = await City.find({
      deleted: false,
      status: "active"
    });

    if (!tourDetail.images || tourDetail.images.length === 0) {
      tourDetail.images = [tourDetail.avatar];
    }

    let departureCity = null;
    if (tourDetail.locationFrom) {
        departureCity = await City.findOne({ _id: tourDetail.locationFrom });
    }

    // --- TRUY VẤN ĐÁNH GIÁ & TÍNH TOÁN RATING ---
    const reviews = await Review.find({
      tourId: tourDetail._id,
      status: "active",
      deleted: false
    })
      .populate("userId", "fullName avatar")
      .sort({ createdAt: "desc" })
      .lean();

    // Định dạng ngày đánh giá
    for (const r of reviews) {
      r.createdAtFormat = moment(r.createdAt).format("DD/MM/YYYY");
    }

    // Tính toán phân bổ số sao (1-5 sao)
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (ratingCounts[r.rating] !== undefined) {
        ratingCounts[r.rating]++;
      }
    });

    const totalReviews = reviews.length;
    const ratingPercentages = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (let s = 1; s <= 5; s++) {
      ratingPercentages[s] = totalReviews > 0 ? Math.round((ratingCounts[s] / totalReviews) * 100) : 0;
    }

    // Kiểm tra điều kiện đánh giá của người dùng hiện tại (Cho phép tự do đánh giá khi đã đăng nhập)
    let canReview = false;
    let userReview = null;
    const currentUser = res.locals.user;

    if (currentUser) {
      canReview = true;
      // Tìm xem người dùng đã từng gửi đánh giá tour này chưa
      userReview = await Review.findOne({
        userId: currentUser._id,
        tourId: tourDetail._id,
        deleted: false
      }).lean();
    }

    res.render("client/pages/tour-detail.pug", {
      pageTitle: tourDetail.name,
      tourDetail: tourDetail,
      breadcrumb: breadcrumb,
      cityList: cityList,
      departureCity: departureCity,
      reviews: reviews,
      totalReviews: totalReviews,
      ratingCounts: ratingCounts,
      ratingPercentages: ratingPercentages,
      canReview: canReview,
      userReview: userReview
    });
  }else{
    res.redirect("/");
  }
};

// [POST] /tour/review/:tourId - Xử lý gửi đánh giá tour
module.exports.reviewPost = async (req, res) => {
  try {
    const tourId = req.params.tourId;
    const currentUser = req.user || res.locals.user;

    // 1. Kiểm tra đăng nhập
    if (!currentUser) {
      return res.status(401).json({
        code: "error",
        message: "Vui lòng đăng nhập để thực hiện đánh giá!"
      });
    }

    // 2. Kiểm tra tour tồn tại
    const tour = await Tour.findOne({
      _id: tourId,
      status: "active",
      deleted: false
    });

    if (!tour) {
      return res.status(404).json({
        code: "error",
        message: "Tour không tồn tại hoặc đã ngừng hoạt động!"
      });
    }

    // 3. Kiểm tra dữ liệu đầu vào
    const rating = parseInt(req.body.rating);
    const comment = (req.body.comment || "").trim();

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        code: "error",
        message: "Số sao đánh giá phải từ 1 đến 5 sao!"
      });
    }

    if (!comment) {
      return res.status(400).json({
        code: "error",
        message: "Vui lòng nhập nội dung nhận xét!"
      });
    }

    // 4. Kiểm tra đơn hàng để gắn huy hiệu "Đã trải nghiệm tour" (nếu có)
    let verifiedOrderId = null;
    const userOrders = await Order.find({
      $and: [
        {
          $or: [
            { userId: currentUser._id },
            { phone: currentUser.phone }
          ]
        },
        { deleted: false },
        {
          $or: [
            { paymentStatus: "paid" },
            { status: "completed" }
          ]
        }
      ]
    }).lean();

    const verifiedOrder = userOrders.find(order => {
      return Array.isArray(order.items) && order.items.some(it => {
        return (it.tourId && it.tourId.toString() === tourId.toString()) ||
               (it.id && it.id.toString() === tourId.toString());
      });
    });

    if (verifiedOrder) {
      verifiedOrderId = verifiedOrder._id;
    }

    // 5. Xử lý danh sách ảnh đính kèm (nếu upload qua Multer Cloudinary)
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = req.files.map(file => file.path);
    } else if (req.body.images) {
      uploadedImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    // 6. Lưu hoặc cập nhật đánh giá
    let existingReview = await Review.findOne({
      userId: currentUser._id,
      tourId: tourId,
      deleted: false
    });

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment;
      if (verifiedOrderId) {
        existingReview.orderId = verifiedOrderId;
      }
      if (uploadedImages.length > 0) {
        existingReview.images = uploadedImages;
      }
      existingReview.status = "active";
      await existingReview.save();
    } else {
      const newReview = new Review({
        userId: currentUser._id,
        tourId: tourId,
        orderId: verifiedOrderId,
        rating: rating,
        comment: comment,
        images: uploadedImages,
        status: "active"
      });
      await newReview.save();
    }

    // 7. Tự động tính toán lại điểm trung bình cho tour
    const stats = await recalculateTourRating(tourId);

    return res.json({
      code: "success",
      message: existingReview 
        ? "Cập nhật đánh giá thành công!" 
        : "Cảm ơn bạn đã gửi đánh giá trải nghiệm tour!",
      stats: stats
    });

  } catch (error) {
    console.error("Review Error:", error);
    return res.status(500).json({
      code: "error",
      message: "Có lỗi xảy ra trong quá trình gửi đánh giá. Vui lòng thử lại sau!"
    });
  }
};
