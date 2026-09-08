# BÁO CÁO PHÂN TÍCH & CẢI TIẾN GIAO DIỆN TỪ GÓC NHÌN NGƯỜI DÙNG THỰC TẾ (USER-CENTRIC UX/UI REFINEMENT)

> **Dự án:** SNOTE - Quản Lý Đồ Án & Học Tập (Google Apps Script Web Script Edition)  
> **Góc nhìn thực tế:** Sinh viên chạy deadline, Nhóm trưởng phân chia công việc, Giảng viên theo dõi tiến độ  
> **Nguyên tắc thiết kế:** Zero-friction, Content-First, Tối giản thông minh, Phản hồi thị giác thời gian thực (Real-time Visual Feedback)  

---

## 1. ĐẶT MÌNH VÀO GÓC NHÌN NGƯỜI DÙNG: CẢM NHẬN & PHÂN TÍCH CỌ XÁT (FRICTIONS)

Khi một sinh viên hoặc nhóm trưởng mở SNOTE ra để làm việc hàng ngày, họ không quan tâm công nghệ đằng sau là gì, họ chỉ mong muốn:
1. **Vào việc nhanh nhất có thể**: Không phải bấm quá nhiều bước, không phải suy nghĩ xem mã đồ án hay PIN ở đâu.
2. **Không bị bối rối về mặt nhận thức (Cognitive Load)**: Mọi nút bấm phải phản ánh đúng hành động người dùng kỳ vọng.
3. **Cảnh báo cái gì khẩn cấp ngay trước mắt**: Công việc nào sắp trễ hoặc đã quá hạn phải đập vào mắt ngay, không được giấu đi.
4. **Viết ghi chú thoải mái, không bí bách**: Màn hình laptop sinh viên (13 - 14 inch) rất nhỏ, chia quá nhiều cột làm không gian gõ chữ chỉ còn một góc hẹp, rất ức chế.
5. **Thao tác 1-click & Phím tắt tự nhiên**: Tránh bắt người dùng phải kéo thả chuột dài dòng hoặc mở popup rườm rà.

---

## 2. BẢNG TỔNG HỢP CÁC ĐIỂM CỌ XÁT VÀ GIẢI PHÁP ĐÃ ĐƯỢC TRIỂN KHAI

| Khu vực | Góc nhìn & Cảm xúc người dùng trước cải tiến | Điểm cọ xát kỹ thuật (Friction) | Giải pháp cải tiến đã triển khai (Zero-Friction UX) |
| :--- | :--- | :--- | :--- |
| **Cổng Đăng Nhập (Landing)** | *"Sau khi gõ xong số thứ 4 của mã PIN, tại sao mình phải rê chuột bấm nút Đăng nhập hoặc bấm thêm lần nữa?"* | Nhập xong số PIN cuối cùng hệ thống không tự submit; phím Enter không kích hoạt form nếu focus ở ô PIN. Nút demo chỉ có 1 đồ án, không kiểm tra được phân lập đồ án 2. | **Tự động đăng nhập tức thì:** Ô số 4 khi điền xong tự động kích hoạt kiểm tra đăng nhập. Bấm `Enter` ở bất kỳ ô nào đều submit ngay. Nâng cấp thành **2 chip truy cập nhanh** `PRJ-101 (1234)` và `PRJ-102 (5678)`. |
| **Thanh Điều Hướng (Topbar)** | *"Bên trái ghi 'Chuyển Đồ Án', bên phải lại có nút 'Đổi Đồ Án', vậy 2 nút này khác gì nhau? Muốn thoát ra ngoài thì bấm nút nào?"* | Nút góc phải thực chất là thoát về màn hình Landing nhưng lại đặt nhãn là "Đổi Đồ Án", gây xung đột ngữ nghĩa với dropdown chọn đồ án bên trái. Muốn gửi mã đồ án cho bạn bè trong nhóm Zalo phải tự gõ tay mã `PRJ-xxx`. | **Chuẩn hóa nhãn & Thêm 1-click Copy:** Đổi nhãn nút góc phải thành **"Đăng Xuất"** với icon thoát trực quan. Thêm nút bấm 1-click **"📋 Sao Chép Mã"** ngay cạnh tên đồ án; bấm vào copy mã vào clipboard và hiện thông báo Toast tức thì. |
| **Bảng Công Việc (Kanban Tasks)** | *"Mình có 5 task đang làm dở, có cái đã quá hạn 2 ngày mà giao diện nhìn vẫn y hệt task chưa đến hạn, không có gì nhắc nhở!"* | Thẻ Kanban chỉ tính overdue khi task đã hoàn thành; các task đang `IN_PROGRESS` hoặc `TODO` bị trễ hạn không có cảnh báo đỏ trực quan. Chuyển trạng thái task bắt buộc phải kéo thả chuột, gây mỏi tay trên touchpad laptop. | **Huy hiệu quá hạn phát sáng & Nút chuyển nhanh:** So sánh `dueDate` với ngày hiện tại ngay khi render thẻ. Thẻ quá hạn được bọc viền đỏ và gắn huy hiệu nhấp nháy `⚠️ Quá hạn`. Bổ sung nút chuyển nhanh `▶ Bắt đầu` / `▶ Xong` để đổi trạng thái ngay chỉ với 1 click không cần kéo thả chuột. |
| **Không Gian Ghi Chú (Notes Workspace)** | *"Màn hình laptop 13 inch của mình bị chia làm 4 cột: Sidebar, Danh sách bài, Khung gõ Markdown, Khung Xem trước. Khung gõ hẹp tí hon, chữ nhảy dòng liên tục rất khó chịu! Đang gõ quen tay bấm Ctrl+S thì trình duyệt hiện popup lưu file HTML!"* | Màn hình Notes bị khóa cứng tỉ lệ 50/50 cho Editor và Preview. Không có thanh công cụ chèn cú pháp nhanh (Bold, Italic, Tiêu đề, Tasklist...). Thiếu bộ đếm số từ. Bấm `Ctrl+S` kích hoạt tính năng Save Page của trình duyệt. | **Chế độ xem 3 trạng thái & Markdown Pro:**<br>1. **Bộ 3 chế độ xem:** `◫ Chia Đôi` \| `✎ Soạn Thảo (100% full-width)` \| `👁️ Đọc Bản Đẹp (100% full-width)`.<br>2. **Thanh công cụ nhanh:** B, I, H2, H3, List, Tasklist, Quote, Code.<br>3. **Bộ đếm thời gian thực:** Đếm số từ và ký tự tự động.<br>4. **Phím tắt `Ctrl + S`:** Bắt sự kiện, lưu ghi chú trực tiếp vào hệ thống và hiện Toast, chặn triệt để popup trình duyệt. |
| **Phím Tắt Toàn Cục (Shortcuts)** | *"Đang mở bảng tạo đồ án hoặc danh sách thông báo, muốn đóng lại nhanh bằng phím Esc mà không được, phải rê chuột tìm dấu X."* | Chưa có xử lý phím `Escape` cho toàn bộ Modal và Popover. | Bổ sung phím **`Escape` toàn cục**: Bấm `Esc` lập tức đóng sạch mọi modal đang mở, dropdown đồ án và popover chuông thông báo. |

---

## 3. CHI TIẾT CÁC CẢI TIẾN TRẢI NGHIỆM GIAO DIỆN (UI/UX IMPLEMENTATION)

### 3.1. Cổng Đăng Nhập & Phân Lập Tức Thì
- **Auto-Advance & Auto-Submit:** Sinh viên nhập 4 số PIN liền mạch:
  ```
  [1] -> Tự nhảy ô [2] -> Tự nhảy ô [3] -> Tự nhảy ô [4] -> Tự động đăng nhập!
  ```
- **Dual Test Chips:** Hai chip hiển thị rõ ràng trên Landing Page:
  - `PRJ-101 (PIN: 1234)`: Đồ án Web Nâng Cao - Nhóm 1
  - `PRJ-102 (PIN: 5678)`: Đồ Án Trí Tuệ Nhân Tạo - Nhóm 2
  Giúp người dùng chuyển đổi qua lại để kiểm chứng tính năng cô lập dữ liệu (Data Isolation) mà không cần nhập tay.

### 3.2. Thanh Tiêu Đề (Topbar) & Chia Sẻ Đồ Án
- **Nút Sao Chép Mã:** Đặt ngay bên cạnh selector đồ án:
  - Bấm nút `📋 Sao chép mã` -> Mã `PRJ-101` được lưu vào clipboard -> Thông báo xanh: *"Đã sao chép mã đồ án: PRJ-101"*.
- **Đăng Xuất Nhất Quán:** Góc phải hiển thị rõ `[Icon Thoát] Đăng Xuất`, loại bỏ hoàn toàn sự lúng túng giữa việc chuyển đồ án hay thoát tài khoản.

### 3.3. Bảng Kanban Trực Quan & Nút 1-Click Thao Tác
- **Thẻ Quá Hạn Thời Gian Thực:**
  - Viền đỏ đặc trưng (`border-left: 4px solid var(--danger)`).
  - Nền gradient đỏ mờ cảnh báo nhẹ nhàng nhưng dứt khoát.
  - Huy hiệu nhịp thở: `⚠️ Quá hạn` với hiệu ứng `@keyframes pulseOverdueAnim` thu hút sự chú ý tức thì vào các deadline bị chậm trễ.
- **Nút Chuyển Nhanh Trạng Thái:**
  - Ở cột `CẦN LÀM`: Hiển thị nút `▶ Bắt đầu` (chuyển sang `ĐANG LÀM`).
  - Ở cột `ĐANG LÀM`: Hiển thị nút `▶ Xong` (chuyển sang `HOÀN THÀNH`).
  - Cập nhật giao diện tức thì (Optimistic UI) và đồng bộ ngầm an toàn.

### 3.4. Không Gian Ghi Chú Đề Cương Chuyên Nghiệp (Markdown Pro Workspace)
- **3 Chế Độ Hiển Thị Linh Hoạt:**
  - `◫ Chia Đôi`: Cân đối giữa soạn thảo và xem trước (phù hợp màn hình lớn).
  - `✎ Soạn Thảo`: Ẩn khung preview, mở rộng 100% chiều ngang cho khu vực gõ văn bản, loại bỏ hoàn toàn cảm giác chật chội.
  - `👁️ Đọc Bản Đẹp`: Ẩn khung soạn thảo, mở rộng 100% khung hiển thị bài viết với typography đẹp mắt để đọc đề cương, ôn tập.
- **Thanh Công Cụ Markdown Tiện Dụng:** Hỗ trợ chèn nhanh `**Đậm**`, `*Nghiêng*`, `## Tiêu đề`, `- Danh sách`, `- [ ] Tasklist`, `> Trích dẫn`, `Inline Code`, `Code Block` chỉ bằng 1 cú click chuột.
- **Bộ Đếm Số Từ Thời Gian Thực:** `... từ • ... ký tự` cập nhật ngay khi gõ phím.
- **Phím Tắt `Ctrl + S`:** Bắt trúng thói quen người dùng gõ văn bản văn phòng, lưu bài nhanh gọn trong 0.1s.

---

## 4. KẾT QUẢ KIỂM THỬ HỆ THỐNG

Toàn bộ hệ thống kiểm thử tự động đã được thực thi và đạt 100% PASS:
1. **Kiểm tra Cú pháp V8 JavaScript (`node -c`)**: Đạt chuẩn, 0 lỗi cú pháp.
2. **Kiểm thử An ninh & Phân lập Dữ liệu (`verify_idor_and_isolation.py`)**: 25/25 test cases PASSED.
3. **Kiểm thử Cổng PIN & Mã Đồ Án (`verify_pin_and_project_code.py`)**: 7/7 test suites PASSED.
4. **Kiểm thử Vận hành & Cải tiến Giao diện (`verify_system_ops_and_ui_1000.py`)**: 7/7 test suites PASSED.
