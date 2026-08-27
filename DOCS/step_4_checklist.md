# Bảng Checklist Thực thi Bước 4: Triển khai Backend Core & Database Migrations (SNOTE)

Tài liệu này dùng để theo dõi, quản lý tiến độ và nghiệm thu từng tác vụ trong **Bước 4 lớn: Triển khai Backend Core & Database Migrations** của dự án **SNOTE**.

---

## 📊 BẢNG TIẾN ĐỘ THỰC THI BƯỚC 4

| ID | Giai đoạn / Cụm công việc | File / Lệnh liên quan | Tiêu chí đạt | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| `B4-01` | **Tạo tài liệu kế hoạch kỹ thuật chuẩn hóa Bước 4** | `DOCS/step_4_plan.md` | Tài liệu phân rã 7 cụm công việc, thứ tự thực thi, data flow và tiêu chuẩn nghiệm thu. | ✅ **[x] Đạt** |
| `B4-02` | **Chuẩn hóa DDL & Thiết lập `schema.prisma` đầy đủ** | `backend/prisma/schema.prisma` | Khai báo 10+ Models (User, Semester, Subject, Project, Note, Task, ScheduleEvent, Tag, Attachment, SyncLog, Backup) & 8 Enums. | ✅ **[x] Đạt** |
| `B4-03` | **Khởi tạo Migrations & Seed Data Script** | `backend/prisma/migrations/`<br>`backend/prisma/seed.ts` | Sinh Prisma Client v7.10.0, cấu hình script `npm run prisma:seed` nạp dữ liệu sinh viên mẫu. | ✅ **[x] Đạt** |
| `B4-04` | **Cài đặt CHECK Constraints & Ràng buộc chống "Note Rác"** | `notes.schemas.ts`<br>`tasks.schemas.ts` | Ràng buộc `(subjectId || projectId)` bắt buộc trên cả Zod layer và Database layer. | ✅ **[x] Đạt** |
| `B4-05` | **Triển khai Module Auth Hoàn chỉnh (Dual-Token JWT)** | `backend/src/modules/auth/` | Register, Login, Refresh Token (Cookie httpOnly, Secure), Logout, Me, mã hóa bcrypt cost 12. | ✅ **[x] Đạt** |
| `B4-06` | **Triển khai Module Semesters, Subjects & Projects** | `backend/src/modules/semesters/`<br>`backend/src/modules/subjects/`<br>`backend/src/modules/projects/` | CRUD Học kỳ, Môn học (tín chỉ, giảng viên) và Đồ án môn học, bảo vệ quyền sở hữu Anti-IDOR. | ✅ **[x] Đạt** |
| `B4-07` | **Triển khai Module Notes & Tasks (CRUD Real Data)** | `backend/src/modules/notes/`<br>`backend/src/modules/tasks/` | CRUD thật trên PostgreSQL qua Prisma, soft-delete, phân loại môn/đồ án, gắn thẻ tags, Kanban state. | ✅ **[x] Đạt** |
| `B4-08` | **Triển khai Module Schedule & Backup API** | `backend/src/modules/schedule/`<br>`backend/src/modules/backup/` | Quản lý lịch học/thi theo tuần/tháng; API Export toàn bộ dữ liệu sinh viên ra JSON kèm SHA-256 checksum. | ✅ **[x] Đạt** |
| `B4-09` | **Đồng bộ Shared Contracts & API surface** | `packages/shared/` | Xuất bản types, interfaces DTO và Enums đồng bộ 100% cho cả Backend và Frontend. | ✅ **[x] Đạt** |
| `B4-10` | **Kiểm thử Tích hợp Toàn diện (E2E Integration Test)** | Scripts test tự động | Build 100% 0 lỗi, Type-check 0 lỗi, AuthGuard bảo vệ 100% endpoints, Zod validation trả HTTP 400. | ✅ **[x] Đạt** |

---

## 📝 NHẬT KÝ THỰC THI (EXECUTION LOGS)

1. **Chuẩn hóa Schema Prisma:** Đã thiết kế hoàn chỉnh [schema.prisma](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/prisma/schema.prisma) với 10+ models và 8 enums. Sinh Prisma Client thành công (`v7.10.0`).
2. **Kịch bản Seed Dữ liệu Mẫu:** Tạo [seed.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/prisma/seed.ts) chứa user sinh viên mẫu, 1 học kỳ, 3 môn học, 1 đồ án SNOTE, 3 thẻ tags, 2 ghi chú bài giảng, 3 tasks và 2 sự kiện lịch học.
3. **Module Auth Toàn diện:** Cài đặt [Auth Module](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/auth) hỗ trợ Access Token 15m + Refresh Token 7d lưu trong DB và Cookie `httpOnly`, `Secure`, `SameSite=Lax`.
4. **Các Bounded Contexts Nghiệp vụ:** Triển khai theo chuẩn DDD 7-file cho `semesters`, `subjects`, `projects`, `notes`, `tasks`, `schedule` và `backup`.
5. **Cứng hóa Ràng buộc & Bắt lỗi:** Tích hợp tự động bắt `ZodError` trả về HTTP 400 và `VALIDATION_ERROR` chuẩn trong [errorHandler.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/middleware/errorHandler.ts).
6. **Đồng bộ Shared Library:** Cập nhật [@snote/shared](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared) xuất bản toàn bộ 100% contracts và enums.
7. **Build & Type Check:** Đạt **0 lỗi** trên toàn bộ Monorepo (`packages/shared`, `backend`, `frontend`).
