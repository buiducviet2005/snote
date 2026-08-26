# Bước 3.3 – Thiết lập Môi trường & Bộ khung Backend từ Số 0 (Setup Guide)

Tài liệu này thuộc **Bước nhỏ 3** trong cấu trúc 7 bước nhỏ của **Bước 3 lớn (Thiết kế Kiến trúc Hệ thống & Nền tảng)** cho dự án **AI Note**.

---

## 🧭 CẤU TRÚC 7 BƯỚC NHỎ CỦA BƯỚC 3 LỚN

- **Bước 3.1:** Chọn kiến trúc tổng thể (Modular Monolith, ranh giới 1 transaction ACID, future-ready).
- **Bước 3.2:** Thiết kế domain nội bộ & ranh giới module (10 Bounded Contexts, Layered Pattern, Acyclic Graph).
- **Bước 3.3:** **Chọn stack backend, thiết lập môi trường & dựng bộ khung skeleton từ số 0 (Nội dung tài liệu này).**
- **Bước 3.4:** Chọn stack frontend & chiến lược state (React + Vite SPA, TanStack Query, Zustand).
- **Bước 3.5:** Thiết kế cấu trúc thư mục repo & tổ chức mã nguồn (Backend, Frontend, Docs, Docker).
- **Bước 3.6:** Chuẩn cấu hình môi trường & quản lý secrets (Fail-fast Zod validation, `.env.example`).
- **Bước 3.7:** Chuẩn logging, error handling & bảo mật cơ bản (Pino, Custom AppErrors, Dual-token JWT, anti-IDOR, Helmet, CORS).

---

## 🛠️ TIẾN ĐỘ THỰC HIỆN CỦA BƯỚC 3.3 (BACKEND SETUP SKELETON)

| Mục | Hạng mục công việc chi tiết | File / Lệnh liên quan | Trạng thái thực tế |
| :---: | :--- | :--- | :---: |
| **1** | Cài đặt công cụ nền tảng (Node.js, Git, Docker, IDE) | `node -v`, `git --version` | ✅ **Hoàn thành** *(Node v24.15.0, npm 11.15.0, Git)* |
| **2** | Khởi tạo cấu trúc thư mục dự án | `backend/`, `DOCS/` | ✅ **Hoàn thành 100%** |
| **3** | Chuẩn bị PostgreSQL dev qua Docker | `docker-compose.yml` | ✅ **Hoàn thành 100%** *(File đã tạo sẵn)* |
| **4** | Khởi tạo backend Node + TypeScript + Scripts | `backend/package.json`<br>`backend/tsconfig.json` | ✅ **Hoàn thành 100%** *(TypeScript Strict Mode)* |
| **5** | Cài đặt Express, CORS, Dotenv & tạo Server | `backend/src/server.ts` | ✅ **Hoàn thành 100%** |
| **6** | Setup Prisma ORM & Connection Client | `backend/prisma/schema.prisma`<br>`backend/prisma.config.ts`<br>`src/shared/db/prismaClient.ts` | ✅ **Hoàn thành 100%** *(Generate v7.10.0 thành công)* |
| **7** | Tạo file cấu hình `.env.example` & `.env` | `backend/.env.example`<br>`backend/.env` | ✅ **Hoàn thành 100%** |
| **8** | Xây dựng Skeleton Module `notes` & Wiring | `backend/src/modules/notes/` (7 files) | ✅ **Hoàn thành 100%** *(Types, Schemas, Service, Controller, Routes)* |
| **9** | Thiết lập Logging (Pino), Error Handler, Helmet | `src/shared/utils/logger.ts`<br>`src/shared/errors/appErrors.ts`<br>`src/shared/middleware/errorHandler.ts` | ✅ **Hoàn thành 100%** |
| **10**| Kiểm thử khởi động & Gọi HTTP Endpoints | `GET /health`<br>`GET /api/notes`<br>`POST /api/notes` | ✅ **Hoàn thành 100%** *(Phản hồi HTTP 200/201 OK)* |

---

## 📌 TỔNG KẾT BƯỚC 3.3
Toàn bộ phần code khung, dependencies, logger, error handler, schema validation và endpoints test của **Bước 3.3** đã được hoàn thiện **100%** và kiểm thử thành công trên hệ thống.
