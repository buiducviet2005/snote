# Bước 3.5 – Cấu trúc Repo & Tổ chức Mã nguồn Toàn Project (SNOTE)

Tài liệu này thuộc **Bước nhỏ 5** trong cấu trúc 7 bước nhỏ của **Bước 3 lớn (Thiết kế Kiến trúc Hệ thống & Nền tảng)** cho dự án **SNOTE**.

Tài liệu xác lập cấu trúc kho lưu trữ (Repository Structure), phương án tổ chức mã nguồn độc lập giữa Backend và Frontend, kế hoạch module hóa mã nguồn dùng chung (Shared Contracts) và quy trình điều phối thực thi (Dev Orchestration).

---

## 🧭 VỊ TRÍ TRONG TIẾN TRÌNH BƯỚC 3 LỚN

- **Bước 3.1:** Chọn kiến trúc tổng thể (Modular Monolith, ranh giới 1 transaction ACID trên PostgreSQL).
- **Bước 3.2:** Thiết kế domain nội bộ & ranh giới module (10 Bounded Contexts, Layered Pattern).
- **Bước 3.3:** Chọn stack backend & dựng bộ khung skeleton từ số 0 (`DOCS/step_3_setup.md`).
- **Bước 3.4:** Chọn stack frontend & thiết lập SPA Feature-based (`DOCS/step_3_frontend.md`).
- **Bước 3.5:** **Chốt cấu trúc repo & cách tổ chức mã nguồn toàn project (Nội dung tài liệu này).**
- **Bước 3.6:** Chuẩn cấu hình môi trường & quản lý secrets.
- **Bước 3.7:** Chuẩn logging, error handling & bảo mật cơ bản.

---

## 1. Quyết định Kiến trúc Repo (Architectural Decision)

### 1.1. Lựa chọn: Single Repo Multi-App (Monorepo nhẹ)
Dự án SNOTE áp dụng mô hình **1 Git Repository duy nhất** quản lý toàn bộ hệ thống:
* **`backend/`**: Ứng dụng Node.js/Express/Prisma (API Server độc lập).
* **`frontend/`**: Ứng dụng React 19/Vite/React Router (Client SPA độc lập).
* **`packages/shared/src/`**: Source TypeScript chứa enums và DTO contracts mà frontend dùng trực tiếp qua alias.
* **`DOCS/`**: Thư mục lưu trữ toàn bộ tài liệu kiến trúc kỹ thuật và quy tắc.
* **`docker-compose.yml`**: Điều phối hạ tầng cơ sở dữ liệu PostgreSQL cục bộ.

### 1.2. Ưu điểm của mô hình này đối với SNOTE
1. **Dễ quản lý contract phía frontend:** Enum và DTO hiển thị được định nghĩa tập trung trong `packages/shared/src/`; backend hiện dùng kiểu Prisma riêng.
2. **Độc lập triển khai (Decoupled Deployments):** Backend có thể deploy lên VPS/Render/Docker Container, Frontend có thể deploy lên Vercel/Cloudflare Pages/Netlify mà không bị phụ thuộc vòng đời build.
3. **Trải nghiệm Phát triển Tối ưu (Developer Experience):** Chỉ cần 1 lệnh tại thư mục gốc (`npm run dev`) là có thể khởi động đồng thời cả Backend (Port 4000) và Frontend (Port 5173).

---

## 2. Bản đồ Cấu trúc Thư mục Toàn Project

```text
SNOTE/
├── .git/                                 # Git version control
├── .gitignore                            # Bỏ qua node_modules, .env, dist, logs
├── docker-compose.yml                    # Container PostgreSQL 16 (Port 5432)
├── package.json                          # Root scripts điều phối (dev, build, test)
├── README.md                             # Hướng dẫn chạy dự án & tổng quan hệ thống
├── DOCS/                                 # Toàn bộ tài liệu quy chuẩn kỹ thuật
│   ├── PROJECT_STRUCTURE_AND_MAP.md      # Từ điển & bản đồ mã nguồn
│   ├── step_1.md                         # Bước 1: Định nghĩa sản phẩm & phạm vi
│   ├── step_2.md                         # Bước 2: Data model, ERD & PostgreSQL schema
│   ├── step_3.md                         # Bước 3: Kiến trúc hệ thống Modular Monolith
│   ├── step_3_setup.md                   # Bước 3.3: Thiết lập Backend Skeleton
│   ├── step_3_frontend.md                # Bước 3.4: Thiết lập Frontend SPA
│   ├── step_3_repo_structure.md          # Bước 3.5: Cấu trúc repo & tổ chức mã nguồn (File này)
│   └── COMMANDS_PLAYBOOK.md               # Các lệnh cài đặt, chạy và vận hành
├── packages/                             # Các thư viện dùng chung (Shared Packages)
│   └── shared/                           # Types, Enums & DTOs dùng chung
│       ├── src/
│       │   ├── enums.ts                  # NoteType, TaskStatus, TaskPriority, SemesterStatus
│       │   ├── contracts/
│       │   │   ├── notes.contract.ts     # DTO Note Request & Response interfaces
│       │   │   ├── tasks.contract.ts     # DTO Task Request & Response interfaces
│       │   │   └── api.contract.ts       # ApiResponse wrapper
│       │   └── index.ts                  # Exports của shared TypeScript source
│       ├── package.json
│       └── tsconfig.json
├── backend/                              # Backend Node.js/Express/Prisma
│   ├── src/
│   │   ├── config/                       # Zod fail-fast environment validation
│   │   ├── shared/                       # Logger (Pino), Errors (AppError), DB (Prisma)
│   │   ├── modules/                      # Domain Bounded Contexts (notes, tasks, auth...)
│   │   └── server.ts                     # HTTP Server entry point (Port 4000)
│   ├── prisma/                           # schema.prisma & migrations
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                              # PORT=4000, CORS_ORIGIN=http://localhost:5173
└── frontend/                             # Frontend React 19/Vite SPA
    ├── src/
    │   ├── assets/styles/global.css      # CSS variables & layouts
    │   ├── components/layout/            # AppLayout, Sidebar, Topbar
    │   ├── features/                     # Feature modules (notes, tasks, schedule, semesters)
    │   ├── services/api.ts               # HTTP client wrapper
    │   ├── router/index.tsx              # React Router DOM (Port 5173)
    │   └── main.tsx
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── .env                              # VITE_API_BASE_URL=http://localhost:4000/api
```

---

## 3. Quản lý Mã nguồn Dùng chung (Shared Contracts)

Những thành phần được đặt trong `packages/shared/`:
1. **Custom Enums:**
   * `NoteType`: `LECTURE`, `LAB_REPORT`, `EXAM_PREP`, `PROJECT_LOG`, `MEETING_MINUTES`, `GENERAL`.
   * `TaskStatus`: `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`.
   * `TaskPriority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
   * `SemesterStatus`: `UPCOMING`, `ACTIVE`, `COMPLETED`, `ARCHIVED`.
2. **API Data Contracts (DTOs):**
   * Interface Request/Response cho Note, Task, Schedule, Semester.
   * `ApiResponse<T>` chuẩn hóa cấu trúc phản hồi backend (`success`, `data`, `meta`, `error`).

---

## 4. Kịch bản Điều phối Thực thi (Root Dev Scripts)

Từ thư mục gốc `SNOTE/`, lập trình viên có thể quản lý toàn bộ dự án:

| Lệnh thực thi | Chức năng |
| :--- | :--- |
| `npm run dev` | Khởi động đồng thời cả Backend (Port 4000) và Frontend (Port 5173). |
| `npm run dev:backend` | Chỉ chạy riêng Backend Server. |
| `npm run dev:frontend` | Chỉ chạy riêng Frontend Dev Server. |
| `npm run build` | Thực thi build production cho toàn bộ các packages và ứng dụng. |
| `npm run type-check` | Chạy TypeScript type-checking trên toàn bộ codebase. |
