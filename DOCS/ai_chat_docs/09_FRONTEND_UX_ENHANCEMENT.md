# TÀI LIỆU KỸ THUẬT: CHIẾN LƯỢC NÂNG CẤP FRONTEND VÀ TRẢI NGHIỆM NGƯỜI DÙNG (SNOTE UX V2)

Tài liệu này lưu trữ toàn bộ các quyết định kiến trúc giao diện, chuẩn thiết kế (Design System), hệ thống Theme Tokens, quy chuẩn Icons và trải nghiệm tương tác (Micro-interactions) được áp dụng cho **SNOTE**.

---

## 🎨 1. DESIGN SYSTEM & IDENTITY

1. **Bộ Phông Chữ (Typography):**
   - **Display / Heading:** `Plus Jakarta Sans`, `Outfit` – hiện đại, rõ ràng, độ tương phản cao, mang tính học thuật cao cấp.
   - **Body Text:** `Inter`, `-apple-system`, `Segoe UI` – tối ưu khả năng đọc bài viết dài và ghi chú học tập.
   - **Code / Technical:** `JetBrains Mono`, monospace – hiển thị mã nguồn, tags và số liệu kỹ thuật.

2. **Hệ Thống Bảng Màu & Theme Tokens (Dark / Light Mode):**
   - **Dark Theme (Default):** Nền chính `#090d16` (Deep Charcoal Slate), thẻ Card `#111827` (Zinc Slate), viền `rgba(255, 255, 255, 0.08)`, chữ chính `#f8fafc`, chữ phụ `#94a3b8`.
   - **Light Theme:** Nền chính `#f8fafc`, thẻ Card `#ffffff`, viền `rgba(0, 0, 0, 0.08)`, chữ chính `#0f172a`, chữ phụ `#64748b`.
   - **Accent Colors:** 
     - Điện Indigo / Electric Blue: `#6366f1` / `#4f46e5` (Hành động chính, Focus, Buttons).
     - Emerald Green: `#10b981` (Thành công, Task hoàn thành, Trạng thái online).
     - Amber / Orange: `#f59e0b` (Khẩn cấp vừa, Hạn nộp sắp tới).
     - Rose / Red: `#ef4444` (Khẩn cấp cao, Xóa, Lỗi, Thi cử).
     - Purple: `#8b5cf6` (Đồ án, Họp nhóm, Tín chỉ).

3. **Chuẩn Biểu Tượng (Iconography Standards):**
   - Thay thế toàn bộ Emojis hệ thống bằng bộ icon vector **Lucide Icons** (`lucide-react`) đồng nhất kích thước (`16px`, `18px`, `20px`) và độ dày nét nét chuẩn `1.75` - `2.0px`.

---

## ⚡ 2. CẢI TIẾN TRẢI NGHIỆM NGƯỜI DÙNG (UX ENHANCEMENTS)

1. **Soạn Thảo & Hiển Thị Ghi Chú (Markdown Experience):**
   - Tích hợp trình đọc `react-markdown` kết hợp `remark-gfm` hỗ trợ đầy đủ bảng biểu (tables), danh sách việc cần làm (tasklists), blockquote và code blocks.
   - Thanh công cụ soạn thảo trực quan nhanh (Heading, Bold, Italic, Code, List, Checkbox, Link).
   - Tự động tính toán số từ (Word Count) và thời gian đọc ước tính (Reading Time).
   - Chuyển đổi hiển thị Grid / List linh hoạt.

2. **Quản Lý Công Việc & Bảng Kanban (Task Flow):**
   - Kanban 3 cột hỗ trợ nút bấm chuyển tiếp nhanh sang các cột trạng thái tiếp theo.
   - Tính toán trực quan trạng thái hạn nộp (Quá hạn, Đến hạn hôm nay, Sắp tới).
   - Hiệu ứng ăn mừng (Celebration Confetti) với `canvas-confetti` khi hoàn thành bài tập / đồ án.

3. **Thời Khóa Biểu Tuần Thông Minh (Weekly Schedule):**
   - Hiển thị lưới 7 ngày với điểm nhấn ngày hiện tại.
   - Phân loại màu sắc rõ rệt theo loại sự kiện (Tiết học, Kỳ thi, Hạn chót, Họp nhóm).
   - Điều hướng tuần trước / tuần sau / tuần này tức thì.

4. **Dashboard Tiến Độ Học Tập Bento (Academic Metrics):**
   - Thẻ thống kê số lượng Ghi chú, % Công việc đã hoàn tất, Tổng số tín chỉ.
   - Bảng phân tích chi tiết tiến độ theo từng môn học trong học kỳ hiện tại.

5. **An Toàn Dữ Liệu & Sao Lưu 1-Click:**
   - Hỗ trợ tải về file JSON sao lưu đầy đủ kèm mã băm SHA-256 xác thực toàn vẹn dữ liệu.
