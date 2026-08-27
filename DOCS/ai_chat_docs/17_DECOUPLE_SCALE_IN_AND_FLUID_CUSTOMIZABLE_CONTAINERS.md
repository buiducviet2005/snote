# BÁO CÁO CẢI TIẾN: TÁCH BIỆT HOÀN TOÀN KHỎI KÍCH THƯỚC `animate-scale-in` & CHUYỂN SANG HIỂN THỊ TÙY BIẾN KÍCH THƯỚC THEO THẺ

## 1. Yêu Cầu và Vấn Đề
* **Yêu cầu từ người dùng:** Tắt hẳn sự phụ thuộc vào kích thước của `animate-scale-in`, các chức năng con nằm trong thẻ không bị ảnh hưởng, chuyển đổi sang cơ chế **hiển thị dựa vào tùy biến kích thước của thẻ hiển thị (Fluid, Content-Driven & User-Customizable Dimensions)**.

---

## 2. Các Thay Đổi Kiến Trúc Kỹ Thuật Đã Thực Hiện

### 2.1. Vô Hiệu Hóa Mọi Hiệu Ứng Bounding & Khóa Kích Thước do Scale ([`global.css`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/assets/styles/global.css))
* `.animate-scale-in` được chuyển đổi hoàn toàn sang cơ chế **Fade Thuần Túy** (`fadeIn` với `opacity 0 -> 1`), **loại bỏ 100% mọi thuộc tính `transform: scale(...)`**:
  * Không còn tạo ra stacking/bounding context nhân tạo của trình duyệt.
  * Toàn bộ các thẻ con (Select options, Popovers, Dropdowns, Tooltips, Datepickers, Split Panes) có thể tự do mở rộng, co giãn theo kích thước nội dung mà không bị kẹp lại.

---

### 2.2. Cơ Chế Tùy Biến Kích Thước Linh Hoạt Cho Mọi Thẻ Hiển Thị ([`Modal.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/components/common/Modal.tsx))
1. **Nút Phóng To / Thu Nhỏ Toàn Màn Hình (Maximize / Restore Button):**
   * Đã tích hợp sẵn nút Phóng to (`Maximize2` / `Minimize2`) ngay cạnh nút Đóng trên thanh Header của **tất cả Modal trong ứng dụng**.
   * Người dùng có thể click 1 chạm để chuyển đổi linh hoạt giữa:
     * **Kích thước Tiêu chuẩn**: Gọn gàng, vừa vặn với nội dung từng form.
     * **Kích thước Mở rộng Toàn Màn Hình (`modal-expanded`)**: Chiếm trọn `calc(100vw - 32px)` và `calc(100dvh - 32px)`, tận dụng 100% diện tích màn hình để soạn thảo ghi chú, xem trước tài liệu hoặc quản lý task đồ án.
2. **Kích Thước Fluid Theo Khung Chứa:**
   * Thay thế các kích thước pixel cứng bằng cơ chế tính toán động `min(96vw, maxWidth)`.

---

### 2.3. Tùy Biến Kích Thước Cho Floating AI Copilot ([`FloatingAiChatbot.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/ai/components/FloatingAiChatbot.tsx))
* Khung chat AI nổi được trang bị nút chuyển đổi kích thước:
  * Chế độ nhỏ gọn: `460px x 640px`.
  * Chế độ mở rộng thoáng đãng: `760px x 840px` (dễ dàng đọc các đoạn code dài, bài giảng tóm tắt).
  * Chế độ Fullscreen (`/ai-chat`): 1 click mở toàn màn hình.

---

## 3. Kết Quả Kiểm Thử

* `npm run build`: Hoàn thành kiểm tra biên dịch với mã thoát 0 (0 lỗi TypeScript / CSS / Vite).
* Toàn bộ các trang đăng nhập, đăng ký, danh sách ghi chú, modal ghi chú, đồ án, task, và AI chat đều chuyển động nhẹ nhàng, không bị giật hay giới hạn kích thước vùng bấm.
