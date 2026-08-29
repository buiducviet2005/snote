# BÁO CÁO CẢI TIẾN: TRIỂN KHAI CHẾ ĐỘ XEM MẠNG LƯỚI TRI THỨC (INTERACTIVE KNOWLEDGE GRAPH VIEW)

## 1. Mục Đích & Ý Nghĩa Tính Năng

Đáp ứng nhu cầu học tập và ôn tập trực quan theo phong cách **Obsidian / Roam Research**:
* Biến toàn bộ kho bài ghi thô thành một **"Bộ Não Thứ Hai" (Second Brain)** dạng đồ thị mạng lưới sống động.
* Giúp sinh viên nắm bắt bức tranh toàn cảnh về mối liên hệ giữa các **Môn học (Hubs)**, **Đồ án (Project Clusters)** và **Các bài ghi chép (Note Nodes)**.

---

## 2. Chi Tiết Kỹ Thuật Đã Triển Khai

1. **Bộ Dựng Đồ Thị Vật Lý Tự Động (60 FPS Force-Directed Physics Canvas):**
   * Sử dụng Native HTML5 Canvas 2D kết hợp thuật toán mô phỏng vật lý lò xo & lực đẩy tĩnh điện (Coulomb Repulsion + Hooke Spring Law + Center Gravity).
   * Không phụ thuộc thư viện 3D bên ngoài, dung lượng siêu nhẹ, hiển thị siêu mượt mà ở 60 FPS trên cả laptop yếu và điện thoại.
   * Hỗ trợ màn hình Retina / High-DPI thông qua `window.devicePixelRatio`.

2. **Cơ Chế Phân Cụm & Màu Sắc Đồ Họa:**
   * **Node Môn Học & Đồ Án:** Đóng vai trò là tâm cụm (Hubs), có kích thước lớn và vòng tròn phát sáng bao quanh.
   * **Node Bài Ghi:** Tự động bắt màu theo Môn học hoặc Loại bài ghi (Bài giảng: Xanh lam, Thực hành: Xanh lá, Ôn thi: Vàng, Đồ án: Tím).
   * **Liên Kết Tự Động:** Nối các bài ghi với Môn học, Đồ án và nối các bài ghi có chung Tag.

3. **Tính Năng Tương Tác Trực Quan:**
   * **Hover Thông Minh (Cluster Highlighting):** Khi rê chuột vào một bài ghi/môn học, toàn bộ các nút liên quan sẽ sáng lên và làm mờ các nhánh không liên quan.
   * **Thẻ Tooltip Xem Nhanh:** Hiển thị tên bài ghi, số lượng liên kết và trích dẫn tóm tắt nội dung bài học.
   * **Click Mở Chi Tiết:** Nhấp vào bất kỳ Node nào để mở ngay Modal xem chi tiết và chỉnh sửa.
   * **Kéo Thả (Drag & Drop):** Cho phép kéo các Node để sắp xếp lại mạng lưới với hiệu ứng nảy đàn hồi.
   * **Thanh Công Cụ Điều Khiển:** Phóng to (`+`), Thu nhỏ (`-`), Căn giữa màn hình, Bật/Tắt nhãn văn bản, và Bộ lọc Môn học trực tiếp trên đồ thị.

---

## 3. Kết Quả Kiểm Thử

* **TypeScript Type Check:** `0 lỗi`.
* **Frontend Vite Build Production:** Thành công trong 4.88s.
