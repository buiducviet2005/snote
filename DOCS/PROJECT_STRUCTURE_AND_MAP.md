# TỪ ĐIỂN CẤU TRÚC VÀ BẢN ĐỒ MÃ NGUỒN DỰ ÁN (SNOTE)

Tài liệu này đóng vai trò là **Nguồn Chân lý Duy nhất (Single Source of Truth)** về toàn bộ cấu trúc thư mục, danh mục tệp tin, công nghệ sử dụng và chức năng chi tiết của từng thành phần trong dự án **AI Note (SNOTE)**.

> ⚠️ **QUY TẮC BẮT BUỘC (MANDATORY RULE):**  
> Mỗi khi thêm mới, chỉnh sửa hoặc xóa bất kỳ file/folder/công nghệ nào trong dự án, lập trình viên / AI Agent **bắt buộc phải cập nhật ngay lập tức** vào tài liệu này để đảm bảo việc tra cứu thông tin luôn chính xác và đồng nhất qua các phiên làm việc.

---

## 1. TỔNG QUAN CÔNG NGHỆ SỬ DỤNG (TECH STACK CATALOG)

| Phân vùng | Thành phần | Công nghệ / Thư viện | Phiên bản | Vai trò & Chức năng |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | Runtime Environment | `Node.js` | `v24.15.0 LTS` | Môi trường thực thi JavaScript/TypeScript server-side. |
| | Ngôn ngữ | `TypeScript` (Strict Mode) | `^5.7.3` | Type-safety, loại bỏ runtime type errors cho DTOs và entities. |
| | Web Framework | `Express.js` | `^5.2.1` | Xây dựng REST API, quản lý routing và pipeline middlewares. |
| | ORM & DB Client | `Prisma ORM` | `^7.10.0` | Quản lý schema, sinh PrismaClient type-safe, migration database. |
| | Database Engine | `PostgreSQL` | `16-alpine` | Cơ sở dữ liệu quan hệ, ACID transaction, JSONB, Full-Text Search. |
| | Configuration | `Zod` + `dotenv` | `^3.23.8` | Xác thực biến môi trường theo cơ chế **Fail-Fast** khi khởi động. |
| | Logging | `Pino` + `pino-http` | `^10.3.1` | Ghi log dạng Structured JSON kèm `x-request-id` và thời gian phản hồi. |
| | Bảo mật (Security) | `helmet` + `cors` | `^8.3.0` / `^2.8.6` | Thiết lập HTTP Security Headers và cấu hình Whitelist Origin CORS. |
| | Rate Limiting | `express-rate-limit` | `^8.6.2` | Ngăn chặn brute-force và spam request trên các routes nhạy cảm. |
| **Frontend**| Bundler & Server | `Vite` | `^6.2.0` | Dev server tốc độ cao (ESM HMR) và build tối ưu hóa production. |
| | UI Framework | `React` | `^19.0.0` | Xây dựng giao diện người dùng Single Page Application (SPA). |
| | Ngôn ngữ | `TypeScript` | `^5.7.3` | Kiểu dữ liệu tĩnh cho UI Components, Custom Hooks và API Types. |
| | Client Routing | `react-router-dom` | `^7.2.0` | Định tuyến Client-side SPA (`/notes`, `/tasks`, `/schedule`, `/semesters`). |
| | Network Client | `Fetch API Wrapper` | Native | HTTP Client đóng gói sẵn Base URL, typed request/response và error handling. |
| | Styling | `CSS3 (Custom Properties)`| Native | Hệ thống biến màu sắc, typography và bố cục responsive. |
| **DevOps** | Containerization | `Docker Compose` | `v3.9` | Đóng gói và chạy container PostgreSQL cục bộ có persistent volume. |
| | Version Control | `Git` / `GitHub` | Remote | Quản lý phiên bản mã nguồn tại `https://github.com/naverisme/snote.git`. |

---

## 2. BẢN ĐỒ CÂY THƯ MỤC TỔNG THỂ (DIRECTORY TREE)

```text
SNOTE/
├── .gitignore                            # Cấu hình bỏ qua các file nhạy cảm và build artifacts
├── docker-compose.yml                    # Cấu hình container PostgreSQL 16 local
├── package.json                          # Root scripts điều phối (dev, build, type-check)
├── README.md                             # Hướng dẫn khởi chạy & tổng quan hệ thống
├── RULES.md                              # Bảng quy tắc & luật phát triển bắt buộc của dự án
├── DOCS/                                 # Thư mục lưu trữ tài liệu quy chuẩn kỹ thuật
│   ├── RULES.md                          # Bản sao quy tắc dự án trong thư mục docs
│   ├── PROJECT_STRUCTURE_AND_MAP.md      # Tài liệu này: Từ điển & bản đồ mã nguồn
│   ├── step_1.md                         # Bước 1: Định nghĩa sản phẩm & phạm vi (MVP & Roadmap)
│   ├── step_2.md                         # Bước 2: Thiết kế mô hình dữ liệu, ERD & Schema PostgreSQL
│   ├── step_3.md                         # Bước 3: Thiết kế kiến trúc hệ thống (Modular Monolith)
│   ├── step_3_setup.md                   # Bước 3.3: Hướng dẫn thiết lập Backend Skeleton từ số 0
│   ├── step_3_frontend.md                # Bước 3.4: Hướng dẫn thiết lập Frontend SPA Feature-based
│   ├── step_3_repo_structure.md          # Bước 3.5: Cấu trúc repo & tổ chức mã nguồn
│   ├── step_3_observability_security.md  # Bước 3.6: Quan sát hệ thống & Cứng hóa bảo mật Backend
│   ├── step_3_architecture.md            # Bước 3.7: Đặc tả toàn diện kiến trúc & nghiệm thu Bước 3
│   ├── step_3_setup_checklist.md         # Bảng checklist tổng quan tiến độ Bước 3 (28/28 Hoàn thành)
│   ├── step_3_integration_checklist.md   # Bảng checklist kiểm tra kết nối Frontend & Backend
│   ├── step_3.5_checklist.md             # Bảng checklist thực thi Bước 3.5
│   ├── step_3.6_checklist.md             # Bảng checklist thực thi Bước 3.6
│   ├── step_3.7_checklist.md             # Bảng checklist thực thi Bước 3.7
│   ├── COMMANDS_PLAYBOOK.md              # Sổ tay toàn bộ câu lệnh điều khiển & vận hành dự án
│   └── ai_chat_docs/                     # Trung tâm tri thức & tài liệu dành riêng cho Chat AI
│       ├── README.md                     # Bản đồ tri thức & nguyên tắc làm việc với AI Docs
│       ├── 01_PROJECT_ACHIEVEMENTS.md    # Tổng kết thành tựu & cột mốc đã hoàn thành 100%
│       ├── 02_PENDING_TASKS_AND_ROADMAP.md # Danh mục công việc cần làm & lộ trình tiếp theo
│       ├── 03_DEVELOPMENT_WORKFLOW_AND_PROCESS.md # Quy trình phát triển & chuẩn mực kỹ thuật
│       ├── 04_RESEARCH_GUARDRAILS_AND_LAWS.md # Ranh giới nghiên cứu & các luật bất biến
│       ├── 05_AI_ROADMAP_AND_FUTURE_STRATEGY.md # Lộ trình AI & chiến lược tương lai 4 giai đoạn
│       └── 06_STEP_3_HANDOVER_AND_COMPLETION.md # Biên bản nghiệm thu Bước 3 & bàn giao Bước 4
├── packages/                             # Các thư viện dùng chung (Shared Packages)
│   └── shared/                           # Types, Enums & DTOs dùng chung toàn dự án
│       ├── package.json                  # Khai báo package @snote/shared
│       ├── tsconfig.json                 # Cấu hình TypeScript cho shared library
│       └── src/
│           ├── enums.ts                  # Enums chuẩn (NoteType, TaskStatus, TaskPriority...)
│           ├── contracts/
│           │   ├── notes.contract.ts     # DTO Note Request & Response interfaces
│           │   ├── tasks.contract.ts     # DTO Task Request & Response interfaces
│           │   └── api.contract.ts       # ApiResponse wrapper & pagination
│           └── index.ts                  # Public API của shared package
├── backend/                              # Mã nguồn Backend API (Node.js + Express + Prisma)
│   ├── .env                              # Biến môi trường local (Không commit vào Git)
│   ├── .env.example                      # File mẫu biến môi trường
│   ├── package.json                      # Khai báo packages và scripts của backend
│   ├── package-lock.json                 # Khóa phiên bản dependencies backend
│   ├── tsconfig.json                     # Cấu hình TypeScript Strict Mode cho backend
│   ├── prisma.config.ts                  # Cấu hình kết nối datasource cho Prisma 7
│   ├── prisma/
│   │   └── schema.prisma                 # Định nghĩa mô hình dữ liệu Prisma ORM
│   └── src/
│       ├── server.ts                     # Entry point khởi chạy HTTP Server và wire-up middlewares
│       ├── types/                        # Khai báo kiểu dữ liệu mở rộng
│       │   └── express.d.ts              # Mở rộng Express.Request chứa req.user và req.id
│       ├── config/                       # Quản lý cấu hình môi trường
│       │   ├── env-schema.ts             # Zod schema định nghĩa kiểu biến môi trường
│       │   └── env.ts                    # Module parse & validate biến môi trường (Fail-Fast)
│       ├── shared/                       # Thành phần dùng chung toàn backend
│       │   ├── db/
│       │   │   └── prismaClient.ts       # Singleton instance của PrismaClient
│       │   ├── errors/
│       │   │   └── appErrors.ts          # Cây phân cấp Custom Error classes (AppError, ValidationError...)
│       │   ├── middleware/
│       │   │   ├── asyncBoundary.ts      # Async Handler wrapper bắt Promise rejection
│       │   │   ├── authGuard.ts          # Middleware xác thực JWT token (Anti-IDOR)
│       │   │   ├── errorHandler.ts       # Centralized Error Handling Middleware
│       │   │   └── rateLimit.ts          # Rate limiters cho login và API
│       │   └── utils/
│       │       └── logger.ts             # Cấu hình Pino Structured Logger kèm Redaction
│       └── modules/                      # Các Bounded Contexts theo Domain-Driven Design
│           ├── health/                   # Phân hệ Giám sát Sức khỏe Hệ thống (Probes)
│           │   ├── health.routes.ts      # Endpoints /health, /health/live, /health/ready
│           │   └── index.ts              # Public API của module health
│           └── notes/                    # Phân hệ Quản lý Ghi chú (Module mẫu)
│               ├── notes.types.ts        # TypeScript interfaces cho DTOs, Filters, Entity
│               ├── notes.schemas.ts      # Zod validation schema (Ràng buộc ngữ cảnh học tập)
│               ├── notes.repository.ts   # Tầng truy vấn cơ sở dữ liệu qua Prisma
│               ├── notes.service.ts      # Tầng xử lý 100% logic nghiệp vụ
│               ├── notes.controller.ts   # Tầng tiếp nhận HTTP Request & trả Response
│               ├── notes.routes.ts       # Định nghĩa endpoints HTTP cho module notes
│               └── index.ts              # Public API duy nhất của module notes
└── frontend/                             # Mã nguồn Frontend SPA (React 19 + TypeScript + Vite)
    ├── .env                              # Biến môi trường local frontend (VITE_API_BASE_URL)
    ├── .env.example                      # File mẫu biến môi trường frontend
    ├── index.html                        # HTML Template chính của ứng dụng
    ├── package.json                      # Khai báo packages và scripts của frontend
    ├── package-lock.json                 # Khóa phiên bản dependencies frontend
    ├── tsconfig.json                     # Cấu hình TypeScript cho React App
    ├── tsconfig.node.json                # Cấu hình TypeScript cho Vite config
    ├── vite.config.ts                    # Cấu hình Vite Dev Server và build plugins
    └── src/
        ├── main.tsx                      # Entry point React ứng dụng (DOM Root)
        ├── App.tsx                       # Component gốc gắn AppRouter
        ├── vite-env.d.ts                 # Declaration types cho Vite client env
        ├── assets/                       # Tài nguyên tĩnh và Stylesheets
        │   └── styles/
        │       └── global.css            # Stylesheets toàn cục (Layout, CSS Variables)
        ├── services/                     # Tầng giao tiếp HTTP API
        │   └── api.ts                    # Wrapper HTTP Client
        ├── router/                       # Định tuyến ứng dụng
        │   └── index.tsx                 # Cấu hình Client-side Routing (React Router DOM)
        ├── components/                   # UI Components dùng chung
        │   └── layout/                   # Bố cục giao diện chung
        │       ├── AppLayout.tsx         # Bố cục chính chứa Sidebar và Outlet
        │       ├── Sidebar.tsx           # Thanh điều hướng bên trái (Icon, Links, Active state)
        │       └── Topbar.tsx            # Thanh header trên cùng hiển thị context học kỳ
        └── features/                     # Các module tính năng theo Domain (Feature-based)
            ├── notes/                    # Phân hệ Ghi chú
            │   ├── components/
            │   │   └── NoteItem.tsx      # Component hiển thị thẻ ghi chú tóm tắt
            │   ├── hooks/
            │   │   └── useNotes.ts       # Custom Hook gọi API lấy danh sách ghi chú
            │   ├── pages/
            │   │   └── NotesListPage.tsx # Màn hình danh sách ghi chú bài giảng
            │   └── index.ts              # Export public API của feature notes
            ├── tasks/                    # Phân hệ Công việc & Deadline
            │   ├── pages/
            │   │   └── TasksListPage.tsx # Màn hình quản lý công việc và bài tập
            │   └── index.ts              # Export public API của feature tasks
            ├── schedule/                 # Phân hệ Lịch trình & Lịch thi
            │   ├── pages/
            │   │   └── ScheduleWeekPage.tsx # Màn hình lịch học và lịch thi theo tuần
            │   └── index.ts              # Export public API của feature schedule
            ├── semesters/                # Phân hệ Học kỳ & Môn học
            │   ├── pages/
            │   │   └── SemesterOverviewPage.tsx # Màn hình tổng quan học kỳ
            │   └── index.ts              # Export public API của feature semesters
            └── status/                   # Phân hệ Giám sát Trạng thái Hệ thống
                ├── pages/
                │   └── StatusPage.tsx    # Màn hình theo dõi Liveness/Readiness
                └── index.ts              # Export public API của feature status
```

---

## 3. DANH MỤC CHI TIẾT TỪNG FILE & CHỨC NĂNG (FILE DICTIONARY)

### 3.1. Thư mục Gốc (Root Level)

| Đường dẫn tệp | Chức năng chi tiết |
| :--- | :--- |
| [/.gitignore](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/.gitignore) | Khai báo danh sách các file/folder không đưa lên Git (`.env`, `node_modules/`, `dist/`, logs, database volume). |
| [/docker-compose.yml](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/docker-compose.yml) | Khởi chạy container PostgreSQL 16 (`ainote_postgres`) trên cổng `5432` với persistent volume `postgres_data`. |
| [/package.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/package.json) | Root package manifest chứa scripts điều phối toàn dự án (`dev`, `build`, `type-check`). |
| [/README.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/README.md) | Tài liệu tổng quan, kiến trúc, yêu cầu môi trường và hướng dẫn khởi chạy nhanh dự án. |
| [/RULES.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/RULES.md) | Bản quy tắc và luật phát triển bắt buộc áp dụng xuyên suốt mọi phiên làm việc cho AI Agent và lập trình viên. |

---

### 3.2. Thư mục Tài liệu (`DOCS/`)

| Đường dẫn tệp | Chức năng chi tiết |
| :--- | :--- |
| [DOCS/step_1.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_1.md) | Đặc tả định nghĩa sản phẩm, tầm nhìn, 2 Personas sinh viên, use cases, phạm vi MVP non-AI và lộ trình AI (v1 $\rightarrow$ v4). |
| [DOCS/step_2.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_2.md) | Thiết kế mô hình dữ liệu quan hệ, ERD, 8 Enums, DDL 10+ bảng, ràng buộc CHECK chống note rác, B-Tree & GIN Indexes. |
| [DOCS/step_3.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3.md) | Thiết kế kiến trúc hệ thống tổng thể (Modular Monolith), phân rã 10 Bounded Contexts, quy chuẩn config, logger, error, security. |
| [DOCS/step_3_setup.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_setup.md) | Tài liệu kỹ thuật chi tiết của Bước nhỏ 3.3 (Setup backend skeleton từ số 0). |
| [DOCS/step_3_frontend.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_frontend.md) | Tài liệu kỹ thuật chi tiết của Bước nhỏ 3.4 (Setup Frontend SPA Vite + React + React Router). |
| [DOCS/step_3_repo_structure.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_repo_structure.md) | Tài liệu kỹ thuật chi tiết của Bước nhỏ 3.5 (Cấu trúc Repo & Tổ chức mã nguồn toàn project). |
| [DOCS/step_3_observability_security.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_observability_security.md) | Tài liệu kỹ thuật chi tiết của Bước nhỏ 3.6 (Observability, AppError hierarchy, asyncBoundary, Pino redaction, security pipeline). |
| [DOCS/step_3_architecture.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_architecture.md) | Tài liệu kỹ thuật tổng hợp toàn diện Bước 3 lớn (Kiến trúc hệ thống, 10 modules, stacks, repo, security, health probes). |
| [DOCS/step_3_setup_checklist.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_setup_checklist.md) | Bảng theo dõi tiến độ nghiệm thu kỹ thuật từng tác vụ của Bước 3 (`28 / 28` tác vụ hoàn thành - 100%). |
| [DOCS/step_3_integration_checklist.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_integration_checklist.md) | Bảng theo dõi và nhật ký kiểm thử kết nối mạng, CORS và data flow giữa Frontend SPA và Backend API (`7 / 7` đạt). |
| [DOCS/step_3.5_checklist.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3.5_checklist.md) | Bảng theo dõi tiến độ thực thi cấu trúc repo và thư viện dùng chung Bước 3.5 (`6 / 6` hoàn thành). |
| [DOCS/step_3.6_checklist.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3.6_checklist.md) | Bảng theo dõi tiến độ thực thi quan sát hệ thống & cứng hóa bảo mật Bước 3.6 (`10 / 10` hoàn thành). |
| [DOCS/step_3.7_checklist.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3.7_checklist.md) | Bảng theo dõi tiến độ đóng gói & chuẩn hóa toàn bộ Bước 3 (`8 / 8` hoàn thành). |
| [DOCS/COMMANDS_PLAYBOOK.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/COMMANDS_PLAYBOOK.md) | Sổ tay tập trung toàn bộ câu lệnh CLI: Khởi chạy, Docker, Prisma, Build, Test, Git và Clean dự án. |
| [DOCS/PROJECT_STRUCTURE_AND_MAP.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/PROJECT_STRUCTURE_AND_MAP.md) | Tài liệu tra cứu cấu trúc dự án, từ điển tệp tin và công nghệ sử dụng (File này). |

---

### 3.3. Thư mục Tri thức Chat AI (`DOCS/ai_chat_docs/`)

| Đường dẫn tệp | Chức năng chi tiết |
| :--- | :--- |
| [DOCS/ai_chat_docs/README.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/README.md) | Bản đồ tri thức và nguyên tắc mở rộng bất biến (Append-Only) cho AI Agent. |
| [DOCS/ai_chat_docs/01_PROJECT_ACHIEVEMENTS.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/01_PROJECT_ACHIEVEMENTS.md) | Tổng kết toàn bộ các thành tựu, quyết định kiến trúc và kết quả kỹ thuật đã hoàn thành 100%. |
| [DOCS/ai_chat_docs/02_PENDING_TASKS_AND_ROADMAP.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/02_PENDING_TASKS_AND_ROADMAP.md) | Danh mục chi tiết các công việc cần làm tiếp theo từ Bước 3.7 đến Bước 8. |
| [DOCS/ai_chat_docs/03_DEVELOPMENT_WORKFLOW_AND_PROCESS.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/03_DEVELOPMENT_WORKFLOW_AND_PROCESS.md) | Quy trình chuẩn mực Checklist-First, DDD Layering, Error Handling, Logging, Git. |
| [DOCS/ai_chat_docs/04_RESEARCH_GUARDRAILS_AND_LAWS.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/04_RESEARCH_GUARDRAILS_AND_LAWS.md) | Ranh giới kỹ thuật bất biến (Anti-Junk notes, Single ACID DB, Anti-IDOR, Modular Monolith). |
| [DOCS/ai_chat_docs/05_AI_ROADMAP_AND_FUTURE_STRATEGY.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/05_AI_ROADMAP_AND_FUTURE_STRATEGY.md) | Lộ trình và chiến lược AI 4 giai đoạn (Smart Extraction $\rightarrow$ Exam Predictor $\rightarrow$ Multi-modal $\rightarrow$ Autonomous). |
| [DOCS/ai_chat_docs/06_STEP_3_HANDOVER_AND_COMPLETION.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/06_STEP_3_HANDOVER_AND_COMPLETION.md) | Biên bản nghiệm thu toàn diện Bước 3 và danh mục hành động sẵn sàng bước sang Bước 4. |

---

### 3.4. Thư mục Thư viện Dùng chung (`packages/shared/`)

| Đường dẫn tệp | Chức năng chi tiết |
| :--- | :--- |
| [packages/shared/package.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/package.json) | Khai báo package `@snote/shared` xuất bản các kiểu dữ liệu và contracts dùng chung. |
| [packages/shared/tsconfig.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/tsconfig.json) | Cấu hình TypeScript xuất file định nghĩa `.d.ts` vào thư mục `dist/`. |
| [packages/shared/src/enums.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/enums.ts) | Định nghĩa các Enums chuẩn: `NoteType`, `TaskStatus`, `TaskPriority`, `SemesterStatus`, `ScheduleEventType`. |
| [packages/shared/src/contracts/notes.contract.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/contracts/notes.contract.ts) | Định nghĩa interfaces `CreateNoteDto`, `UpdateNoteDto`, `NoteResponseDto`. |
| [packages/shared/src/contracts/tasks.contract.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/contracts/tasks.contract.ts) | Định nghĩa interfaces `CreateTaskDto`, `UpdateTaskDto`, `TaskResponseDto`. |
| [packages/shared/src/contracts/api.contract.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/contracts/api.contract.ts) | Định nghĩa wrapper `ApiResponse<T>` và `PaginationQuery`. |
| [packages/shared/src/index.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/index.ts) | Export Public API duy nhất cho `@snote/shared`. |

---

### 3.5. Thư mục Backend (`backend/`)

| Đường dẫn tệp | Chức năng chi tiết |
| :--- | :--- |
| [backend/package.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/package.json) | Khai báo dependencies (Express, Prisma, Zod, Pino, Helmet, jsonwebtoken...) và scripts thực thi. |
| [backend/tsconfig.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/tsconfig.json) | Thiết lập TypeScript Strict Mode, target `ES2022`, module `CommonJS`, rootDir `./src`, outDir `./dist`. |
| [backend/prisma.config.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/prisma.config.ts) | Cấu hình datasource URL từ biến môi trường cho Prisma CLI v7. |
| [backend/prisma/schema.prisma](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/prisma/schema.prisma) | Schema Prisma định nghĩa generator client và các models (User model skeleton). |
| [backend/.env.example](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/.env.example) | Mẫu biến môi trường bắt buộc: `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`. |
| [backend/.env](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/.env) | Cấu hình môi trường thực tế đang chạy trên máy dev (Chỉ lưu local). |
| [backend/src/server.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/server.ts) | Entry point chính của backend: Cấu hình Express, Helmet, CORS, Correlation Request ID, router `/api/notes`, `errorHandler`. |
| [backend/src/types/express.d.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/types/express.d.ts) | Định nghĩa TypeScript declaration mở rộng `Express.Request` chứa thông tin `req.user` và `req.id`. |
| [backend/src/config/env-schema.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/config/env-schema.ts) | Định nghĩa schema Zod để kiểm tra chặt chẽ kiểu dữ liệu của biến môi trường. |
| [backend/src/config/env.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/config/env.ts) | Thực thi parse `process.env`. Nếu thiếu hoặc sai cấu hình, dừng server ngay lập tức (**Fail-Fast**). |
| [backend/src/shared/db/prismaClient.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/db/prismaClient.ts) | Khởi tạo Singleton instance `prisma` dùng chung trong toàn bộ hệ thống. |
| [backend/src/shared/utils/logger.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/utils/logger.ts) | Cấu hình Pino Structured Logger kèm tính năng `redact` che giấu tokens và passwords. |
| [backend/src/shared/errors/appErrors.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/errors/appErrors.ts) | Cây phân cấp Custom Errors (`AppError`, `ValidationError`, `AuthError`, `ForbiddenError`, `NotFoundError`, `ConflictError`). |
| [backend/src/shared/middleware/asyncBoundary.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/middleware/asyncBoundary.ts) | Middleware wrapper bọc các route handler bất đồng bộ, tự động chuyển lỗi qua `next(err)`. |
| [backend/src/shared/middleware/authGuard.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/middleware/authGuard.ts) | Middleware xác thực JWT token và gán `req.user` bảo vệ chống tấn công IDOR. |
| [backend/src/shared/middleware/rateLimit.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/middleware/rateLimit.ts) | Cấu hình Rate Limiters (`loginRateLimiter` 10 req/15m, `apiRateLimiter` 100 req/1m). |
| [backend/src/shared/middleware/errorHandler.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/middleware/errorHandler.ts) | Middleware bắt lỗi tập trung: Map lỗi sang mã HTTP chuẩn, log requestId nội bộ, không leak stack trace ra ngoài. |
| [backend/src/modules/notes/notes.types.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/notes/notes.types.ts) | Định nghĩa TypeScript interfaces: `CreateNoteDto`, `UpdateNoteDto`, `NoteFilter`, `INotesService`. |
| [backend/src/modules/notes/notes.schemas.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/notes/notes.schemas.ts) | Schema Zod validate dữ liệu tạo note (Enforce ràng buộc `subjectId || projectId`). |
| [backend/src/modules/notes/notes.repository.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/notes/notes.repository.ts) | Layer tương tác trực tiếp với cơ sở dữ liệu qua Prisma Client. |
| [backend/src/modules/notes/notes.service.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/notes/notes.service.ts) | Layer xử lý logic nghiệp vụ ghi chú, phân quyền sở hữu theo `userId`. |
| [backend/src/modules/notes/notes.controller.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/notes/notes.controller.ts) | Controller bóc tách params/body, gọi `NotesService` và trả JSON response chuẩn. |
| [backend/src/modules/notes/notes.routes.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/notes/notes.routes.ts) | Định nghĩa các endpoints: `GET /` (list) và `POST /` (create). |
| [backend/src/modules/notes/index.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/notes/index.ts) | Export Public API duy nhất của module notes để các module khác giao tiếp. |

---

### 3.6. Thư mục Frontend (`frontend/`)

| Đường dẫn tệp | Chức năng chi tiết |
| :--- | :--- |
| [frontend/package.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/package.json) | Khai báo dependencies frontend (React 19, React Router DOM, Vite, TypeScript) và build scripts. |
| [frontend/tsconfig.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/tsconfig.json) | Cấu hình TypeScript cho ứng dụng React Client. |
| [frontend/tsconfig.node.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/tsconfig.node.json) | Cấu hình TypeScript cho file cấu hình Vite server. |
| [frontend/vite.config.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/vite.config.ts) | Cấu hình plugin React cho Vite, thiết lập dev server chạy cổng `5173`. |
| [frontend/index.html](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/index.html) | File HTML gốc chứa thẻ `<div id="root">` và nhúng `/src/main.tsx`. |
| [frontend/.env.example](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/.env.example) | Mẫu biến môi trường client (`VITE_API_BASE_URL=http://localhost:4000/api`). |
| [frontend/.env](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/.env) | File biến môi trường thực tế của frontend local. |
| [frontend/src/vite-env.d.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/vite-env.d.ts) | Định nghĩa TypeScript reference types cho client Vite (`import.meta.env`). |
| [frontend/src/assets/styles/global.css](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/assets/styles/global.css) | Toàn bộ CSS toàn cục: CSS variables màu sắc, reset style, typography, sidebar, topbar, cards, buttons. |
| [frontend/src/services/api.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/services/api.ts) | Wrapper HTTP API Client đóng gói fetch, tự động ghép Base URL và xử lý lỗi phản hồi. |
| [frontend/src/components/layout/Sidebar.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/components/layout/Sidebar.tsx) | Thanh điều hướng trái chứa Logo và các NavLinks (`/notes`, `/tasks`, `/schedule`, `/semesters`). |
| [frontend/src/components/layout/Topbar.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/components/layout/Topbar.tsx) | Thanh header phía trên hiển thị học kỳ đang chọn và tên sinh viên. |
| [frontend/src/components/layout/AppLayout.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/components/layout/AppLayout.tsx) | Khung bố cục chính (Master Layout) lồng Sidebar, Topbar và React Router `<Outlet />`. |
| [frontend/src/features/notes/hooks/useNotes.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/notes/hooks/useNotes.ts) | Custom Hook quản lý state `notes`, `loading`, `error` và gọi API `GET /api/notes`. |
| [frontend/src/features/notes/components/NoteItem.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/notes/components/NoteItem.tsx) | Component hiển thị thẻ ghi chú tóm tắt (Tiêu đề, loại note, tóm tắt nội dung, tag badges). |
| [frontend/src/features/notes/pages/NotesListPage.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/notes/pages/NotesListPage.tsx) | Trang danh sách ghi chú bài giảng, trạng thái trống (Empty State) và nút thêm mới. |
| [frontend/src/features/notes/index.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/notes/index.ts) | Export Public API cho feature notes. |
| [frontend/src/features/tasks/pages/TasksListPage.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/tasks/pages/TasksListPage.tsx) | Trang quản lý danh sách công việc học tập và hạn nộp bài tập. |
| [frontend/src/features/tasks/index.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/tasks/index.ts) | Export Public API cho feature tasks. |
| [frontend/src/features/schedule/pages/ScheduleWeekPage.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/schedule/pages/ScheduleWeekPage.tsx) | Trang hiển thị thời khóa biểu tuần, lịch thi và các mốc deadline. |
| [frontend/src/features/schedule/index.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/schedule/index.ts) | Export Public API cho feature schedule. |
| [frontend/src/features/semesters/pages/SemesterOverviewPage.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/semesters/pages/SemesterOverviewPage.tsx) | Trang tổng quan quản lý học kỳ và danh sách môn học (trục dữ liệu chính). |
| [frontend/src/features/semesters/index.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/semesters/index.ts) | Export Public API cho feature semesters. |
| [frontend/src/router/index.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/router/index.tsx) | Cấu hình React Router DOM điều hướng các trang bên trong `AppLayout`. |
| [frontend/src/App.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/App.tsx) | Component App chính trả về `AppRouter`. |
| [frontend/src/main.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/main.tsx) | Điểm khởi đầu của ứng dụng React, gắn vào thẻ `#root` trong DOM. |

---

## 4. QUY TRÌNH BẢO TRÌ VÀ CẬP NHẬT TÀI LIỆU
Mỗi khi phát triển tính năng mới (ví dụ sang Bước 4 thêm migrations hoặc auth controller):
1. **Thêm file mới** $\rightarrow$ Thêm dòng mới vào bảng tương ứng trong tài liệu này kèm mô tả chức năng.
2. **Sửa đổi công nghệ** $\rightarrow$ Cập nhật bảng Tech Stack Catalog ở Mục 1.
3. **Cập nhật cây thư mục** $\rightarrow$ Đồng bộ cây thư mục ở Mục 2.
