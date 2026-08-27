# 10 – ĐẶC TẢ KIẾN TRÚC TÍNH NĂNG MỞ RỘNG & PHÂN QUYỀN (EXTENDED FEATURES & RBAC)

Tài liệu này đóng vai trò ghi nhận chi tiết các quyết định kiến trúc và đặc tả kỹ thuật cho 4 phân hệ mở rộng của **SNOTE**:
1. **Phân quyền Quản trị viên (RBAC - Role-Based Access Control)**
2. **Quản lý Thông tin Cá nhân & Đổi Mật khẩu (User Profile Management)**
3. **Trợ lý AI Học tập & Hộp thoại Chat Nhanh Toàn cục (Global Floating AI Copilot)**
4. **Làm việc nhóm & Đồ án Chung (Team Collaboration)**

---

## 🛡️ 1. PHÂN QUYỀN HỆ THỐNG (RBAC)

### 1.1. Bảng Vai trò Người dùng (User Roles)
* `STUDENT`: Sinh viên tiêu chuẩn, toàn quyền quản lý không gian học tập cá nhân (Học kỳ, Môn học, Ghi chú, Công việc, Lịch trình, Đồ án, Trợ lý AI).
* `ADMIN`: Quản trị viên hệ thống, ngoài các quyền của sinh viên, được phép xem chi tiết chẩn đoán máy chủ, telemetry, trạng thái kết nối cơ sở dữ liệu (`/status`).

### 1.2. Cơ chế Bảo vệ (Guardrails)
* **Backend:** Middleware `adminGuard.ts` kiểm tra `req.user.role === 'ADMIN'`. Nếu vi phạm, trả về lỗi `403 Forbidden` (`FORBIDDEN`).
* **Frontend:** Component `AdminRoute.tsx` kiểm tra `user.role === 'ADMIN'`. Nếu không phải Admin, chuyển hướng về trang chủ `/notes` kèm thông báo Toast cảnh báo.
* **UI:** Sidebar tự động ẩn mục menu *"Trạng thái hệ thống"* khi người dùng đăng nhập là `STUDENT`.

---

## 👤 2. QUẢN LÝ HỒ SƠ & BẢO MẬT TÀI KHOẢN

### 2.1. API Endpoints
* `PUT /api/auth/profile`: Cập nhật `fullName`, `timezone`, `avatarUrl`.
* `PUT /api/auth/change-password`: Yêu cầu `currentPassword` (so khớp `bcrypt.compare`) và `newPassword` (mã hóa `bcrypt.hash` cost 12). Hủy toàn bộ Refresh Tokens cũ để đảm bảo an toàn.

---

## 🤖 3. TRỢ LÝ AI & HỘP THOẠI CHAT NHANH TOÀN CỤC (GLOBAL FLOATING AI COPILOT)

### 3.1. Thiết kế Giao diện Trực quan & Tiết kiệm Diện tích
* **Nút kích hoạt nổi (Floating Bubble Launcher):**
  - Đặt tại góc dưới bên phải màn hình (`bottom: 24px, right: 24px`).
  - Thiết kế tinh tế với biểu tượng Sparkles/GraduationCap và hiệu ứng viền phát sáng nhẹ.
  - **Không chiếm dụng diện tích màn hình** làm việc của sinh viên khi đang đọc ghi chú hay xem lịch.
* **Khung Chat Mở rộng (Floating Drawer/Panel):**
  - Kích hoạt bằng 1 cú click hoặc phím tắt toàn cục **`Ctrl + J`** (hoặc `Cmd + J`).
  - Thiết kế dạng Glassmorphism trượt mượt mà (`slideUp / fadeIn`), có nút thu nhỏ (Minimize) và đóng (Close).
* **Bộ Mẫu Prompt Học thuật (Academic Quick Prompts):**
  - ⚡ *Trích xuất việc cần làm & hạn nộp từ bài giảng*
  - 🎯 *Dự đoán 5 câu hỏi trọng tâm đề thi môn học*
  - 💡 *Giải thích khái niệm khó kèm ví dụ thực tế*
  - 📝 *Soạn tóm tắt đề cương 1 trang*
* **Trang Toàn màn hình (`/ai-chat`):**
  - Dành cho các phiên học tập, nghiên cứu và thảo luận chuyên sâu dài hạn với AI.

---

## 👥 4. LÀM VIỆC NHÓM & ĐỒ ÁN CHUNG (TEAM COLLABORATION)

### 4.1. Mô hình Dữ liệu
* Bảng `project_members`:
  - `id`: UUID
  - `projectId`: UUID (FK -> `projects.id`)
  - `userId`: UUID (FK -> `users.id`)
  - `role`: Enum `ProjectMemberRole` (`OWNER`, `MEMBER`, `VIEWER`)
  - `joinedAt`: Timestamptz
* Bảng `projects` hỗ trợ tìm kiếm và liệt kê cả đồ án do người dùng sở hữu (`userId`) và đồ án người dùng được mời tham gia (`project_members`).
