# BÁO CÁO CẢI TIẾN: KHÔNG GIAN CỘNG TÁC ĐỒ ÁN NHÓM & QUẢN LÝ THÀNH VIÊN (TEAM WORKSPACE)

## 1. Tổng quan Nâng cấp
Hệ thống SNOTE đã được nâng cấp từ mô hình cá nhân đơn lẻ sang **Mô hình Cộng tác Đồ án Nhóm Toàn diện (Collaborative Project Workspace)**, kết nối mật thiết giữa Thành viên (Members), Nhiệm vụ (Tasks), Tài liệu ghi chép (Notes) và Thảo luận nhóm (Discussions).

---

## 2. Các Tính năng Đã Triển khai & Kiểm thử Thành công

### 2.1. Quản lý & Tương tác Thành viên Đồ án
1. **Mời thành viên linh hoạt:** Mời bạn học vào đồ án bằng Email (`admin@snote.edu.vn`) hoặc Mã tài khoản (UUID).
2. **Cấp lại vai trò & Phân quyền động:**
   * `OWNER` (Trưởng nhóm): Có toàn quyền quản lý đồ án, xóa đồ án, thêm/xóa thành viên, phân bổ vai trò.
   * `MEMBER` (Thành viên): Được tạo và quản lý tasks, notes của đồ án, tham gia thảo luận.
   * `VIEWER` (Chỉ xem): Xem tiến độ và đọc tài liệu ghi chú.
3. **Cơ chế Cấp quyền Tức thì:** Trưởng nhóm có thể chọn trực tiếp vai trò mới trong dropdown để thăng cấp / hạ quyền thành viên mà không cần xóa đi tạo lại.
4. **Tự rời khỏi nhóm (Leave Project):** Thành viên có thể chủ động rời khỏi đồ án. Trưởng nhóm được bảo vệ với quy tắc bắt buộc chuyển giao quyền `OWNER` trước khi rời.

### 2.2. Không Gian Làm Việc Đồ Án Hợp Nhất (Unified Project Workspace Modal)
Khi nhấp vào thẻ đồ án trên giao diện, hệ thống mở Không gian làm việc hợp nhất với 4 phân hệ:

* **Header & Thống kê Tiến độ (% Progress Bar):**
  * Tự động tính toán tỷ lệ hoàn thành công việc: `N / Total tasks` (Hiển thị thanh tiến độ visual).
  * Hiển thị Avatar stack của toàn bộ thành viên nhóm.
  * Hiển thị môn học liên kết và hạn nộp đồ án.
* **Tab 1: Bảng Nhiệm Vụ Đồ Án (Project Tasks):**
  * Liệt kê toàn bộ công việc gắn với đồ án (`projectId`).
  * Checkbox tương tác tức thì để đánh dấu Hoàn thành / Mở lại công việc.
  * Nút "+ Thêm Công Việc Đồ Án" phân công trực tiếp cho thành viên trong nhóm.
* **Tab 2: Tài Liệu Kỹ Thuật & Nhật Ký (Project Notes):**
  * Quản lý các bài ghi chép, biên bản họp nhóm (`MEETING_MINUTES`), nhật ký đồ án (`PROJECT_LOG`).
  * Xem nhanh Markdown Preview trực tiếp trên thẻ tài liệu.
  * Nút "+ Thêm Ghi Chú Đồ Án".
* **Tab 3: Thành Viên & Phân Quyền (Members & Roles):**
  * Quản lý danh sách thành viên, thay đổi vai trò, mời thêm thành viên hoặc xóa thành viên.
* **Tab 4: Bảng Thảo Luận Nhóm (Team Discussion Stream):**
  * Kênh trao đổi tin nhắn nội bộ dành riêng cho các thành viên trong đồ án.

---

## 3. Kiến trúc API Backend Đã Bổ Sung

* `GET /api/projects/:id/workspace`: Trả về dữ liệu tổng hợp gồm thông tin đồ án, môn học, kỳ học, danh sách thành viên kèm avatar, danh sách tasks và notes.
* `POST /api/projects/:id/members`: Thêm thành viên an toàn theo email hoặc UUID.
* `PUT /api/projects/:id/members/:memberUserId`: Cập nhật vai trò thành viên (`OWNER`, `MEMBER`, `VIEWER`).
* `DELETE /api/projects/:id/members/:memberUserId`: Xóa thành viên hoặc tự rời nhóm.
* `POST /api/tasks`: Hỗ trợ trường `projectId` để gắn task vào đồ án.
* `POST /api/notes`: Hỗ trợ trường `projectId` và `noteType: PROJECT_LOG` / `MEETING_MINUTES`.
