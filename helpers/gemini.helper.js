const axios = require("axios");

// Kiểm tra nhanh các mẫu câu tấn công Prompt Injection
const isPromptInjection = (message = "") => {
  const lower = message.toLowerCase();
  const dangerousPatterns = [
    "ignore previous instructions",
    "ignore all instructions",
    "quên hết vai trò",
    "quên vai trò",
    "bỏ qua các hướng dẫn",
    "hãy đóng vai hacker",
    "dan mode",
    "jailbreak",
    "viết mã độc",
    "tấn công ddos",
    "viết virus"
  ];
  return dangerousPatterns.some(pattern => lower.includes(pattern));
};

// Kiểm tra xem câu hỏi có thuộc lĩnh vực du lịch / dịch vụ website hay không
const isTravelRelated = (message = "") => {
  const lower = message.toLowerCase();
  const travelKeywords = [
    "tour", "du lịch", "đi chơi", "nghỉ dưỡng", "vé", "giá", "tiền", "triệu", "nghìn", "đồng",
    "đà nẵng", "hội an", "hà nội", "sapa", "hạ long", "phú quốc", "nha trang", "đà lạt", "quy nhơn", "huế",
    "máy bay", "khách sạn", "resort", "biển", "núi", "đảo", "lịch trình", "ngày", "đêm",
    "đặt tour", "hủy", "hoàn tiền", "thanh toán", "vnpay", "zalopay", "liên hệ", "hotline",
    "tư vấn", "gợi ý", "combo", "ăn uống", "địa điểm", "checkin", "check in", "visa",
    "xin chào", "chào em", "chào bot", "hi", "hello", "bạn là ai", "ai đó"
  ];
  return travelKeywords.some(kw => lower.includes(kw));
};

// Kiểm tra xem câu trả lời có phải là từ chối ngoài phạm vi hay không
const isOutOfScopeReply = (replyText = "") => {
  const lower = replyText.toLowerCase();
  return lower.includes("chỉ được đào tạo chuyên sâu") || 
         lower.includes("ngoài phạm vi") ||
         lower.includes("không thể trả lời câu hỏi này") ||
         lower.includes("không liên quan đến du lịch");
};

// Xây dựng System Prompt với dữ liệu tour thực tế
const buildSystemInstruction = (tours = [], websiteInfo = {}) => {
  const webName = websiteInfo.websiteName || "VNVIVU";
  const hotline = websiteInfo.phone || "0987.654.321";
  const email = websiteInfo.email || "support@vnvivu.com";

  let toursContext = "Hiện tại không có tour nào phù hợp với bộ lọc trong hệ thống.";
  if (tours.length > 0) {
    toursContext = tours.map((t, idx) => {
      const priceAdult = (t.priceNewAdult || t.priceAdult || 0).toLocaleString("vi-VN");
      const locations = Array.isArray(t.locations) ? t.locations.join(", ") : (t.locations || "");
      return `${idx + 1}. Tên Tour: "${t.name}" | Giá: ${priceAdult} VNĐ/khách | Thời gian: ${t.time || "N/A"} | Khởi hành từ: ${t.locationFrom || "Toàn quốc"} | Điểm đến: ${locations} | Link đặt: /tour/detail/${t.slug}`;
    }).join("\n");
  }

  return `Bạn là "ViVu AI" - Trợ lý ảo tư vấn du lịch chính thức của website ${webName}.
Hotline hỗ trợ khách hàng: ${hotline} - Email: ${email}.

[NHIỆM VỤ CỦA BẠN]
1. Tư vấn, giải đáp thắc mắc và gợi ý tour du lịch phù hợp dựa trên nhu cầu (ngân sách, số lượng người, sở thích biển/núi/khám phá, thời gian khởi hành).
2. Hướng dẫn khách hàng các thủ tục đặt tour, thanh toán trực tuyến (hỗ trợ Cổng VNPAY và ZALOPAY), kiểm tra giỏ hàng, thông tin chính sách hoàn/hủy tour.

[DỮ LIỆU TOUR THỰC TẾ TRONG HỆ THỐNG]:
${toursContext}

[QUY TẮC CỐT LÕI - BẮT BUỘC TUÂN THỦ]:
1. CHỈ DÙNG DỮ LIỆU THẬT: Tuyệt đối KHÔNG tự sáng tác ra giá tour, mã tour hoặc lịch trình không có trong danh sách trên.
2. NẾU KHÔNG CÓ TOUR THEO YÊU CẦU: Hãy trả lời thành thật và khéo léo: "Dạ hiện tại VNVIVU chưa có tour đến [Địa điểm], nhưng em xin gợi ý các tour hấp dẫn khác..." và giới thiệu 1-2 tour có sẵn hoặc mời liên hệ hotline ${hotline}.
3. TỪ CHỐI CÂU HỎI NGOÀI PHẠM VI (GUARDRAILS): Nếu người dùng hỏi những vấn đề KHÔNG LIÊN QUAN đến du lịch, ẩm thực, lịch trình, địa điểm hoặc dịch vụ của VNVIVU (ví dụ: giải toán, viết code, làm thơ tình, bóng đá, chính trị, chuyện phiếm không liên quan):
   => BẮT BUỘC TỪ CHỐI LỊCH SỰ: "Dạ, ViVu AI chỉ được đào tạo chuyên sâu để hỗ trợ tư vấn du lịch cho VNVIVU thôi ạ. Em có thể giúp Anh/Chị tìm kiếm một chuyến vi vu tuyệt vời sắp tới không ạ? 😊" và KHÔNG gợi ý danh sách tour khi từ chối.
4. PHONG CÁCH: Thân thiện, tôn trọng, xưng "Em" và gọi khách là "Anh/Chị" hoặc "Quý khách". Dùng icon sinh động (✈️, 🏖️, 🎒, 🌟, 💰). Format gạch đầu dòng rõ ràng, súc tích.
5. LUÔN KÈM LINK CHI TIẾT: Mỗi khi nhắc đến một tour, hãy chèn link dạng Markdown: [Xem chi tiết & Đặt tour](/tour/detail/slug-cua-tour).`;
};

// Fallback thông minh khi chưa có API Key hoặc hết quota
const smartLocalFallback = (userMessage, tours = [], websiteInfo = {}) => {
  const msg = (userMessage || "").toLowerCase();
  const hotline = websiteInfo.phone || "0987.654.321";

  // 1. Kiểm tra Prompt Injection hoặc câu hỏi ngoài phạm vi
  if (isPromptInjection(msg) || !isTravelRelated(msg)) {
    return "Dạ, ViVu AI chỉ được đào tạo chuyên sâu để hỗ trợ tư vấn du lịch cho VNVIVU thôi ạ. Em có thể giúp Anh/Chị tìm kiếm một chuyến vi vu tuyệt vời sắp tới không ạ? 😊";
  }

  // 2. Khách hỏi chính sách thanh toán
  if (msg.includes("thanh toán") || msg.includes("zalopay") || msg.includes("vnpay") || msg.includes("trả tiền")) {
    return `Dạ, VNVIVU hỗ trợ thanh toán an toàn và tiện lợi qua 2 cổng thanh toán trực tuyến hàng đầu:
- **Cổng VNPAY**: Quét mã QR, thẻ ATM nội địa, thẻ quốc tế Visa/MasterCard.
- **Cổng ZALOPAY**: Thanh toán qua ví điện tử ZaloPay hoặc thẻ ngân hàng liên kết.
Ngoài ra Anh/Chị có thể liên hệ hotline **${hotline}** để được hướng dẫn thêm ạ! 💳✈️`;
  }

  // 3. Khách hỏi chính sách hủy/hoàn tour
  if (msg.includes("hủy") || msg.includes("hoàn") || msg.includes("đổi ngày")) {
    return `Dạ về chính sách hủy/đổi tour của VNVIVU:
- Hủy trước 7 ngày khởi hành: Miễn phí hoàn tiền 100%.
- Hủy trước từ 3 - 6 ngày: Phí hủy là 50% giá trị tour.
- Hủy trong vòng 48h trước giờ đi: Không áp dụng hoàn tiền.
Để được hỗ trợ trường hợp khẩn cấp, Anh/Chị vui lòng liên hệ ngay hotline **${hotline}** nhé ạ!`;
  }

  // 4. Khách hỏi tour đắt nhất / giá cao nhất
  if (tours.length > 0 && (msg.includes("đắt nhất") || msg.includes("cao nhất") || msg.includes("vip nhất") || msg.includes("giá cao") || msg.includes("đắt tiền"))) {
    const topExpensive = [...tours].sort((a, b) => (b.priceNewAdult || b.priceAdult || 0) - (a.priceNewAdult || a.priceAdult || 0))[0];
    const price = (topExpensive.priceNewAdult || topExpensive.priceAdult || 0).toLocaleString("vi-VN");
    return `Dạ, tour có mức giá cao nhất và đẳng cấp nhất tại VNVIVU hiện tại là **${topExpensive.name}** ạ! ✈️👑\n\n- 💰 Giá tour: **${price} VNĐ/khách**\n- ⏱️ Thời gian: ${topExpensive.time || "Nhiều ngày"}\n- 🏙️ Điểm đến: ${Array.isArray(topExpensive.locations) ? topExpensive.locations.join(", ") : (topExpensive.locations || "Hấp dẫn")}\n- 👉 [Xem chi tiết & Đặt tour](/tour/detail/${topExpensive.slug})\n\nĐây là chuyến hành trình du lịch cao cấp với những trải nghiệm dịch vụ chuẩn quốc tế đó ạ! Anh/Chị có thể bấm vào link trên để tham khảo lịch trình chi tiết nhé.`;
  }

  // 5. Khách hỏi tour rẻ nhất / tiết kiệm nhất
  if (tours.length > 0 && (msg.includes("rẻ nhất") || msg.includes("thấp nhất") || msg.includes("tiết kiệm nhất") || msg.includes("bình dân nhất"))) {
    const topCheapest = [...tours].sort((a, b) => (a.priceNewAdult || a.priceAdult || 0) - (b.priceNewAdult || b.priceAdult || 0))[0];
    const price = (topCheapest.priceNewAdult || topCheapest.priceAdult || 0).toLocaleString("vi-VN");
    return `Dạ, tour có mức giá tiết kiệm và rẻ nhất hiện tại tại VNVIVU là **${topCheapest.name}** ạ! 🎒🌟\n\n- 💰 Giá ưu đãi: **${price} VNĐ/khách**\n- ⏱️ Thời gian: ${topCheapest.time || "Trong ngày"}\n- 🏙️ Điểm đến: ${Array.isArray(topCheapest.locations) ? topCheapest.locations.join(", ") : (topCheapest.locations || "Hấp dẫn")}\n- 👉 [Xem chi tiết & Đặt tour](/tour/detail/${topCheapest.slug})\n\nMột chuyến đi cực kỳ hợp lý để vi vu xả stress với chi phí vô cùng phải chăng ạ!`;
  }

  // 6. Khách hỏi tour theo ngân sách hoặc địa điểm chung
  if (tours.length > 0) {
    const list = tours.slice(0, 3).map(t => {
      const price = (t.priceNewAdult || t.priceAdult || 0).toLocaleString("vi-VN");
      return `✨ **${t.name}**\n- 💰 Giá ưu đãi: **${price} VNĐ/khách**\n- ⏱️ Thời gian: ${t.time || "Nhiều ngày"}\n- 👉 [Xem chi tiết & Đặt tour](/tour/detail/${t.slug})`;
    }).join("\n\n");

    return `Dạ, em xin gợi ý các tour du lịch cực hot tại VNVIVU phù hợp với Anh/Chị đây ạ:\n\n${list}\n\nAnh/Chị có thể bấm vào link để xem chi tiết lịch trình và đặt vé ngay nhé! 🎒🌟`;
  }

  return `Dạ hiện tại VNVIVU chưa có tour chính xác theo yêu cầu của Anh/Chị hoặc đang cập nhật lịch mới. Anh/Chị có thể liên hệ hotline **${hotline}** hoặc tham khảo thêm danh mục tour trên trang chủ nhé ạ! 🏖️✈️`;
};

// Gọi Google Gemini API với cơ chế tự động chuyển model thông minh
const askGemini = async ({ userMessage, history = [], relevantTours = [], websiteInfo = {} }) => {
  // 1. Kiểm tra Prompt Injection trước tiên
  if (isPromptInjection(userMessage)) {
    return {
      text: "Dạ, ViVu AI chỉ được đào tạo chuyên sâu để hỗ trợ tư vấn du lịch cho VNVIVU thôi ạ. Em có thể giúp Anh/Chị tìm kiếm một chuyến vi vu tuyệt vời sắp tới không ạ? 😊",
      isFallback: false,
      isOutOfScope: true
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Nếu chưa cấu hình API Key -> chuyển sang Fallback thông minh
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    const fallbackText = smartLocalFallback(userMessage, relevantTours, websiteInfo);
    return {
      text: fallbackText,
      isFallback: true,
      isOutOfScope: isOutOfScopeReply(fallbackText)
    };
  }

  // Danh sách các model ưu tiên (tự động thử model tiếp theo nếu model trước bận/404)
  const candidateModels = [
    process.env.GEMINI_MODEL || "gemini-3.5-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.8-flash"
  ].filter((v, idx, arr) => arr.indexOf(v) === idx);

  const systemInstruction = buildSystemInstruction(relevantTours, websiteInfo);

  // Chuyển đổi lịch sử chat cho Gemini API
  const contents = [];
  if (Array.isArray(history)) {
    history.slice(-6).forEach(item => {
      if (item.sender === "user" && item.text) {
        contents.push({ role: "user", parts: [{ text: item.text }] });
      } else if (item.sender === "bot" && item.text) {
        contents.push({ role: "model", parts: [{ text: item.text }] });
      }
    });
  }

  // Thêm câu hỏi hiện tại
  contents.push({
    role: "user",
    parts: [{ text: userMessage }]
  });

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.2, // Giảm temperature để trả lời chuẩn xác và tuân thủ chặt chẽ guardrails
      maxOutputTokens: 1000
    }
  };

  // Thử lần lượt các model cho đến khi thành công
  for (const modelName of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await axios.post(endpoint, requestBody, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000
      });

      const candidate = response.data?.candidates?.[0];
      const botText = candidate?.content?.parts?.[0]?.text;

      if (botText) {
        return {
          text: botText,
          isFallback: false,
          isOutOfScope: isOutOfScopeReply(botText),
          modelUsed: modelName
        };
      }
    } catch (err) {
      console.warn(`Model ${modelName} gặp lỗi:`, err.response?.status, err.response?.data?.error?.message || err.message);
    }
  }

  // Nếu tất cả các model AI đều bận hoặc lỗi mạng -> kích hoạt Smart Fallback
  console.warn("Tất cả các model Gemini đều không phản hồi, kích hoạt Smart Fallback.");
  const fallbackText = smartLocalFallback(userMessage, relevantTours, websiteInfo);
  return {
    text: fallbackText,
    isFallback: true,
    isOutOfScope: isOutOfScopeReply(fallbackText)
  };
};

module.exports = {
  askGemini,
  isPromptInjection,
  isTravelRelated,
  isOutOfScopeReply,
  smartLocalFallback,
  buildSystemInstruction
};
