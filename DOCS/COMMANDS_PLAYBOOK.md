# SỔ TAY CÂU LỆNH ĐIỀU KHIỂN & VẬN HÀNH DỰ ÁN SNOTE (COMMAND PLAYBOOK)

Tài liệu này là **Sổ tay tra cứu tập trung toàn bộ câu lệnh CLI** phục vụ cho việc khởi chạy, phát triển, kiểm thử, build, migration database và vận hành dự án **SNOTE**.

> ⚠️ **QUY TẮC BẮT BUỘC (MANDATORY RULE - ĐIỀU 5 RULES.MD):**  
> Mỗi khi thêm mới chức năng, script mới, migration mới, endpoint kiểm thử mới hoặc bất kỳ thao tác CLI nào mà Developer cần biết, **bắt buộc phải cập nhật và bổ sung ngay lập tức vào tài liệu này**.

---

## 🧭 MỤC LỤC TRA CỨU NHANH

1. [Lệnh Khởi chạy & Phát triển (Dev Orchestration)](#1-lệnh-khởi-chạy--phát-triển-dev-orchestration)
2. [Lệnh Hạ tầng & Cơ sở Dữ liệu (Docker & PostgreSQL)](#2-lệnh-hạ-tầng--cơ-sở-dữ-liệu-docker--postgresql)
3. [Lệnh Prisma ORM & Database Migration](#3-lệnh-prisma-orm--database-migration)
4. [Lệnh Build & Kiểm tra Kiểu dữ liệu (Type-Check)](#4-lệnh-build--kiểm-tra-kiểu-dữ-liệu-type-check)
5. [Lệnh Kiểm thử & Nghiệm thu Endpoints (Testing & Verification)](#5-lệnh-kiểm-thử--nghiệm-thu-endpoints-testing--verification)
6. [Lệnh Quản lý Mã nguồn Git (Version Control)](#6-lệnh-quản-lý-mã-nguồn-git-version-control)
7. [Lệnh Dọn dẹp & Khởi tạo Lại (Clean & Reset)](#7-lệnh-dọn-dẹp--khởi-tạo-lại-clean--reset)

---

## 1. Lệnh Khởi chạy & Phát triển (Dev Orchestration)

Tất cả các lệnh này có thể thực thi trực tiếp tại **thư mục gốc của dự án (`SNOTE/`)**:

| Thao tác mong muốn | Câu lệnh thực thi (Tại Root) | Chi tiết hoạt động |
| :--- | :--- | :--- |
| **Chạy đồng thời cả Backend + Frontend** | `npm run dev` | Dùng `concurrently` khởi chạy Backend (Port 4000) và Frontend Vite (Port 5173) song song trên 1 terminal. |
| **Chỉ chạy riêng Backend API Server** | `npm run dev:backend` | Khởi động Backend tại `http://localhost:4000` qua `tsx src/server.ts` (Tự reload khi code đổi). |
| **Chỉ chạy riêng Frontend Dev Server** | `npm run dev:frontend` | Khởi động Frontend tại `http://localhost:5173` qua `vite` (HMR cực nhanh). |
| **Chạy Backend từ thư mục backend** | `cd backend && npm run dev` | Khởi chạy cục bộ bên trong thư mục backend. |
| **Chạy Frontend từ thư mục frontend** | `cd frontend && npm run dev` | Khởi chạy cục bộ bên trong thư mục frontend. |

---

## 2. Lệnh Hạ tầng & Cơ sở Dữ liệu (Docker & PostgreSQL)

Thực thi tại **thư mục gốc `SNOTE/`**:

| Thao tác | Câu lệnh thực thi | Ghi chú |
| :--- | :--- | :--- |
| **Khởi động PostgreSQL Container** | `docker compose up -d postgres_db` | Khởi chạy container `ainote_postgres` (Port 5432) chạy ngầm (`-d`). |
| **Xem trạng thái Container** | `docker compose ps` | Kiểm tra container có trạng thái `Up (healthy)` hay không. |
| **Xem Logs của Database** | `docker compose logs -f postgres_db` | Theo dõi logs kết nối PostgreSQL trực tiếp. |
| **Dừng Container Database** | `docker compose stop postgres_db` | Tạm dừng container mà không xóa dữ liệu trong volume. |
| **Tắt và Xóa Container (Giữ Volume)**| `docker compose down` | Dừng và xóa network/container. |

---

## 3. Lệnh Prisma ORM & Database Migration

Thực thi bên trong thư mục **`backend/`** (`cd backend`):

| Thao tác | Câu lệnh thực thi (Trong `backend/`) | Ghi chú |
| :--- | :--- | :--- |
| **Sinh Prisma Client mới** | `npx prisma generate` | Sinh lại `@prisma/client` trong `node_modules` sau khi sửa `schema.prisma`. |
| **Tạo & Áp dụng Migration mới** | `npx prisma migrate dev --name <ten_migration>` | Ví dụ: `npx prisma migrate dev --name init_step_4_schema`. |
| **Mở giao diện trực quan Prisma Studio** | `npx prisma studio` | Mở GUI quản lý và xem dữ liệu bảng tại `http://localhost:5555`. |
| **Định dạng & Chuẩn hóa file Schema** | `npx prisma format` | Tự động canh lề và format file `prisma/schema.prisma`. |
| **Kiểm tra trạng thái Migrations** | `npx prisma migrate status` | Kiểm tra các migration đã được áp dụng vào DB chưa. |

---

## 4. Lệnh Build & Kiểm tra Kiểu dữ liệu (Type-Check)

Thực thi tại **thư mục gốc `SNOTE/`**:

| Thao tác | Câu lệnh thực thi | Ghi chú |
| :--- | :--- | :--- |
| **Build toàn bộ dự án** | `npm run build` | Thực thi build production cho cả Backend (tsc) và Frontend (Vite build). |
| **Kiểm tra TypeScript toàn bộ** | `npm run type-check` | Chạy `tsc --noEmit` trên cả `backend/` và `frontend/` để phát hiện lỗi kiểu. |
| **Build riêng Shared Library** | `npx tsc --project packages/shared/tsconfig.json` | Build `@snote/shared` xuất file định nghĩa `.d.ts` vào `packages/shared/dist/`. |
| **Build riêng Backend** | `cd backend && npm run build` | Biên dịch TypeScript backend vào thư mục `backend/dist/`. |
| **Build riêng Frontend** | `cd frontend && npm run build` | Đóng gói production frontend vào thư mục `frontend/dist/`. |

---

## 5. Lệnh Kiểm thử & Nghiệm thu Endpoints (Testing & Verification)

### 5.1. Kiểm tra qua PowerShell (Windows):
```powershell
# 1. Kiểm tra Health Check Backend
Invoke-RestMethod -Uri "http://localhost:4000/health" -Method Get | ConvertTo-Json

# 2. Lấy danh sách ghi chú (GET /api/notes)
Invoke-RestMethod -Uri "http://localhost:4000/api/notes" -Method Get | ConvertTo-Json

# 3. Tạo ghi chú mới (POST /api/notes)
$body = @{
  title = "Bài giảng Kiến trúc Hệ thống"
  content = "Modular Monolith trên PostgreSQL"
  subjectId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
  noteType = "LECTURE"
  tagNames = @("Architecture", "PostgreSQL")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/notes" -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json
```

### 5.2. Kiểm tra qua cURL / Linux / macOS:
```bash
# 1. Health Check
curl -X GET http://localhost:4000/health

# 2. GET Notes
curl -X GET http://localhost:4000/api/notes

# 3. POST Note
curl -X POST http://localhost:4000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Ghi chú mẫu","content":"Nội dung","subjectId":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11","noteType":"LECTURE"}'
```

---

## 6. Lệnh Quản lý Mã nguồn Git (Version Control)

Thực thi tại **thư mục gốc `SNOTE/`**:

| Thao tác | Câu lệnh thực thi | Ghi chú |
| :--- | :--- | :--- |
| **Kiểm tra trạng thái thay đổi** | `git status` | Xem các file modified, untracked. |
| **Xem lịch sử commit ngắn gọn** | `git log -n 5 --oneline` | Hiển thị 5 commits gần nhất. |
| **Stage toàn bộ file thay đổi** | `git add .` | Lưu ý: `.gitignore` đã tự loại bỏ `.env` và `node_modules/`. |
| **Tạo Commit chuẩn Conventional** | `git commit -m "loai_thay_doi: mo_ta_ngan_gon"` | Ví dụ: `git commit -m "feat: implement auth login controller"`. |
| **Đẩy code lên GitHub repository** | `git push -u origin main` | Đẩy commit lên branch `main` của `https://github.com/naverisme/snote.git`. |

---

## 7. Lệnh Dọn dẹp & Khởi tạo Lại (Clean & Reset)

| Thao tác | Câu lệnh thực thi | Ghi chú |
| :--- | :--- | :--- |
| **Cài đặt lại toàn bộ dependencies** | `npm install`<br>`cd backend && npm install`<br>`cd ../frontend && npm install`<br>`cd ..` | Cài đặt lại các gói thư viện sau khi clone project từ Git. |
| **Xóa toàn bộ thư mục Build (`dist/`)** | `Remove-Item -Recurse -Force backend/dist, frontend/dist, packages/shared/dist` *(PowerShell)* | Xóa các file build cũ để build sạch từ đầu. |
