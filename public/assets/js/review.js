// ============================================================
// VNVIVU - Tour Reviews & Rating Client Logic
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const reviewsWrapper = document.querySelector(".box-tour-reviews");
  if (!reviewsWrapper) return;

  const form = document.getElementById("formReviewTour");
  const starsContainer = document.getElementById("reviewStarsSelect");
  const ratingInput = document.getElementById("reviewRatingInput");
  const ratingHint = document.getElementById("reviewRatingHint");
  const fileInput = document.getElementById("reviewImagesInput");
  const previewsContainer = document.getElementById("reviewImagePreviews");
  const submitBtn = document.getElementById("btnSubmitReview");

  const ratingDescriptions = {
    1: "1 sao - Rất không hài lòng",
    2: "2 sao - Chưa hài lòng",
    3: "3 sao - Bình thường",
    4: "4 sao - Hài lòng",
    5: "5 sao - Tuyệt vời!",
  };

  // --- 1. TƯƠNG TÁC CHỌN SỐ SAO (RATING STARS) ---
  if (starsContainer && ratingInput) {
    const starItems = starsContainer.querySelectorAll(".star-item");

    const updateStarsDisplay = (value) => {
      starItems.forEach((star) => {
        const starVal = parseInt(star.getAttribute("data-value"));
        if (starVal <= value) {
          star.classList.add("selected");
        } else {
          star.classList.remove("selected");
        }
      });
      if (ratingHint) {
        ratingHint.textContent = ratingDescriptions[value] || "Chọn số sao";
      }
    };

    // Khởi tạo giá trị ban đầu (nếu đã có đánh giá trước đó)
    const initialVal = parseInt(ratingInput.value) || 5;
    ratingInput.value = initialVal;
    updateStarsDisplay(initialVal);

    starItems.forEach((star) => {
      // Hover vào sao
      star.addEventListener("mouseenter", () => {
        const hoverVal = parseInt(star.getAttribute("data-value"));
        starItems.forEach((s) => {
          const sVal = parseInt(s.getAttribute("data-value"));
          if (sVal <= hoverVal) {
            s.classList.add("hovered");
          } else {
            s.classList.remove("hovered");
          }
        });
        if (ratingHint) {
          ratingHint.textContent = ratingDescriptions[hoverVal];
        }
      });

      // Click chọn sao
      star.addEventListener("click", () => {
        const selectedVal = parseInt(star.getAttribute("data-value"));
        ratingInput.value = selectedVal;
        updateStarsDisplay(selectedVal);
      });
    });

    // Rời chuột khỏi cụm sao: trả lại trạng thái đã chọn
    starsContainer.addEventListener("mouseleave", () => {
      starItems.forEach((s) => s.classList.remove("hovered"));
      const currentSelected = parseInt(ratingInput.value) || 0;
      updateStarsDisplay(currentSelected);
    });
  }

  // --- 2. XỬ LÝ UPLOAD VÀ PREVIEW ẢNH ---
  let selectedFiles = [];

  if (fileInput && previewsContainer) {
    fileInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);

      // Giới hạn tối đa 5 ảnh
      if (selectedFiles.length + files.length > 5) {
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "warning",
            title: "Giới hạn ảnh",
            text: "Bạn chỉ có thể tải lên tối đa 5 ảnh thực tế cho mỗi đánh giá.",
            confirmButtonColor: "#0284C7",
          });
        } else {
          alert("Bạn chỉ có thể tải lên tối đa 5 ảnh thực tế.");
        }
        return;
      }

      files.forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        selectedFiles.push(file);

        const reader = new FileReader();
        reader.onload = (event) => {
          const thumbBox = document.createElement("div");
          thumbBox.className = "preview-thumb-box";
          thumbBox.innerHTML = `
            <img src="${event.target.result}" alt="Preview" />
            <button type="button" class="remove-img-btn" title="Xóa ảnh">&times;</button>
          `;

          // Nút xóa ảnh đã chọn
          thumbBox.querySelector(".remove-img-btn").addEventListener("click", () => {
            const index = selectedFiles.indexOf(file);
            if (index > -1) {
              selectedFiles.splice(index, 1);
            }
            thumbBox.remove();
          });

          previewsContainer.appendChild(thumbBox);
        };
        reader.readAsDataURL(file);
      });

      // Reset input để có thể chọn lại file cùng tên nếu muốn
      fileInput.value = "";
    });
  }

  // --- 3. GỬI ĐÁNH GIÁ QUA AJAX (FETCH) ---
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const tourId = form.getAttribute("data-tour-id");
      const rating = parseInt(ratingInput.value);
      const commentEl = document.getElementById("reviewComment");
      const comment = commentEl ? commentEl.value.trim() : "";

      if (!rating || rating < 1 || rating > 5) {
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "warning",
            title: "Chưa chọn số sao",
            text: "Vui lòng chọn số sao đánh giá cho chuyến đi của bạn!",
            confirmButtonColor: "#0284C7",
          });
        }
        return;
      }

      if (!comment) {
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "warning",
            title: "Nội dung trống",
            text: "Vui lòng viết vài dòng cảm nhận hoặc góp ý về tour!",
            confirmButtonColor: "#0284C7",
          });
        }
        if (commentEl) commentEl.focus();
        return;
      }

      // Tạo FormData để upload kèm ảnh
      const formData = new FormData();
      formData.append("rating", rating);
      formData.append("comment", comment);

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      // Hiệu ứng loading nút submit
      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi đánh giá...`;

      try {
        const response = await fetch(`/tour/review/${tourId}`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: formData,
        });

        const data = await response.json();

        if (response.ok && data.code === "success") {
          if (typeof Swal !== "undefined") {
            await Swal.fire({
              icon: "success",
              title: "Thành công!",
              text: data.message,
              confirmButtonColor: "#0284C7",
              timer: 2500,
              showConfirmButton: true,
            });
          }
          // Tải lại trang để cập nhật review và điểm trung bình mới
          window.location.reload();
        } else {
          if (response.status === 401) {
            if (typeof Swal !== "undefined") {
              const result = await Swal.fire({
                icon: "info",
                title: "Yêu cầu đăng nhập",
                text: data.message || "Vui lòng đăng nhập để gửi đánh giá!",
                showCancelButton: true,
                confirmButtonText: "Đăng nhập ngay",
                cancelButtonText: "Để sau",
                confirmButtonColor: "#0284C7",
              });
              if (result.isConfirmed) {
                window.location.href = "/auth/login";
              }
            } else {
              window.location.href = "/auth/login";
            }
          } else {
            if (typeof Swal !== "undefined") {
              Swal.fire({
                icon: "warning",
                title: "Thông báo",
                text: data.message || "Không thể gửi đánh giá lúc này.",
                confirmButtonColor: "#0284C7",
              });
            } else {
              alert(data.message || "Lỗi gửi đánh giá.");
            }
          }
        }
      } catch (error) {
        console.error("Lỗi gửi đánh giá:", error);
        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "error",
            title: "Lỗi kết nối",
            text: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền và thử lại!",
            confirmButtonColor: "#0284C7",
          });
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    });
  }

  // --- 4. KHỞI TẠO VIEWERJS CHO ẢNH ĐÁNH GIÁ ---
  if (typeof Viewer !== "undefined") {
    const galleries = document.querySelectorAll(".review-gallery");
    galleries.forEach((gallery) => {
      new Viewer(gallery, {
        toolbar: true,
        navbar: true,
        title: false,
        tooltip: false,
      });
    });
  }
});

