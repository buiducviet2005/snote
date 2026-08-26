# Bảng Checklist Thiết lập Kỹ thuật Bước 3 (Setup Checklist)

Tài liệu này dùng để theo dõi, quản lý tiến độ và đánh dấu các hạng mục cần thiết lập (setup) từ số 0 cho **Bước 3 – Kiến trúc Hệ thống & Nền tảng** trước khi chuyển giao sang **Bước 4 – Triển khai Backend Core**.

---

## 📊 BẢNG TỔNG QUAN TIẾN ĐỘ

| Giai đoạn | Hạng mục công việc | Số tác vụ | Trạng thái |
| :--- | :--- | :---: | :---: |
| **Giai đoạn 1** | Cài đặt Công cụ & Phần mềm Nền tảng | 3 | 🟡 1 / 3 Hoàn thành |
| **Giai đoạn 2** | Thiết lập Hạ tầng Database Cục bộ (Docker PostgreSQL) | 2 | 🟡 1 / 2 Hoàn thành |
| **Giai đoạn 3** | Khởi tạo Project Backend & Cài đặt Dependencies | 4 | ✅ 4 / 4 Hoàn thành |
| **Giai đoạn 4** | Quản lý Biến Môi trường & Module Config Fail-Fast | 3 | ✅ 3 / 3 Hoàn thành |
| **Giai đoạn 5** | Khởi tạo Prisma ORM & Connection Client | 3 | ✅ 3 / 3 Hoàn thành |
| **Giai đoạn 6** | Thiết lập Logging, Error Handling & Middlewares | 3 | ✅ 3 / 3 Hoàn thành |
| **Giai đoạn 7** | Xây dựng Skeleton Module & Server Entry Point | 3 | ✅ 3 / 3 Hoàn thành |
| **Giai đoạn 8** | Kiểm thử Khởi động & Nghiệm thu Cuối (Verification) | 2 | ✅ 2 / 2 Hoàn thành |
| **TỔNG CỘNG** | **Toàn bộ quy trình thiết lập nền tảng** | **23** | **🎉 20 / 23 Hoàn thành** |

---

## 1. Giai đoạn 1: Công cụ & Môi trường Host (Prerequisites)

| Trạng thái | ID | Hạng mục kiểm tra | File / Lệnh liên quan | Tiêu chí đạt |
| :---: | :---: | :--- | :--- | :--- |
| [x] | `PRE-01` | Cài đặt Node.js LTS (v18, v20 hoặc v22) | `node -v`<br>`npm -v` | In ra phiên bản Node $\ge 18.0.0$ và npm $\ge 9.0.0$ *(Đã xác nhận: Node v24.15.0, npm 11.15.0)* |
| [ ] | `PRE-02` | Cài đặt & Khởi động Docker Desktop / Engine | `docker --version`<br>`docker compose version` | Docker daemon đang chạy và sẵn sàng nhận lệnh *(Host đang có sẵn PostgreSQL-18 Native Service)* |
| [ ] | `PRE-03` | Cài đặt VS Code Extensions khuyên dùng | IDE Extensions | Đã bật: `Prisma`, `ESLint`, `Prettier`, `DotENV` *(Tùy chọn thiết lập trên IDE của bạn)* |

---

## 2. Giai đoạn 2: Hạ tầng Database Cục bộ (Docker PostgreSQL)

| Trạng thái | ID | Hạng mục kiểm tra | File / Lệnh liên quan | Tiêu chí đạt |
| :---: | :---: | :--- | :--- | :--- |
| [x] | `DB-01` | Tạo file `docker-compose.yml` tại root | `docker-compose.yml` | Khai báo image `postgres:16-alpine`, port `5432:5432`, volume persistent *(Đã tạo file)* |
| [ ] | `DB-02` | Khởi chạy container PostgreSQL 16 | `docker compose up -d postgres_db` | Container `ainote_postgres` trạng thái `Up (healthy)` trên port `5432` *(Chạy khi bật Docker Desktop)* |

---

## 3. Giai đoạn 3: Khởi tạo Backend Project & Dependencies

| Trạng thái | ID | Hạng mục kiểm tra | File / Lệnh liên quan | Tiêu chí đạt |
| :---: | :---: | :--- | :--- | :--- |
| [x] | `PKG-01` | Khởi tạo thư mục và `package.json` | `backend/package.json` | Khởi tạo qua `npm init -y` bên trong thư mục `backend/` *(Đã khởi tạo)* |
| [x] | `PKG-02` | Cài đặt Production Dependencies | `npm install express cors dotenv helmet express-rate-limit zod pino pino-http @prisma/client` | Có đầy đủ 9 packages trong `dependencies` của `package.json` *(Đã cài đặt)* |
| [x] | `PKG-03` | Cài đặt Development Dependencies | `npm install -D typescript tsx @types/node @types/express @types/cors pino-pretty prisma` | Có đầy đủ 7 dev packages trong `devDependencies` *(Đã cài đặt)* |
| [x] | `PKG-04` | Cấu hình TypeScript & NPM Scripts | `backend/tsconfig.json`<br>`backend/package.json` | Bật `strict: true`, target `ES2022`; có script `dev`, `build`, `start`, `prisma:generate`, `prisma:migrate` *(Đã cấu hình)* |

---

## 4. Giai đoạn 4: Biến Môi trường & Config Fail-Fast (Zod)

| Trạng thái | ID | Hạng mục kiểm tra | File / Lệnh liên quan | Tiêu chí đạt |
| :---: | :---: | :--- | :--- | :--- |
| [x] | `ENV-01` | Tạo file mẫu `.env.example` | `backend/.env.example` | Khai báo đầy đủ: `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN` *(Đã tạo)* |
| [x] | `ENV-02` | Tạo file cấu hình thực tế `.env` | `backend/.env` | Sao chép từ `.env.example` với connection string chuẩn tới Docker DB *(Đã tạo)* |
| [x] | `ENV-03` | Xây dựng Module Validate Config Fail-Fast | `backend/src/config/env-schema.ts`<br>`backend/src/config/env.ts` | Sử dụng Zod để parse env; nếu thiếu/sai thì `process.exit(1)` ngay khi khởi động *(Đã hoàn thiện)* |

---

## 5. Giai đoạn 5: Khởi tạo Prisma ORM & Database Client

| Trạng thái | ID | Hạng mục kiểm tra | File / Lệnh liên quan | Tiêu chí đạt |
| :---: | :---: | :--- | :--- | :--- |
| [x] | `ORM-01` | Khởi tạo cấu trúc Prisma | `npx prisma init` | Sinh ra thư mục `backend/prisma/` và file `schema.prisma` *(Đã khởi tạo)* |
| [x] | `ORM-02` | Cấu hình Datasource PostgreSQL | `backend/prisma/schema.prisma`<br>`backend/prisma.config.ts` | Khai báo provider `"postgresql"` và `url = env("DATABASE_URL")` *(Đã cấu hình & Generate Client thành công)* |
| [x] | `ORM-03` | Tạo PrismaClient Singleton Instance | `backend/src/shared/db/prismaClient.ts` | Export một instance `prisma` duy nhất dùng chung toàn hệ thống *(Đã hoàn thiện)* |

---

## 6. Giai đoạn 6: Logging, Custom Errors & Middlewares

| Trạng thái | ID | Hạng mục kiểm tra | File / Lệnh liên quan | Tiêu chí đạt |
| :---: | :---: | :--- | :--- | :--- |
| [x] | `LOG-01` | Cấu hình Pino Structured Logger | `backend/src/shared/utils/logger.ts` | Log ra JSON format, hỗ trợ pretty-print trên môi trường development *(Đã hoàn thiện)* |
| [x] | `ERR-01` | Định nghĩa Cây Phân cấp Custom Errors | `backend/src/shared/errors/appErrors.ts` | Khai báo các class: `AppError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError` *(Đã hoàn thiện)* |
| [x] | `MID-01` | Xây dựng Middleware Bắt lỗi Tập trung | `backend/src/shared/middleware/errorHandler.ts` | Bắt `AppError` trả mã chuẩn; bắt lỗi DB; lỗi 500 không leak stack trace ra ngoài *(Đã hoàn thiện)* |

---

## 7. Giai đoạn 7: Skeleton Module & Server Entry Point

| Trạng thái | ID | Hạng mục kiểm tra | File / Lệnh liên quan | Tiêu chí đạt |
| :---: | :---: | :--- | :--- | :--- |
| [x] | `MOD-01` | Tạo cấu trúc thư mục domain `notes` | `backend/src/modules/notes/` | Đầy đủ 7 file khung: `notes.routes.ts`, `notes.controller.ts`, `notes.service.ts`, `notes.repository.ts`, `notes.schemas.ts`, `notes.types.ts`, `index.ts` *(Đã tạo đủ 7 files)* |
| [x] | `MOD-02` | Định nghĩa Skeleton Router & Controller mẫu | `backend/src/modules/notes/notes.routes.ts`<br>`backend/src/modules/notes/notes.controller.ts` | Có sẵn route `GET /` và `POST /` trả stub JSON kèm validate Zod *(Đã hoàn thiện)* |
| [x] | `SRV-01` | Xây dựng Entry Point `server.ts` | `backend/src/server.ts` | Wire-up toàn bộ: `helmet`, `cors`, `express.json()`, `notesRouter`, `errorHandler`, `health` endpoint *(Đã hoàn thiện)* |

---

## 8. Giai đoạn 8: Kiểm thử Xác nhận Khởi động (Verification)

| Trạng thái | ID | Hạng mục kiểm tra | File / Lệnh liên quan | Tiêu chí đạt |
| :---: | :---: | :--- | :--- | :--- |
| [x] | `VER-01` | Khởi động Dev Server thành công | `npm run dev` (trong `backend/`) | Server khởi chạy không lỗi, in log: `🚀 Server AI Note Backend đang chạy tại port 4000` *(Đã kiểm thử thành công)* |
| [x] | `VER-02` | Kiểm tra HTTP Endpoints hoạt động | `curl http://localhost:4000/health`<br>`curl http://localhost:4000/api/notes` | `/health` trả về `{ "status": "ok" }` (HTTP 200)<br>`/api/notes` (GET/POST) trả về JSON chuẩn (HTTP 200/201) *(Đã kiểm thử)* |

---

## 📝 HƯỚNG DẪN THỰC THI NHANH (QUICK ACTIONS)

### 1. Khởi chạy Server phát triển:
```bash
cd backend
npm run dev
```

### 2. Kiểm tra API nhanh qua cURL / PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:4000/health" -Method Get
Invoke-RestMethod -Uri "http://localhost:4000/api/notes" -Method Get
```
