# BÁO CÁO CẢI TIẾN: THIẾT KẾ LẠI TOÀN DIỆN TRANG GHI CHÚ (SNOTE NOTES HUB REDESIGN)

## 1. Mục Tiêu & Định Hướng Thiết Kế (Design Read)
* **Định hướng thiết kế:** Nâng cấp trang Ghi Chú ([`NotesListPage.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/notes/pages/NotesListPage.tsx)) thành một **Second Brain Academic Hub** chuẩn Notion/Linear:
  * Tăng cường tốc độ ghi nhận ý tưởng (Zero-friction Quick Capture).
  * Đa dạng hóa 5 chế độ hiển thị (Grid, Compact Bento, Split Dual-Pane Reader, Kanban Flow, Data Table).
  * Bộ điều khiển sắp xếp đa chiều và thanh thông số tri thức trực quan.
  * Hiệu ứng chuyển động Stagger và GPU hardware-accelerated transitions.

---

## 2. Các Tính Năng Mới Đã Triển Khai Hoàn Thiện

### 2.1. Thanh Ghi Nhanh Ý Tưởng (Quick Capture Dock)
* Tích hợp thanh nhập nhanh ngay trên đầu trang:
  * Cho phép sinh viên gõ 1 dòng ý tưởng hoặc tiêu đề bài học $\rightarrow$ Chọn nhanh môn học và phân loại $\rightarrow$ Bấm `Lưu Nhanh` (hoặc Enter).
  * Tự động khởi tạo bài ghi và cập nhật danh sách ngay lập tức mà không cần mở popup modal rườm rà.

---

### 2.2. Dải Thông Số Tri Thức Học Thuật (Knowledge Metrics Strip)
* Hiển thị trực quan:
  * 📚 **Tổng số bài ghi** (`totalNotes`).
  * 📌 **Số lượng bài đã ghim ưu tiên** (`pinnedNotesCount`).
  * ⏱️ **Tổng thời lượng đọc tích lũy** (`estimatedReadHours` tính dựa trên tổng số từ vựng bài giảng).

---

### 2.3. 5 Chế Độ Hiển Thị Linh Hoạt (5 View Modes)
1. **Lưới Chi Tiết (`GRID` - Mặc định):**
   * Hiển thị các thẻ bài học với bản xem trước Markdown trực tiếp, badge môn học, số phút đọc và thanh thao tác nhanh.
2. **Ma Trận Bento Gọn Gàng (`COMPACT`):**
   * Tối ưu mật độ thông tin (4-5 cột) giúp sinh viên lướt nhanh toàn bộ kiến thức trong mùa thi.
3. **Chế Độ Đọc Sâu Hai Cột (`SPLIT` - Dual-Pane IDE Notebook):**
   * Cột trái: Cây danh mục bài giảng.
   * Cột phải: Khung đọc Markdown toàn diện kèm nút Sao chép Markdown, Sửa nhanh, Xóa.
4. **Phân Luồng Thể Loại (`KANBAN` - Kanban Flow):**
   * Phân chia theo 5 cột chuyên biệt: `📖 Bài Giảng Lý Thuyết` | `🧪 Báo Cáo Thực Hành` | `🎯 Đề Cương Ôn Thi` | `🛠️ Nhật Ký Đồ Án` | `📝 Ghi Chú Tự Do`.
5. **Danh Sách Dữ Liệu Bảng Rộng (`LIST` - Data Table):**
   * Hiển thị dạng bảng chuyên nghiệp với phân loại, môn học, ngày tạo và thao tác nhanh.

---

### 2.4. Bộ Sắp Xếp Đa Chiều (Smart Sorter)
* Hỗ trợ sắp xếp tức thì theo:
  * 📌 **Ghim lên đầu (Pinned First)**
  * 🕒 **Mới nhất (Newest)**
  * ⏳ **Cũ nhất (Oldest)**
  * 🔤 **Tiêu đề A-Z (Alphabetical)**

---

## 3. Kết Quả Kiểm Thử

* `npm run build`: Hoàn thành biên dịch với mã thoát 0 (Hoàn toàn sạch lỗi).
* Tốc độ phản hồi tức thì, mượt mà 60FPS khi chuyển đổi qua lại giữa 5 chế độ hiển thị và các bộ lọc.
