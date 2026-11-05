const Tour = require("../../models/tour.model");
const SettingwebsiteInfo = require("../../models/setting-website-model");
const geminiHelper = require("../../helpers/gemini.helper");

// Bộ nhớ đệm giới hạn tần suất gửi tin nhắn (Rate Limiting)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 phút
const MAX_REQUESTS_PER_WINDOW = 15; // Tối đa 15 câu/phút

// Danh sách từ dừng (Stopwords) tiếng Việt không dùng để tìm tên tour
const STOP_WORDS = new Set([
  "tour", "du", "lịch", "cho", "các", "nhất", "nào", "em", "anh", "chị", "bên", "mình",
  "vậy", "đi", "được", "không", "có", "là", "và", "nhé", "với", "đắt", "rẻ", "cao",
  "thấp", "tiết", "kiệm", "giá", "tiền", "bao", "nhiêu", "hỏi", "xem", "tư", "vấn", "gợi", "ý"
]);

// Gợi ý nhanh các câu hỏi mẫu
module.exports.getSuggestions = (req, res) => {
  const suggestions = [
    "🔥 Gợi ý tour hot nổi bật tuần này",
    "👑 Tour đắt nhất bên mình là tour nào?",
    "💰 Tour rẻ nhất hiện tại là tour nào?",
    "🏖️ Các tour du lịch biển đảo đẹp nhất",
    "💳 Hướng dẫn thanh toán qua VNPay & ZaloPay",
    "📝 Chính sách hủy và hoàn tiền tour"
  ];
  return res.json({
    code: 200,
    success: true,
    suggestions
  });
};

// Xử lý gửi tin nhắn Chatbot
module.exports.postMessage = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: "Nội dung câu hỏi không được để trống."
      });
    }

    const cleanMessage = message.trim();

    // 1. Kiểm tra Rate Limiting chống spam
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global_user";
    const now = Date.now();
    const clientLimit = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

    if (now > clientLimit.resetTime) {
      clientLimit.count = 1;
      clientLimit.resetTime = now + RATE_LIMIT_WINDOW_MS;
    } else {
      clientLimit.count += 1;
      if (clientLimit.count > MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
          code: 429,
          success: false,
          reply: "Bạn đang gửi câu hỏi quá nhanh! Vui lòng chờ 1 phút trước khi hỏi tiếp nhé. ⏳"
        });
      }
    }
    rateLimitMap.set(clientIp, clientLimit);

    // 2. Phân tích ý định người dùng (Intent Analysis) & Sắp xếp (Sorting)
    const lowerMsg = cleanMessage.toLowerCase();
    const findConditions = {
      deleted: false,
      status: "active"
    };

    let sortOrder = { isFeatured: -1, createdAt: -1 };
    let isPriceRankingQuery = false;

    // Phát hiện ý định hỏi Tour đắt nhất / giá cao nhất
    if (
      lowerMsg.includes("đắt nhất") ||
      lowerMsg.includes("cao nhất") ||
      lowerMsg.includes("giá cao") ||
      lowerMsg.includes("đắt tiền") ||
      lowerMsg.includes("vip nhất") ||
      lowerMsg.includes("sang trọng nhất")
    ) {
      sortOrder = { priceNewAdult: -1, priceAdult: -1 };
      isPriceRankingQuery = true;
    } 
    // Phát hiện ý định hỏi Tour rẻ nhất / tiết kiệm nhất
    else if (
      lowerMsg.includes("rẻ nhất") ||
      lowerMsg.includes("thấp nhất") ||
      lowerMsg.includes("tiết kiệm nhất") ||
      lowerMsg.includes("giá thấp") ||
      lowerMsg.includes("bình dân nhất")
    ) {
      sortOrder = { priceNewAdult: 1, priceAdult: 1 };
      isPriceRankingQuery = true;
    }

    // Nếu hỏi theo khoảng giá cụ thể (ví dụ: "dưới 2 triệu", "3tr", "500k")
    const priceMatch = cleanMessage.match(/(\d+)\s*(triệu|tr|k|nghìn)/i);
    let maxPriceFilter = null;
    if (priceMatch) {
      const val = parseInt(priceMatch[1]);
      const unit = priceMatch[2].toLowerCase();
      if (unit.startsWith("tr")) maxPriceFilter = val * 1000000;
      else if (unit === "k" || unit.startsWith("ngh")) maxPriceFilter = val * 1000;
    }

    if (maxPriceFilter) {
      findConditions.priceNewAdult = { $lte: maxPriceFilter };
    }

    // Tách từ khóa tìm kiếm địa danh/tên tour thực sự (đã loại bỏ stop words)
    const rawWords = cleanMessage
      .replace(/[?!.,;:()]/g, " ")
      .split(" ")
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 1 && !STOP_WORDS.has(w));

    // Chỉ áp dụng bộ lọc $or từ khóa khi không phải là câu hỏi so sánh xếp hạng (đắt/rẻ nhất)
    if (!isPriceRankingQuery && rawWords.length > 0) {
      const orQuery = [];
      rawWords.forEach(kw => {
        const safeKw = kw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const regex = new RegExp(safeKw, "i");
        orQuery.push({ name: regex });
        orQuery.push({ locations: regex });
        orQuery.push({ locationFrom: regex });
      });
      if (orQuery.length > 0) {
        findConditions.$or = orQuery;
      }
    }

    // Thực hiện truy vấn DB với thứ tự sắp xếp chuẩn xác
    let relevantTours = await Tour.find(findConditions)
      .sort(sortOrder)
      .select("name priceAdult priceNewAdult time locationFrom locations slug avatar isFeatured")
      .limit(10)
      .lean();

    // Nếu tìm kiếm từ khóa không ra kết quả, lấy danh sách tour theo thứ tự sắp xếp ý định
    if (relevantTours.length === 0) {
      relevantTours = await Tour.find({ deleted: false, status: "active" })
        .sort(sortOrder)
        .select("name priceAdult priceNewAdult time locationFrom locations slug avatar isFeatured")
        .limit(10)
        .lean();
    }

    // 3. Lấy thông tin cấu hình website (Hotline, Email)
    const websiteInfo = await SettingwebsiteInfo.findOne({}).lean() || {};

    // 4. Gọi Gemini AI xử lý
    const aiResult = await geminiHelper.askGemini({
      userMessage: cleanMessage,
      history: Array.isArray(history) ? history : [],
      relevantTours,
      websiteInfo
    });

    // 5. Chuẩn bị danh sách thẻ tour gợi ý đính kèm nếu câu trả lời liên quan đến Tour
    let tourCards = [];
    const isOutOfScope = aiResult.isOutOfScope || geminiHelper.isOutOfScopeReply(aiResult.text);

    if (!isOutOfScope && relevantTours.length > 0) {
      const shouldAttachCards = geminiHelper.isTravelRelated(cleanMessage) && 
        (aiResult.text.includes("/tour/detail/") || aiResult.text.toLowerCase().includes("tour") || aiResult.text.toLowerCase().includes("gợi ý"));

      if (shouldAttachCards) {
        // Nếu hỏi tour đắt nhất / rẻ nhất thì chỉ đính kèm đúng tour đứng đầu
        const sliceCount = isPriceRankingQuery ? 1 : 3;

        // Ưu tiên các tour thực sự được nhắc đến trong câu trả lời của AI
        const mentionedTours = relevantTours.filter(t => 
          aiResult.text.includes(t.slug) || aiResult.text.toLowerCase().includes(t.name.toLowerCase())
        );

        const finalTours = mentionedTours.length > 0
          ? mentionedTours.concat(relevantTours.filter(t => !mentionedTours.includes(t)))
          : relevantTours;

        tourCards = finalTours.slice(0, sliceCount).map(t => ({
          name: t.name,
          slug: t.slug,
          avatar: t.avatar,
          time: t.time || "Nhiều ngày",
          price: (t.priceNewAdult || t.priceAdult || 0).toLocaleString("vi-VN") + " VNĐ"
        }));
      }
    }

    return res.json({
      code: 200,
      success: true,
      reply: aiResult.text,
      tours: tourCards,
      isFallback: aiResult.isFallback || false,
      isOutOfScope: isOutOfScope,
      note: aiResult.note || null
    });

  } catch (error) {
    console.error("Lỗi Controller Chat:", error);
    return res.status(500).json({
      code: 500,
      success: false,
      reply: "Dạ hiện tại hệ thống kết nối AI đang bận trong giây lát. Anh/Chị vui lòng thử lại sau hoặc liên hệ Hotline để được hỗ trợ ngay nhé! 📞"
    });
  }
};
