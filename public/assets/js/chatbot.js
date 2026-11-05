// =====================================================
// VNVIVU Luxury Travel Concierge Client Logic
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  const triggerBtn = document.getElementById("chatbotTrigger");
  const windowEl = document.getElementById("chatbotWindow");
  const closeBtn = document.getElementById("chatbotCloseBtn");
  const clearBtn = document.getElementById("chatbotClearBtn");
  const formEl = document.getElementById("chatbotForm");
  const inputEl = document.getElementById("chatbotInput");
  const sendBtn = document.getElementById("chatbotSendBtn");
  const bodyEl = document.getElementById("chatbotBody");
  const typingIndicator = document.getElementById("chatbotTypingIndicator");
  const suggestionsEl = document.getElementById("chatbotSuggestions");
  const teaserEl = document.getElementById("chatbotTeaser");
  const teaserCloseBtn = document.getElementById("chatbotTeaserClose");

  if (!triggerBtn || !windowEl) return;

  const STORAGE_KEY = "vnvivu_concierge_history";
  const TEASER_STORAGE_KEY = "vnvivu_teaser_dismissed";
  let chatHistory = [];

  // Mini Concierge Avatar SVG
  const CONCIERGE_AVATAR_HTML = `
    <div class="message-avatar">
      <svg class="avatar-mini-svg" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="32" fill="#EDE9FE"/>
        <circle cx="32" cy="25" r="14" fill="#FCD5B5"/>
        <path d="M18 24C18 15 24 10 32 10C40 10 46 15 46 24Z" fill="#3D2314"/>
        <circle cx="27" cy="24" r="1.8" fill="#3D2314"/>
        <circle cx="37" cy="24" r="1.8" fill="#3D2314"/>
        <path d="M28 29C29.5 32 34.5 32 36 29" stroke="#E05757" stroke-width="1.8"/>
        <path d="M12 58C12 46 20 42 32 42C44 42 52 46 52 58" fill="#4502C7"/>
      </svg>
    </div>
  `;

  const USER_AVATAR_HTML = `
    <div class="message-avatar" style="background: linear-gradient(135deg, #4502C7, #6D28D9); color: #FFF; border: none;">
      <i class="fa-solid fa-user" style="font-size: 13px;"></i>
    </div>
  `;

  // 1. Quản lý Lời chào nổi (Teaser)
  if (teaserEl) {
    if (sessionStorage.getItem(TEASER_STORAGE_KEY) === "true") {
      teaserEl.classList.add("hidden");
    }

    teaserEl.addEventListener("click", (e) => {
      if (e.target.closest("#chatbotTeaserClose")) return;
      openChat();
    });

    if (teaserCloseBtn) {
      teaserCloseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        teaserEl.classList.add("hidden");
        sessionStorage.setItem(TEASER_STORAGE_KEY, "true");
      });
    }
  }

  // 2. Tải lịch sử từ sessionStorage
  const loadHistory = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        chatHistory = JSON.parse(saved);
        chatHistory.forEach(item => {
          renderMessage(item.sender, item.text, item.time, false, item.tours);
        });
      }
    } catch (e) {
      console.warn("Không thể tải lịch sử chat:", e);
    }
  };

  // 3. Lưu lịch sử vào sessionStorage
  const saveHistory = () => {
    try {
      const toSave = chatHistory.slice(-20);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn("Lỗi lưu lịch sử chat:", e);
    }
  };

  // 4. Format thời gian (HH:mm)
  const getCurrentTime = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  // 5. Chuyển đổi Markdown cơ bản sang HTML an toàn
  const parseMarkdown = (rawText = "") => {
    let escaped = rawText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold **text**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Italic *text*
    escaped = escaped.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Links [Text](url)
    escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    // Bullet points "- item" hoặc "* item"
    const lines = escaped.split("\n");
    let inList = false;
    let result = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ")) {
        if (!inList) {
          result.push("<ul style='margin: 6px 0; padding-left: 20px;'>");
          inList = true;
        }
        result.push(`<li style='margin-bottom: 3px;'>${trimmed.substring(2)}</li>`);
      } else {
        if (inList) {
          result.push("</ul>");
          inList = false;
        }
        result.push(line ? `<p style='margin: 4px 0;'>${line}</p>` : "<br>");
      }
    });

    if (inList) result.push("</ul>");
    return result.join("");
  };

  // 6. Render tin nhắn vào giao diện
  const renderMessage = (sender, text, time = null, save = true, tours = []) => {
    const timeStr = time || getCurrentTime();
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${sender === "user" ? "user-message" : "bot-message"}`;

    const avatarHtml = sender === "user" ? USER_AVATAR_HTML : CONCIERGE_AVATAR_HTML;

    let cardsHtml = "";
    if (tours && Array.isArray(tours) && tours.length > 0) {
      cardsHtml = tours.map(tour => `
        <div class="chatbot-tour-card">
          ${tour.avatar ? `<img src="${tour.avatar}" alt="${tour.name}" class="chatbot-tour-thumb" onerror="this.style.display='none'">` : ""}
          <div class="chatbot-tour-info">
            <h5 class="chatbot-tour-name" title="${tour.name}">${tour.name}</h5>
            <div class="chatbot-tour-price">${tour.price}</div>
            <a href="/tour/detail/${tour.slug}" class="chatbot-tour-btn">Khám phá tour <i class="fa-solid fa-arrow-right" style="font-size: 10px; margin-left: 2px;"></i></a>
          </div>
        </div>
      `).join("");
    }

    messageDiv.innerHTML = `
      ${avatarHtml}
      <div class="message-content">
        <div class="message-bubble">
          ${sender === "user" ? `<p style="margin:0">${text}</p>` : parseMarkdown(text)}
          ${cardsHtml}
        </div>
        <span class="message-time">${timeStr}</span>
      </div>
    `;

    // Chèn trước Typing Indicator
    bodyEl.insertBefore(messageDiv, typingIndicator);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    if (save) {
      chatHistory.push({ sender, text, time: timeStr, tours });
      saveHistory();
    }
  };

  // 7. Gửi tin nhắn đến Backend
  const sendMessage = async (userText) => {
    if (!userText || !userText.trim()) return;
    const cleanText = userText.trim();

    renderMessage("user", cleanText, null, true);
    inputEl.value = "";
    inputEl.focus();

    // Hiện Typing indicator
    typingIndicator.classList.remove("hidden");
    bodyEl.scrollTop = bodyEl.scrollHeight;
    sendBtn.disabled = true;

    try {
      const response = await fetch("/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: cleanText,
          history: chatHistory.map(h => ({ sender: h.sender, text: h.text }))
        })
      });

      const data = await response.json();
      typingIndicator.classList.add("hidden");
      sendBtn.disabled = false;

      if (data && data.reply) {
        renderMessage("bot", data.reply, null, true, data.tours || []);
      } else {
        renderMessage("bot", "Dạ em xin lỗi, tạm thời em chưa xử lý được câu hỏi này. Anh/Chị vui lòng thử lại nhé ạ! 🙏");
      }
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      typingIndicator.classList.add("hidden");
      sendBtn.disabled = false;
      renderMessage("bot", "⚠️ Có lỗi kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc thử lại sau ít phút ạ.");
    }
  };

  // 8. Các hàm điều khiển Mở / Đóng
  const openChat = () => {
    windowEl.classList.remove("hidden");
    if (teaserEl) {
      teaserEl.classList.add("hidden");
      sessionStorage.setItem(TEASER_STORAGE_KEY, "true");
    }
    inputEl.focus();
    bodyEl.scrollTop = bodyEl.scrollHeight;
  };

  const closeChat = () => {
    windowEl.classList.add("hidden");
  };

  triggerBtn.addEventListener("click", () => {
    if (windowEl.classList.contains("hidden")) {
      openChat();
    } else {
      closeChat();
    }
  });

  closeBtn.addEventListener("click", closeChat);

  // Phím Escape để đóng chat
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !windowEl.classList.contains("hidden")) {
      closeChat();
    }
  });

  // 9. Làm mới cuộc trò chuyện
  clearBtn.addEventListener("click", () => {
    if (confirm("Anh/Chị có muốn làm mới cuộc trò chuyện với tư vấn viên không?")) {
      chatHistory = [];
      sessionStorage.removeItem(STORAGE_KEY);
      
      const allMsgs = bodyEl.querySelectorAll(".chat-message:not(.typing-indicator)");
      allMsgs.forEach((msg, idx) => {
        if (idx > 0) msg.remove();
      });
      bodyEl.scrollTop = 0;
    }
  });

  // 10. Submit Form
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(inputEl.value);
  });

  // 11. Bấm vào Gợi ý nhanh (Quick chips)
  if (suggestionsEl) {
    suggestionsEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".suggestion-chip");
      if (chip) {
        const promptText = chip.getAttribute("data-prompt");
        if (promptText) {
          sendMessage(promptText);
        }
      }
    });
  }

  // Tải lịch sử khi khởi động
  loadHistory();
});
