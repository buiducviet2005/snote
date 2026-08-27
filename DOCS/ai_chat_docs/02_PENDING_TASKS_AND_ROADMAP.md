# 02 – DANH MỤC CÔNG VIỆC CẦN LÀM & LỘ TRÌNH TIẾP THEO (SNOTE)

Tài liệu này ghi nhận **toàn bộ các tác vụ tồn đọng và kế hoạch triển khai chi tiết cho các bước tiếp theo** của dự án **SNOTE**.

---

## 🎯 BƯỚC TIẾP THEO NGAY TRƯỚC MẮT

### 1. Bước 3.7 – Tổng kết Chuẩn Bảo mật & Chuyển giao Nền tảng
- Hoàn thiện tài liệu tổng kết Bước 3 lớn.
- Đóng toàn bộ checklist Bước 3 (`DOCS/step_3_setup_checklist.md`).

---

## 🚀 LỘ TRÌNH CÁC BƯỚC LỚN TIẾP THEO

### 2. BƯỚC 4 LỚN: Triển khai Backend Core & Database Migrations
1. **Prisma Schema & Database Migrations:**
   * Áp dụng DDL từ `DOCS/step_2.md` vào `backend/prisma/schema.prisma` (10+ models: User, Semester, Subject, Project, Note, Task, ScheduleEvent, Tag, Attachment, SyncLog, Backup).
   * Chạy `npx prisma migrate dev --name init_snote_core_schema`.
   * Cài đặt PostgreSQL CHECK constraints & Triggers chống note rác (`subject_id IS NOT NULL OR project_id IS NOT NULL`).
2. **Triển khai Auth Module Hoàn chỉnh:**
   * Register, Login, Refresh Token (Cookie httpOnly + Secure), Logout, Me endpoints.
   * Bcrypt hashing mật khẩu (cost factor 12).
3. **Triển khai Modules Nghiệp vụ Cốt lõi (CRUD Real Data):**
   * **Semesters & Subjects Module:** Quản lý học kỳ, môn học, tín chỉ, giảng viên.
   * **Projects Module:** Quản lý đồ án môn học, nhóm, deadline đồ án.
   * **Notes Module:** Tạo, sửa, xóa (soft-delete), phân loại theo môn học/đồ án, gắn thẻ tags.
   * **Tasks Module:** Quản lý todo, kanban state (`TODO`, `IN_PROGRESS`, `DONE`), ưu tiên, deadline.
   * **Schedule Module:** Lịch học, lịch thi, sự kiện học tập theo tuần/tháng.
4. **Triển khai Backup & Export API:**
   * Export toàn bộ dữ liệu sinh viên ra file JSON/ZIP chuẩn để bảo vệ quyền riêng tư và sao lưu ngoại tuyến.

---

### 3. BƯỚC 5 LỚN: Triển khai Frontend SPA & UX Hoàn chỉnh cho Sinh viên
1. **Quản lý Trạng thái & API Integration:**
   * Cài đặt TanStack Query (React Query) hoặc Zustand để cache dữ liệu và sync real-time với backend.
2. **Xây dựng Màn hình Chi tiết:**
   * **Auth Screens:** Trang Đăng nhập & Đăng ký chuyên nghiệp.
   * **Notes Editor:** Trình soạn thảo Markdown/Rich Text (TipTap hoặc Markdown Editor) hỗ trợ chèn công thức toán học KaTeX, code blocks.
   * **Tasks Kanban Board & List View:** Kéo thả trạng thái công việc trực quan.
   * **Weekly Schedule Calendar:** Lịch học trực quan theo tuần cho sinh viên.
   * **Subject / Project Hub:** Trang quản lý tổng quan từng môn học (gồm Notes + Tasks + Schedule + Tài liệu liên quan).

---

### 4. BƯỚC 6 LỚN: Tính năng Nâng cao Non-AI
1. **Tìm kiếm Toàn văn (Full-Text Search):** PostgreSQL `tsvector` + GIN Index tìm kiếm tiêu đề và nội dung note không cần Elasticsearch.
2. **Chia sẻ Ghi chú & Đồ án (Sharing & Permissions):** Chia sẻ tài liệu ôn thi giữa các sinh viên trong nhóm.
3. **Chế độ Ngoại tuyến (Offline-First / Local Storage Sync):** Đảm bảo sinh viên ghi chép được ngay cả khi mất mạng ở giảng đường.

---

### 5. BƯỚC 7 & 8: Lớp AI Roadmap & Vận hành Production
1. **AI Module (v1 -> v4):** Smart Action Items Extractor, Exam Topic Predictor, Multi-modal OCR/Voice, Autonomous Study Plan.
2. **Production Deployment:** Dockerize Backend, Cấu hình Nginx Reverse Proxy, Vercel/Cloudflare cho Frontend, PostgreSQL Managed Database.
