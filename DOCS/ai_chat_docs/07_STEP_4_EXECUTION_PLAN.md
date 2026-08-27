# 07 – KẾ HOẠCH NGHIÊN CỨU & THỰC THI BƯỚC 4 (BACKEND CORE & MIGRATIONS)

Tài liệu này ghi nhận **kế hoạch hành động chi tiết và chiến lược kỹ thuật** của **Bước 4 lớn (Triển khai Backend Core & Database Migrations)** trong kho tri thức dành riêng cho Chat AI của dự án **SNOTE**.

---

## 🧭 CÁC KHỐI KIẾN TRÚC SẼ TRIỂN KHAI TRONG BƯỚC 4

1. **Schema & Data Layer:**
   * Áp dụng DDL từ `DOCS/step_2.md` vào `backend/prisma/schema.prisma`.
   * Enums: `UserStatus`, `SemesterStatus`, `SubjectStatus`, `ProjectStatus`, `NoteType`, `TaskStatus`, `TaskPriority`, `ScheduleEventType`.
   * Tables: `users`, `refresh_tokens`, `semesters`, `subjects`, `projects`, `notes`, `tasks`, `schedule_events`, `tags`, `note_tags`, `attachments`, `sync_logs`, `backups`.
   * Ràng buộc bất biến: `(subject_id IS NOT NULL OR project_id IS NOT NULL)`.
2. **Auth & Security Boundary:**
   * Dual-Token Pattern: Access Token (15 phút, JWT Payload: `sub: user.id`, `email`) + Refresh Token (7 ngày, lưu vào DB và gửi qua Cookie `httpOnly`, `Secure`, `SameSite=Lax`).
   * Password hashing: `bcryptjs` với salt rounds = 12.
3. **Core Bounded Contexts (Modular Monolith):**
   * Semesters & Subjects Module
   * Projects Module
   * Notes Module (CRUD, tags, search filter, soft delete)
   * Tasks Module (CRUD, kanban states, priority, deadlines)
   * Schedule Module (lịch học/lịch thi theo tuần)
   * Backup Module (JSON Export đầy đủ mọi dữ liệu)
4. **Contract Synchronization:**
   * Package `@snote/shared` xuất bản các DTOs chuẩn để Frontend ở Bước 5 tiêu thụ trực tiếp.
