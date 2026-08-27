# 01 – TỔNG KẾT THÀNH TỰU & CỘT MỐC ĐÃ HOÀN THÀNH (SNOTE)

Tài liệu này ghi nhận **toàn bộ các thành tựu, quyết định kiến trúc và kết quả kỹ thuật đã hoàn thành 100%** của dự án **SNOTE** tính đến thời điểm hiện tại.

---

## 🏆 CÁC CỘT MỐC ĐÃ HOÀN THÀNH (100% DONE)

### 1. Bước 1 – Định nghĩa Sản phẩm & Phạm vi (`DOCS/step_1.md`)
- Định vị sản phẩm: **SNOTE** – Hệ thống Second Brain chuyên sâu cho sinh viên đại học.
- Xác định 2 Personas: Sinh viên kỹ thuật/đồ án & Sinh viên ôn thi cao điểm.
- Xác định phạm vi MVP non-AI và lộ trình AI 4 giai đoạn.

### 2. Bước 2 – Mô hình Dữ liệu Quan hệ & PostgreSQL Schema (`DOCS/step_2.md`)
- Thiết kế ERD hoàn chỉnh với 10+ bảng quan hệ chặt chẽ.
- 8 Custom Enums (`NoteType`, `TaskStatus`, `TaskPriority`, `SemesterStatus`, `ScheduleEventType`...).
- Thiết kế ràng buộc CHECK chống "note rác": `(subject_id IS NOT NULL OR project_id IS NOT NULL)`.
- Chiến lược đánh chỉ mục B-Tree và GIN Indexes (Full-Text Search & JSONB metadata).

### 3. Bước 3 – Kiến trúc Hệ thống Modular Monolith (`DOCS/step_3.md`)
- Quyết định kiến trúc: **Modular Monolith** trên 1 process Node.js và 1 DB PostgreSQL duy nhất để giữ trọn vẹn ranh giới Transaction ACID.
- Phân rã 10 Bounded Contexts theo Domain-Driven Design (DDD).

### 4. Bước 3.3 – Backend Skeleton từ số 0 (`DOCS/step_3_setup.md`)
- Khởi tạo `backend/` với Node.js v24 LTS + TypeScript Strict Mode + Express 5 + Prisma 7 + PostgreSQL 16.
- Zod Fail-Fast Config loader (`process.exit(1)` nếu thiếu cấu hình).
- Module mẫu `src/modules/notes/` với đầy đủ 7 file phân tầng (Types, Schemas, Repository, Service, Controller, Routes, Index).
- Đăng ký và kiểm thử thành công: `GET /health` (200), `GET /api/notes` (200), `POST /api/notes` (201).

### 5. Bước 3.4 – Frontend SPA Feature-based (`DOCS/step_3_frontend.md`)
- Khởi tạo `frontend/` với Vite + React 19 + TypeScript + React Router DOM.
- Cấu trúc Feature-based: `features/notes`, `features/tasks`, `features/schedule`, `features/semesters`.
- Xây dựng HTTP API Client (`src/services/api.ts`) bọc fetch API với baseUrl từ `.env`.
- Build production thành công 55 modules trong 1.4s, 0 lỗi TypeScript.

### 6. Kiểm thử Tích hợp Frontend – Backend (`DOCS/step_3_integration_checklist.md`)
- Nghiệm thu 7/7 tiêu chí: CORS headers, Preflight OPTIONS, Data flow JSON, Simulated API consumption.

### 7. Bước 3.5 – Cấu trúc Repo, Shared Library & Dev Orchestration (`DOCS/step_3_repo_structure.md`)
- Khởi tạo `packages/shared/` (`@snote/shared`) chứa Enums, DTO interfaces và `ApiResponse<T>` contract.
- Cấu hình root `package.json` với `concurrently` cho phép chạy cả BE + FE chỉ bằng 1 lệnh `npm run dev`.
- Tạo master [README.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/README.md).

### 8. Bước 3.6 – Quan sát Hệ thống & Cứng hóa Bảo mật Backend (`DOCS/step_3_observability_security.md`)
- Xây dựng hệ thống `AppError` kèm `isOperational` và `context` phục vụ phân luồng log chuẩn.
- Tiện ích `asyncBoundary` bọc route handler async, chuyển lỗi tự động sang `next(err)`.
- Nâng cấp Pino Structured Logger với `redact` che giấu tokens và passwords.
- Middleware `rateLimit` siết chặt login (10 req/15m) và API chung (100 req/1m).
- `authGuard` JWT Token middleware bảo vệ chống tấn công IDOR.
- Xử lý process-level `unhandledRejection` và `uncaughtException`.

### 9. Quản trị Quy tắc & Vận hành Hệ thống
- Xây dựng [RULES.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/RULES.md) chuẩn mực quy định 10 điều luật bất biến.
- Chuẩn hóa tên phần mềm duy nhất: **SNOTE**.
- Duy trì bản đồ mã nguồn [DOCS/PROJECT_STRUCTURE_AND_MAP.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/PROJECT_STRUCTURE_AND_MAP.md).
- Sổ tay câu lệnh CLI vận hành [DOCS/COMMANDS_PLAYBOOK.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/COMMANDS_PLAYBOOK.md).
- Toàn bộ codebase được quản lý và commit qua Git (`branch main`).
