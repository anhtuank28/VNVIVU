const mongoose = require("mongoose");
require("dotenv").config();

const Tour = require("../models/tour.model");
const User = require("../models/user.model");
const Review = require("../models/review.model");

// Danh sách người dùng mẫu mang phong cách du lịch thực tế
const MOCK_USERS = [
  {
    fullName: "Nguyễn Hoàng Nam",
    email: "hoangnam.travel@gmail.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    phone: "0912345601"
  },
  {
    fullName: "Trần Mai Phương",
    email: "maiphuong.tran@gmail.com",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    phone: "0912345602"
  },
  {
    fullName: "Lê Minh Tuấn",
    email: "minhtuan.le92@gmail.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    phone: "0912345603"
  },
  {
    fullName: "Phạm Thu Hương",
    email: "thuhuong.pham@gmail.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    phone: "0912345604"
  },
  {
    fullName: "Đỗ Quốc Bảo",
    email: "quocbao.do@gmail.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    phone: "0912345605"
  },
  {
    fullName: "Vũ Thảo Vy",
    email: "thaovy.vu@gmail.com",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    phone: "0912345606"
  },
  {
    fullName: "Hoàng Đức Anh",
    email: "ducanh.hoang@gmail.com",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    phone: "0912345607"
  },
  {
    fullName: "Bùi Khánh Linh",
    email: "khanhlinh.bui@gmail.com",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    phone: "0912345608"
  }
];

// Danh sách các nhận xét thực tế, đa dạng
const MOCK_COMMENTS = [
  {
    rating: 5,
    comment: "Chuyến đi tuyệt vời ngoài mong đợi! Hướng dẫn viên cực kỳ nhiệt tình, chu đáo và am hiểu lịch sử địa phương. Xe đưa đón êm ái, khách sạn view siêu đẹp. Sẽ ủng hộ VNVIVU tiếp trong các chuyến sau!",
    images: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=80"
    ]
  },
  {
    rating: 5,
    comment: "Lịch trình hợp lý, không bị dồn dập. Bữa ăn theo tour rất phong phú và hợp khẩu vị. Cả gia đình mình từ người lớn đến các bé ai cũng rất thích chuyến đi này.",
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80"
    ]
  },
  {
    rating: 4,
    comment: "Tour tổ chức chuyên nghiệp, xuất phát đúng giờ. Khách sạn sạch sẽ, đồ ăn ngon. Điểm trừ nhẹ là ngày thứ 2 di chuyển hơi nhiều nên hơi mệt chút, nhưng bù lại cảnh điểm đến quá đẹp!",
    images: []
  },
  {
    rating: 5,
    comment: "Dịch vụ của VNVIVU thực sự chất lượng! Đặt tour nhanh chóng, nhân viên tư vấn nhiệt tình giải đáp mọi thắc mắc. Chụp được vô số góc ảnh sống ảo xịn xò mang về.",
    images: [
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=600&auto=format&fit=crop&q=80"
    ]
  },
  {
    rating: 5,
    comment: "Cảnh sắc thiên nhiên tuyệt đẹp, không khí trong lành. Hướng dẫn viên chu đáo, chụp ảnh cho cả đoàn rất có tâm. Rất đáng đồng tiền bát gạo!",
    images: []
  },
  {
    rating: 4,
    comment: "Chuyến đi rất vui và nhiều kỷ niệm đẹp. Các điểm tham quan đúng như cam kết, hướng dẫn viên hài hước giúp không khí trên xe luôn sôi nổi. Sẽ giới thiệu bạn bè cùng đi.",
    images: [
      "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=600&auto=format&fit=crop&q=80"
    ]
  },
  {
    rating: 5,
    comment: "Một trải nghiệm vô cùng đáng nhớ cùng VNVIVU. Dịch vụ trọn gói từ A-Z không phát sinh phụ phí gì. Đánh giá 5 sao cho sự uy tín và tận tâm của công ty!",
    images: []
  },
  {
    rating: 5,
    comment: "Chuyến đi mang lại cảm giác thư giãn thật sự. Phòng khách sạn sang trọng, bữa tiệc tối đặc sản vùng miền rất ngon. Chắc chắn sẽ quay lại!",
    images: [
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80"
    ]
  }
];

async function seedReviews() {
  try {
    console.log("🔄 Đang kết nối Database MongoDB...");
    await mongoose.connect(process.env.DATABASE);
    console.log("✅ Kết nối Database thành công!");

    // 1. Tạo hoặc lấy danh sách Users
    let users = await User.find({ deleted: false });
    if (users.length < 5) {
      console.log("👤 Đang tạo thêm người dùng mẫu...");
      for (const mockU of MOCK_USERS) {
        const exist = await User.findOne({ email: mockU.email });
        if (!exist) {
          await User.create({
            ...mockU,
            password: "hashed_dummy_password_for_mock",
            status: "active"
          });
        }
      }
      users = await User.find({ deleted: false });
    }
    console.log(`✅ Tìm thấy ${users.length} tài khoản người dùng.`);

    // 2. Lấy danh sách Tours
    const tours = await Tour.find({ deleted: false, status: "active" });
    console.log(`🏖️ Tìm thấy ${tours.length} tour đang hoạt động.`);

    if (tours.length === 0) {
      console.log("⚠️ Không có tour nào để thêm đánh giá.");
      process.exit(0);
    }

    let totalReviewsCreated = 0;

    // 3. Duyệt từng tour và tạo ngẫu nhiên 3 - 6 đánh giá
    for (const tour of tours) {
      // Xóa các review cũ nếu cần (hoặc chỉ tạo nếu chưa có)
      const existingReviewsCount = await Review.countDocuments({ tourId: tour._id, deleted: false });
      
      // Số lượng review muốn tạo cho tour này (từ 3 đến 6 review)
      const targetCount = 3 + Math.floor(Math.random() * 4);
      const neededCount = Math.max(0, targetCount - existingReviewsCount);

      if (neededCount > 0) {
        // Trộn ngẫu nhiên users
        const shuffledUsers = [...users].sort(() => 0.5 - Math.random());

        for (let i = 0; i < neededCount && i < shuffledUsers.length; i++) {
          const user = shuffledUsers[i];
          
          // Kiểm tra xem user này đã review tour này chưa
          const alreadyReviewed = await Review.findOne({ userId: user._id, tourId: tour._id });
          if (alreadyReviewed) continue;

          // Lấy ngẫu nhiên 1 nhận xét
          const mockReview = MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];
          
          // Tạo ngày đánh giá ngẫu nhiên trong vòng 1-60 ngày gần đây
          const daysAgo = Math.floor(Math.random() * 60) + 1;
          const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

          await Review.create({
            userId: user._id,
            tourId: tour._id,
            rating: mockReview.rating,
            comment: mockReview.comment,
            images: mockReview.images,
            status: "active",
            deleted: false,
            createdAt: createdAt,
            updatedAt: createdAt
          });

          totalReviewsCreated++;
        }
      }

      // 4. Tính toán lại ratingAverage và ratingQuantity cho Tour
      const allTourReviews = await Review.find({ tourId: tour._id, status: "active", deleted: false });
      const qty = allTourReviews.length;
      let avg = 5.0;
      if (qty > 0) {
        const sum = allTourReviews.reduce((acc, cur) => acc + cur.rating, 0);
        avg = Math.round((sum / qty) * 10) / 10;
      }

      await Tour.updateOne(
        { _id: tour._id },
        {
          ratingAverage: avg,
          ratingQuantity: qty
        }
      );

      console.log(`⭐ Tour "${tour.name}": ${qty} đánh giá, điểm TB: ${avg}/5.0`);
    }

    console.log(`\n🎉 HOÀN TẤT! Đã tạo thêm ${totalReviewsCreated} đánh giá mẫu chân thực và cập nhật số sao cho toàn bộ các tour.`);
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error("❌ Lỗi khi tạo đánh giá mẫu:", error);
    process.exit(1);
  }
}

seedReviews();

