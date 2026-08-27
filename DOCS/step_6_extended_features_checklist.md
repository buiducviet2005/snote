# Bảng Checklist Triển khai Tính năng Mở rộng & Phân quyền SNOTE (Bước 6)

Tài liệu này dùng để theo dõi, quản lý và nghiệm thu toàn diện 4 hạng mục mở rộng:
1. **Phân quyền Quản trị viên (RBAC - Role-Based Access Control):** Giới hạn `/status` và thông tin hệ thống chỉ dành riêng cho tài khoản `ADMIN`.
2. **Quản lý Hồ sơ & Đổi Mật khẩu:** Cho phép sinh viên cập nhật thông tin cá nhân và thay đổi mật khẩu an toàn.
3. **Trợ lý AI & Hộp thoại Chat Nhanh Toàn Cục (Floating AI Copilot):** Trợ lý AI thu nhỏ ở góc màn hình không chiếm diện tích, kích hoạt tức thì từ mọi trang (`Ctrl+J` hoặc nút nổi) kèm trang chuyên dụng `/ai-chat`.
4. **Làm việc nhóm & Đồ án Chung (Team Collaboration):** Bổ sung mô hình thành viên đồ án (`ProjectMember`) và phân chia công việc nhóm.

---

## 📊 BẢNG TIẾN ĐỘ THỰC THI

| ID | Giai đoạn / Hạng mục | File liên quan | Tiêu chí đạt | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| `EXT-01` | **Khởi tạo Checklist & Đặc tả Kiến trúc** | `DOCS/step_6_extended_features_checklist.md`<br>`DOCS/ai_chat_docs/10_EXTENDED_FEATURES_ARCHITECTURE.md` | Checklist chi tiết và văn bản kiến trúc mở rộng theo nguyên tắc Append-Only. | [x] |
| `EXT-02` | **Nâng cấp Prisma Schema & Database Migration** | `backend/prisma/schema.prisma`<br>`backend/prisma/seed.ts` | Bổ sung `UserRole (STUDENT, ADMIN)`, `ProjectMember`, seed tài khoản Admin & Student. | [x] |
| `EXT-03` | **Nâng cấp Contracts & Types Dùng chung** | `packages/shared/src/` | Định nghĩa `UserRole`, `ProjectMemberRole`, DTOs Profile, ChangePassword, AI Chat. | [x] |
| `EXT-04` | **Backend RBAC & Admin Guard** | `backend/src/shared/middleware/adminGuard.ts`<br>`backend/src/modules/health/` | Chặn truy cập trái phép của tài khoản thường vào các chẩn đoán hệ thống (`403 Forbidden`). | [x] |
| `EXT-05` | **Backend Profile & Change Password APIs** | `backend/src/modules/auth/` | `PUT /api/auth/profile` và `PUT /api/auth/change-password` băm mật khẩu Bcrypt Cost 12. | [x] |
| `EXT-06` | **Backend AI Assistant Module** | `backend/src/modules/ai/` | Endpoint `POST /api/ai/chat` xử lý prompt học thuật (Trích xuất Todo, Dự đoán thi, Tóm tắt). | [x] |
| `EXT-07` | **Backend Project Collaboration APIs** | `backend/src/modules/projects/` | Quản lý thành viên đồ án (`GET/POST/DELETE /api/projects/:id/members`). | [x] |
| `EXT-08` | **Frontend RBAC & Bảo vệ Route Admin** | `frontend/src/components/layout/AdminRoute.tsx`<br>`frontend/src/components/layout/Sidebar.tsx` | Ẩn menu Trạng thái hệ thống với Student, bảo vệ URL `/status` nghiêm ngặt. | [x] |
| `EXT-09` | **Frontend Profile & Password Settings UI** | `frontend/src/features/settings/pages/SettingsPage.tsx` | Form cập nhật Họ tên, Múi giờ và Form đổi mật khẩu trực quan. | [x] |
| `EXT-10` | **Frontend Floating AI Copilot & AI Chat Page** | `frontend/src/features/ai/`<br>`frontend/src/components/layout/AppLayout.tsx` | Nút AI nổi không chiếm diện tích, mở drawer chat nhanh từ mọi nơi (`Ctrl+J`) và trang `/ai-chat`. | [x] |
| `EXT-11` | **Frontend Team Project Members UI** | `frontend/src/features/projects/` | Danh sách thành viên và modal mời bạn học vào làm chung đồ án. | [x] |
| `EXT-12` | **Monorepo Build & Kiểm thử Toàn diện** | `npm run build`<br>`npm run type-check` | Toàn bộ Monorepo build 100% 0 lỗi, cập nhật PROJECT_STRUCTURE_AND_MAP.md. | [x] |

---

## 📝 NHẬT KÝ NGHIỆM THU

- **2026-08-27 14:32**: Hoàn thành 100% tất cả 12 hạng mục mở rộng:
  - Phân quyền RBAC nghiêm ngặt: chỉ tài khoản `admin@snote.edu.vn` mới được xem `/status` và giám sát hệ thống. Sinh viên `sinhvien@snote.edu.vn` không thấy menu và bị chặn 403 nếu truy cập URL trực tiếp.
  - Form chỉnh sửa thông tin cá nhân (Họ tên, Múi giờ) và Đổi mật khẩu an toàn tại `/settings`.
  - Floating AI Copilot thu nhỏ siêu gọn gàng tại góc dưới phải màn hình, không chiếm diện tích khi không dùng, mở nhanh bằng phím tắt `Ctrl + J` từ mọi màn hình, hỗ trợ trích xuất Todo, dự đoán đề thi, tóm tắt bài giảng.
  - Trang chuyên dụng `/ai-chat` toàn màn hình cho các phiên thảo luận học tập dài hạn.
  - Quản lý thành viên đồ án môn học: Mời bạn học qua email / User ID, phân công nhiệm vụ nhóm.
  - Biên dịch toàn bộ Monorepo 100% 0 lỗi.
