# SNOTE – Second Brain cho Sinh viên Đại học

> **SNOTE** là ứng dụng ghi chú thông minh, quản lý công việc và học tập toàn diện được thiết kế chuyên biệt cho sinh viên theo triết lý *Second Brain*, giải quyết triệt để vấn đề "note rác" và hỗ trợ tối đa cho các kỳ thi.

---

## 🏗️ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống SNOTE được xây dựng theo mô hình **Modular Monolith** phân tầng rõ ràng:
* **Backend API (`backend/`):** Node.js LTS, Express, TypeScript (Strict Mode), Prisma ORM v7, PostgreSQL 16, Pino Logger, Zod Fail-Fast Config.
* **Frontend SPA (`frontend/`):** React 19, TypeScript, Vite, React Router DOM (Feature-based: `notes`, `tasks`, `schedule`, `semesters`).
* **Shared Contracts (`packages/shared/src/`):** Enums và DTO cho frontend; backend dùng types do Prisma sinh.
* **Database (`docker-compose.yml`):** PostgreSQL 16 Alpine với persistent storage.
* **Tài liệu Kỹ thuật (`DOCS/`):** Lưu trữ toàn bộ đặc tả kiến trúc từ Bước 1 đến Bước 8.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY NHANH (QUICK START)

> 📖 **Cẩm nang Thiết lập & Đẩy code lên GitHub:** [HUONG_DAN_SETUP_VA_GITHUB.md](HUONG_DAN_SETUP_VA_GITHUB.md)  
> 📖 **Hướng dẫn cài đặt chi tiết:** [SETUP.md](SETUP.md)
> ⚡ **Khởi tạo tự động 1-Click:**  
> - **Windows:** Chạy file `setup.bat`  
> - **macOS / Linux:** Chạy `./setup.sh`

### 1. Yêu cầu Tiền đề (Prerequisites)
* **Node.js:** `20.19+`, `22.12+` hoặc `24+` (theo yêu cầu của Prisma 7).
* **Docker Desktop / PostgreSQL 16:** Đã bật và sẵn sàng.

### 2. Cài đặt Dependencies
```bash
# Cài đặt root dependencies
npm install

# Cài đặt backend dependencies
cd backend && npm install && cd ..

# Cài đặt frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Cấu hình Môi trường
```bash
# Backend (.env đã được chuẩn bị sẵn mẫu)
cp backend/.env.example backend/.env

# Frontend (.env đã được chuẩn bị sẵn mẫu)
cp frontend/.env.example frontend/.env
```

### 4. Khởi chạy Database Cục bộ (Docker)
```bash
docker compose up -d postgres_db
```

### 5. Khởi chạy Toàn bộ Ứng dụng (1 Lệnh duy nhất)
Tại thư mục gốc của dự án `SNOTE/`:
```bash
npm run dev
```
* **Backend Server:** Lắng nghe tại `http://localhost:4000` (API Base: `/api`).
* **Frontend SPA:** Lắng nghe tại `http://localhost:5173`.

---

## 🛠️ CÁC LỆNH HỖ TRỢ (DEVELOPER SCRIPTS)

| Lệnh | Chức năng |
| :--- | :--- |
| `npm run dev` | Khởi chạy song song cả Backend (Port 4000) và Frontend (Port 5173). |
| `npm run dev:backend` | Chỉ chạy riêng Backend Server. |
| `npm run dev:frontend` | Chỉ chạy riêng Frontend Dev Server. |
| `npm run build` | Build production cho toàn bộ backend và frontend. |
| `npm run type-check` | Kiểm tra tính toàn vẹn kiểu dữ liệu TypeScript toàn dự án. |

---

## 📚 TÀI LIỆU DỰ ÁN ([DOCS/](DOCS/))

* [DOCS/CLASSROOM_MODEL.md](DOCS/CLASSROOM_MODEL.md): Vai trò và luồng lớp học, nhóm, dự án, báo cáo tiến độ.
* [DOCS/AGENT_TOOLING_REVIEW.md](DOCS/AGENT_TOOLING_REVIEW.md): Đánh giá bộ skills và hướng làm việc cho agent.

* [DOCS/PROJECT_STRUCTURE_AND_MAP.md](DOCS/PROJECT_STRUCTURE_AND_MAP.md): Từ điển cấu trúc, danh mục file và công nghệ sử dụng.
* [DOCS/TECH_STACK_REVIEW.md](DOCS/TECH_STACK_REVIEW.md): Nhãn đánh giá công nghệ và quyết định giữ/bỏ.
* [DOCS/step_1.md](DOCS/step_1.md): Bước 1 – Định nghĩa sản phẩm & Phạm vi.
* [DOCS/step_2.md](DOCS/step_2.md): Bước 2 – Mô hình dữ liệu quan hệ, ERD & PostgreSQL schema.
* [DOCS/step_3.md](DOCS/step_3.md): Bước 3 – Kiến trúc hệ thống Modular Monolith.
* [DOCS/step_3_setup.md](DOCS/step_3_setup.md): Bước 3.3 – Thiết lập Backend Skeleton từ số 0.
* [DOCS/step_3_frontend.md](DOCS/step_3_frontend.md): Bước 3.4 – Thiết lập Frontend SPA Feature-based.
* [DOCS/step_3_repo_structure.md](DOCS/step_3_repo_structure.md): Bước 3.5 – Cấu trúc Repo & Tổ chức mã nguồn.
* [DOCS/step_3_observability_security.md](DOCS/step_3_observability_security.md): Bước 3.6 – Quan sát hệ thống & Cứng hóa bảo mật Backend.
* [DOCS/step_3_architecture.md](DOCS/step_3_architecture.md): Bước 3.7 – Đặc tả toàn diện kiến trúc hệ thống & nghiệm thu nền tảng.
* [DOCS/COMMANDS_PLAYBOOK.md](DOCS/COMMANDS_PLAYBOOK.md): Sổ tay tra cứu toàn bộ câu lệnh CLI điều khiển & vận hành dự án.
