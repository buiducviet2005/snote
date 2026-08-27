# TỪ ĐIỂN CẤU TRÚC, BẢN ĐỒ MÃ NGUỒN VÀ MA TRẬN CÔNG NGHỆ DỰ ÁN (SNOTE)

Tài liệu này đóng vai trò là **Nguồn Chân lý Duy nhất (Single Source of Truth)** về toàn bộ ma trận công nghệ sử dụng, vai trò, chức năng, vị trí áp dụng và từ điển chi tiết từng tệp tin trong hệ thống **SNOTE**.

> 🔴 **QUY TẮC BẮT BUỘC THEO ĐIỀU 4 (MANDATORY RULE - ĐIỀU 4 [RULES.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/RULES.md)):**  
> Mỗi khi thêm mới, sửa đổi hoặc xóa bất kỳ file, folder, thư viện công nghệ hay chức năng nào trong dự án, **bắt buộc phải cập nhật ngay lập tức** vào tài liệu này để đảm bảo việc tra cứu cấu trúc, công nghệ và vị trí luôn chính xác 100% qua mọi phiên làm việc.

---

## 1. MA TRẬN CÔNG NGHỆ SỬ DỤNG & VỊ TRÍ ÁP DỤNG (TECH STACK MATRIX)

### 1.1. Tầng Runtime & Ngôn ngữ Lập trình (Runtime & Language Layer)

| Công nghệ | Phiên bản | Vị trí áp dụng | Nhiệm vụ cốt lõi | Chức năng chi tiết | Lý do lựa chọn & Lợi ích |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Node.js** | `v24.15.0 LTS` | Toàn bộ hệ thống (Backend, Build Tools, Scripts) | Môi trường thực thi JavaScript/TypeScript server-side | Cung cấp V8 runtime, async I/O engine, quản lý tiến trình HTTP server và thực thi các build scripts. | Bản LTS hiện đại, hiệu năng I/O vượt trội, hỗ trợ native ESM và fetch API chuẩn. |
| **TypeScript** | `^5.7.3` | `backend/`, `frontend/`, `packages/shared/` | Trình biên dịch & hệ thống kiểu dữ liệu tĩnh | Cung cấp Static Typing, Strict Mode, Interface/Type declarations, Generics, loại bỏ hoàn toàn lỗi runtime type. | Type-safety tuyệt đối, đồng bộ hợp đồng dữ liệu giữa Backend và Frontend, tự động phát hiện lỗi khi compile. |

---

### 1.2. Tầng Backend Web Framework, Routing & Bảo mật HTTP

| Thư viện / Package | Phiên bản | Vị trí áp dụng | Nhiệm vụ cốt lõi | Chức năng chi tiết | Lý do lựa chọn & Lợi ích |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Express.js** | `^5.2.1` | `backend/src/server.ts`, `backend/src/modules/` | HTTP Web Framework & Routing Engine | Quản lý vòng đời HTTP request/response, middleware pipeline, URL routing cho 8 domain modules. | Phiên bản Express 5 mới nhất, hỗ trợ async handler native, ổn định, cộng đồng middleware phong phú. |
| **Helmet** | `^8.3.0` | `backend/src/server.ts` | Cứng hóa bảo mật HTTP Headers | Tự động thiết lập các HTTP headers an toàn (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, ẩn `X-Powered-By`). | Bảo vệ ứng dụng khỏi các cuộc tấn công phổ biến như Clickjacking, MIME sniffing và XSS. |
| **CORS** | `^2.8.6` | `backend/src/server.ts` | Kiểm soát chia sẻ tài nguyên nguồn gốc chéo | Cấu hình Whitelist Origin (`http://localhost:5173`), cho phép gửi kèm cookie credentials, headers và methods an toàn. | Đảm bảo chỉ có Frontend SPA hợp lệ mới được quyền gọi API backend, hỗ trợ xác thực qua HttpOnly Cookie. |
| **Cookie-Parser** | `^1.4.7` | `backend/src/server.ts`, `backend/src/modules/auth/` | Xử lý & bóc tách Cookie từ HTTP Header | Parse chuỗi `Cookie` header từ request thành object `req.cookies`, phục vụ đọc `snote_refresh_token`. | Cho phép đọc refresh token an toàn từ cookie mà không cần bóc tách chuỗi header thủ công. |
| **Express-Rate-Limit** | `^8.6.2` | `backend/src/shared/middleware/rateLimit.ts` | Giới hạn tần suất gọi API (Rate Limiting) | Giới hạn 10 req/15 phút cho auth (`loginRateLimiter`) và 100 req/phút cho toàn bộ API (`apiRateLimiter`). | Chống tấn công Brute-force mật khẩu và ngăn chặn spam request gây cạn kiệt tài nguyên server. |

---

### 1.3. Tầng Cơ sở Dữ liệu & ORM (Persistence & Data Access Layer)

| Công nghệ | Phiên bản | Vị trí áp dụng | Nhiệm vụ cốt lõi | Chức năng chi tiết | Lý do lựa chọn & Lợi ích |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **PostgreSQL** | `16-alpine` (Docker) / `18` (Local) | Database Engine (`docker-compose.yml`, cổng 5432) | Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) | Lưu trữ bền vững dữ liệu sinh viên, hỗ trợ ACID Transaction, Foreign Keys, CHECK constraints, JSONB và Full-Text Search. | Đảm bảo tính toàn vẹn dữ liệu học tập, ranh giới 1 transaction duy nhất, hỗ trợ mở rộng Full-Text & Vector Search cho AI sau này. |
| **Prisma ORM** | `^7.10.0` | `backend/prisma/schema.prisma`, `backend/prisma/` | Object-Relational Mapping & Migration Engine | Định nghĩa mô hình dữ liệu khai báo (Declarative Schema), tự động sinh PrismaClient type-safe và quản lý migrations. | Trải nghiệm dev đỉnh cao, tự động sinh type TypeScript 100% khớp với DB schema, ngăn chặn SQL Injection. |
| **@prisma/adapter-pg** | `^7.10.0` | `backend/src/shared/db/prismaClient.ts` | Driver Adapter kết nối PostgreSQL cho Prisma 7 | Cung cấp cầu nối driver giữa Prisma v7 Client và connection pool của `pg` (node-postgres). | Tận dụng Connection Pooling tối ưu của `pg`, tương thích hoàn hảo với kiến trúc Driver Adapter mới của Prisma 7. |
| **pg (node-postgres)** | `^8.19.0` | `backend/src/shared/db/prismaClient.ts` | PostgreSQL Driver & Connection Pool | Quản lý connection pool socket kết nối trực tiếp đến PostgreSQL server. | Thư viện kết nối PostgreSQL nhanh nhất và chuẩn mực nhất trong hệ sinh thái Node.js. |

---

### 1.4. Tầng Bảo mật, Xác thực & Mã hóa (Security & Cryptography Layer)

| Thư viện / Module | Phiên bản | Vị trí áp dụng | Nhiệm vụ cốt lõi | Chức năng chi tiết | Lý do lựa chọn & Lợi ích |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **BcryptJS** | `^3.0.3` | `backend/src/modules/auth/auth.service.ts` | Băm & Kiểm tra Mật khẩu người dùng | Băm mật khẩu một chiều với thuật toán Blowfish cipher kèm Salt round = 12 (`bcrypt.hash`), so khớp mật khẩu (`bcrypt.compare`). | Bảo vệ tuyệt đối mật khẩu người dùng ngay cả khi database bị rò rỉ, chi phí cost 12 cân bằng hoàn hảo giữa bảo mật và CPU. |
| **JsonWebToken (JWT)** | `^9.0.3` | `backend/src/modules/auth/`, `backend/src/shared/middleware/authGuard.ts` | Phát hành & Xác thực Stateless Access Token | Ký số JWT token với `HS256`, thời hạn sống 15 phút, giải mã và xác thực token trong `authGuard` để lấy `userId` (Anti-IDOR). | Xác thực không cần query DB mỗi request, bảo vệ toàn bộ API endpoints, ngăn chặn truy cập trái phép. |
| **Node Crypto (Native)** | Native | `backend/src/modules/auth/`, `backend/src/modules/backup/` | Mã hóa ngẫu nhiên & Sinh Checksum | Sinh chuỗi token ngẫu nhiên an toàn (`crypto.randomBytes`) và tính mã băm SHA-256 (`crypto.createHash('sha256')`) cho file backup và refresh token hash. | Thư viện mã hóa tích hợp sẵn của Node.js, tốc độ xử lý C++ cực nhanh, không phụ thuộc package ngoài. |

---

### 1.5. Tầng Kiểm tra Dữ liệu & Quản lý Cấu hình (Validation & Configuration Layer)

| Thư viện | Phiên bản | Vị trí áp dụng | Nhiệm vụ cốt lõi | Chức năng chi tiết | Lý do lựa chọn & Lợi ích |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Zod** | `^3.23.8` | `backend/src/config/env-schema.ts`, `backend/src/modules/*/` | Schema Validation & Type Inference | Validate biến môi trường khi boot server (**Fail-Fast**), validate DTO đầu vào của tất cả HTTP requests, enforce ràng buộc chống note rác `(subjectId \|\| projectId)`. | Tự động suy diễn TypeScript type từ Schema, thông báo lỗi chi tiết, chặn đứng dữ liệu rác trước khi chạm vào Service layer. |
| **Dotenv** | `^16.4.7` | `backend/src/config/env.ts` | Nạp biến môi trường từ file `.env` | Đọc các biến cấu hình từ file `.env` vào `process.env` khi ứng dụng khởi chạy ở môi trường local development. | Tách biệt cấu hình nhạy cảm khỏi mã nguồn, tuân thủ nguyên tắc Twelve-Factor App. |

---

### 1.6. Tầng Quan sát & Ghi nhật ký (Observability & Logging Layer)

| Thư viện | Phiên bản | Vị trí áp dụng | Nhiệm vụ cốt lõi | Chức năng chi tiết | Lý do lựa chọn & Lợi ích |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Pino** | `^10.3.1` | `backend/src/shared/utils/logger.ts` | Structured JSON Logger siêu tốc | Ghi log dạng JSON có cấu trúc (timestamp, level, context, error object), tự động che giấu (`redact`) các trường nhạy cảm như `password`, `token`, `authorization`. | Tốc độ ghi log nhanh nhất hệ sinh thái Node.js (cực ít overhead), định dạng JSON sẵn sàng cho các hệ thống giám sát tập trung (ELK, Datadog). |
| **Pino-HTTP** | `^10.5.0` | `backend/src/server.ts` | HTTP Request/Response Logging Middleware | Tự động sinh `x-request-id` duy nhất cho mỗi request, đo lường thời gian phản hồi (response time), log HTTP method, path, status code. | Truy vết luồng xử lý (Distributed Tracing), dễ dàng debug lỗi thông qua `requestId`. |
| **Pino-Pretty** | `^13.1.3` | Dev Dependency (`backend/`) | Định dạng log màu sắc trên môi trường Dev | Format log JSON thô thành dạng dòng chữ màu sắc, thân thiện với mắt lập trình viên khi chạy terminal cục bộ. | Tăng trải nghiệm đọc log khi phát triển phần mềm trên máy local. |

---

### 1.7. Tầng Thư viện Dùng chung (Shared Contracts & Types Layer)

| Package | Phiên bản | Vị trí áp dụng | Nhiệm vụ cốt lõi | Chức năng chi tiết | Lý do lựa chọn & Lợi ích |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **@snote/shared** | `1.0.0` (Local) | `packages/shared/`, được import bởi `backend/` và `frontend/` | Kho chứa hợp đồng dữ liệu, DTOs & Enums dùng chung | Xuất bản 8 Enums chuẩn (`UserStatus`, `SemesterStatus`, `SubjectStatus`, `ProjectStatus`, `NoteType`, `TaskStatus`, `TaskPriority`, `ScheduleEventType`) và toàn bộ request/response interfaces cho 8 domain modules. | Loại bỏ 100% sự bất đồng bộ giữa Backend và Frontend, thay đổi hợp đồng tại một nơi duy nhất. |

---

### 1.8. Tầng Giao diện Người dùng (Frontend Client SPA Layer)

| Công nghệ / Thư viện | Phiên bản | Vị trí áp dụng | Nhiệm vụ cốt lõi | Chức năng chi tiết | Lý do lựa chọn & Lợi ích |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **React** | `^19.0.0` | `frontend/src/` | Thư viện xây dựng giao diện người dùng (UI Library) | Xây dựng Single Page Application (SPA) dạng Component-based, quản lý state và render UI theo luồng dữ liệu một chiều. | Phiên bản React 19 mới nhất, hiệu năng render tối ưu, hỗ trợ Hooks hiện đại. |
| **Vite** | `^6.2.0` | `frontend/vite.config.ts`, `frontend/` | Frontend Tooling, Dev Server & Bundler | Khởi động Dev server tức thì với Native ESM Hot Module Replacement (HMR), đóng gói mã nguồn production tối ưu qua Rollup manualChunks. | Tốc độ khởi động và reload nhanh gấp hàng chục lần so với Webpack truyền thống. |
| **React Router DOM** | `^7.2.0` | `frontend/src/router/`, `frontend/src/App.tsx` | Điều hướng Client-Side Routing | Quản lý chuyển trang mượt mà không reload trình duyệt (`/notes`, `/tasks`, `/schedule`, `/semesters`, `/status`), lồng ghép Master Layout (`<Outlet />`). | Chuẩn mực điều hướng hàng đầu cho React SPA, hỗ trợ nested routes và layouts sạch sẽ. |
| **Lucide React** | `^1.16.0` | `frontend/src/` | Hệ thống Biểu tượng Vector (Iconography) | Cung cấp hơn 1000+ biểu tượng vector đồng nhất, sắc nét, hỗ trợ chỉnh kích thước và màu sắc linh hoạt. | Thay thế hoàn toàn emojis thô sơ, mang lại diện mạo học thuật chuẩn mực, chuyên nghiệp. |
| **React Markdown & Remark GFM** | `^10.1.0` / `^4.0.1` | `frontend/src/components/common/MarkdownViewer.tsx`, `frontend/src/features/notes/` | Trình hiển thị Markdown GitHub-Flavored | Biên dịch và hiển thị Markdown phong phú (tiêu đề, khối code, bảng biểu, danh sách công việc, trích dẫn). | Trải nghiệm ghi chú học tập chuyên sâu cho sinh viên IT và kỹ thuật. |
| **Canvas Confetti** | `^1.9.4` | `frontend/src/features/tasks/pages/TasksListPage.tsx` | Hiệu ứng Ăn mừng Tương tác (Micro-interaction) | Bắn pháo hoa Confetti khi sinh viên kéo hoặc đánh dấu hoàn thành một công việc/bài tập khó trên bảng Kanban. | Tăng động lực học tập và cảm giác thỏa mãn khi hoàn thành nhiệm vụ. |
| **Native CSS3 Variables**| Native | `frontend/src/assets/styles/global.css` | Hệ thống phong cách & Design Tokens | Định nghĩa biến màu sắc CSS (`--bg-primary`, `--accent-primary`), Dark/Light mode, Typography, Glassmorphism, Badges, Buttons. | Nhẹ, không cần runtime CSS-in-JS, không phụ thuộc thư viện UI cồng kềnh, dễ dàng tùy biến Dark/Light theme. |
| **Fetch API Client** | Native | `frontend/src/services/api.ts` | HTTP Client Wrapper | Đóng gói native `fetch`, tự động gắn Base URL, Bearer Auth token, xử lý `ApiResponse<T>` và tải file blob. | Nhẹ, native chuẩn trình duyệt, type-safe với TypeScript DTOs. |

---

### 1.9. Tầng Điều phối, Container & DevOps Tooling

| Công cụ | Phiên bản | Vị trí áp dụng | Nhiệm vụ cốt lõi | Chức năng chi tiết | Lý do lựa chọn & Lợi ích |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Concurrently** | `^9.1.2` | Root `package.json` | Điều phối chạy đa tiến trình đồng thời | Thực thi đồng thời cả Backend API (`port 4000`) và Frontend Vite (`port 5173`) chỉ bằng 1 lệnh duy nhất `npm run dev`. | Đơn giản hóa quy trình khởi động toàn bộ dự án cho lập trình viên. |
| **TSX** | `^4.19.3` | `backend/package.json` | TypeScript Execution Engine cho Node.js | Chạy trực tiếp file TypeScript `.ts` trên Node.js mà không cần build trước qua `tsc`, hỗ trợ hot watch reload. | Tăng tốc độ phát triển backend, không tốn thời gian compile thủ công khi code. |
| **Docker Compose** | `v3.9` | `docker-compose.yml` | Đóng gói & điều phối Container cơ sở dữ liệu | Khởi chạy container PostgreSQL 16 Alpine với volume mount dữ liệu bền vững `postgres_snote_data`. | Đồng nhất môi trường cơ sở dữ liệu trên mọi máy phát triển (Windows, Linux, macOS). |
| **Git & GitHub** | Remote | `.git/`, `.gitignore` | Quản lý phiên bản mã nguồn (VCS) | Lưu vết toàn bộ lịch sử commit, phân nhánh tính năng, đồng bộ mã nguồn với kho lưu trữ `https://github.com/naverisme/snote.git`. | Chuẩn mực lưu trữ và làm việc nhóm an toàn của dự án. |

---

## 2. BẢN ĐỒ CÂY THƯ MỤC TỔNG THỂ DỰ ÁN (DIRECTORY TREE)

```text
SNOTE/
├── .gitignore                                # Khai báo bỏ qua node_modules, .env, dist, logs khỏi Git
├── docker-compose.yml                        # Khởi chạy PostgreSQL 16 Alpine local container
├── package.json                              # Root orchestrator scripts (dev, build, type-check, prisma)
├── package-lock.json                         # Khóa phiên bản toàn bộ dependencies của root và workspaces
├── README.md                                 # Hướng dẫn tổng quan & cài đặt hệ thống SNOTE
├── RULES.md                                  # BẢNG QUY TẮC & LUẬT BẤT BIẾN CỦA DỰ ÁN (Nguồn luật số 1)
├── .agents/                                  # Cấu hình Agent & Workspace Skills
│   └── skills/
│       └── autonomous-task-execution/
│           └── SKILL.md                      # Kỹ năng thực thi tự chủ liên tục 100% không xin phép
├── .gemini/                                  # Cấu hình AI Assistant & Subagents
│   ├── rules/
│   │   └── project_rules.md                  # Bản sao quy tắc dự án phục vụ AI Agent
│   └── skills/
│       └── autonomous-task-execution/
│           └── SKILL.md                      # Bản sao kỹ năng thực thi tự chủ cho Gemini Agent
├── DOCS/                                     # TRUNG TÂM TÀI LIỆU QUY CHUẨN KỸ THUẬT DỰ ÁN
│   ├── RULES.md                              # Bản sao quy tắc dự án trong thư mục docs
│   ├── PROJECT_STRUCTURE_AND_MAP.md          # Tài liệu này: Từ điển cấu trúc, tệp tin & ma trận công nghệ
│   ├── COMMANDS_PLAYBOOK.md                  # Sổ tay toàn bộ câu lệnh điều khiển, vận hành & kiểm tra dự án
│   ├── step_1.md                             # Bước 1: Định nghĩa sản phẩm SNOTE & phạm vi MVP
│   ├── step_2.md                             # Bước 2: Thiết kế mô hình dữ liệu quan hệ, ERD & DDL PostgreSQL
│   ├── step_3.md                             # Bước 3: Thiết kế kiến trúc tổng thể Modular Monolith & 10 Bounded Contexts
│   ├── step_3_setup.md                       # Bước 3.3: Hướng dẫn thiết lập Backend skeleton từ số 0
│   ├── step_3_frontend.md                    # Bước 3.4: Hướng dẫn thiết lập Frontend SPA Feature-based
│   ├── step_3_repo_structure.md              # Bước 3.5: Cấu trúc repo & tổ chức mã nguồn Monorepo
│   ├── step_3_observability_security.md      # Bước 3.6: Chuẩn hóa hệ thống logging, errors & security pipeline
│   ├── step_3_architecture.md                # Bước 3.7: Đặc tả kiến trúc hoàn chỉnh & nghiệm thu Bước 3
│   ├── step_3_setup_checklist.md             # Checklist tổng quan tiến độ Bước 3 (28/28 Hoàn thành - 100%)
│   ├── step_3_integration_checklist.md       # Checklist kiểm tra kết nối Frontend & Backend (7/7 Đạt)
│   ├── step_3.5_checklist.md                 # Checklist thực thi Bước 3.5 (6/6 Hoàn thành)
│   ├── step_3.6_checklist.md                 # Checklist thực thi Bước 3.6 (10/10 Hoàn thành)
│   ├── step_3.7_checklist.md                 # Checklist đóng gói & bàn giao Bước 3 (8/8 Hoàn thành)
│   ├── step_4_plan.md                        # Bước 4: Kế hoạch kỹ thuật chi tiết Backend Core & Migrations
│   ├── step_4_checklist.md                   # Checklist thực thi Bước 4 (10/10 Hoàn thành - 100%)
│   └── ai_chat_docs/                         # KHO TRI THỨC BẤT BIẾN DÀNH CHO CHAT AI (Append-Only)
│       ├── README.md                         # Bản đồ tri thức & nguyên tắc làm việc với AI Docs
│       ├── 01_PROJECT_ACHIEVEMENTS.md        # Tổng kết thành tựu & cột mốc đã hoàn thành 100%
│       ├── 02_PENDING_TASKS_AND_ROADMAP.md   # Danh mục công việc cần làm & lộ trình tiếp theo
│       ├── 03_DEVELOPMENT_WORKFLOW_AND_PROCESS.md # Quy trình phát triển & chuẩn mực kỹ thuật
│       ├── 04_RESEARCH_GUARDRAILS_AND_LAWS.md # Ranh giới nghiên cứu & các luật bất biến
│       ├── 05_AI_ROADMAP_AND_FUTURE_STRATEGY.md # Lộ trình AI & chiến lược tương lai 4 giai đoạn
│       ├── 06_STEP_3_HANDOVER_AND_COMPLETION.md # Biên bản nghiệm thu Bước 3 & bàn giao Bước 4
│       └── 07_STEP_4_EXECUTION_PLAN.md       # Kế hoạch chi tiết & chiến lược kỹ thuật Bước 4
├── packages/                                 # CÁC THƯ VIỆN DÙNG CHUNG (SHARED PACKAGES)
│   └── shared/                               # Thư viện @snote/shared chứa types & contracts
│       ├── package.json                      # Khai báo package @snote/shared v1.0.0
│       ├── tsconfig.json                     # Cấu hình TypeScript xuất dist/ types
│       └── src/
│           ├── enums.ts                      # 8 Enums chuẩn (UserStatus, NoteType, TaskStatus, Priority...)
│           ├── contracts/
│           │   ├── api.contract.ts           # Wrapper ApiResponse<T> & PaginationQuery
│           │   ├── auth.contract.ts          # DTOs Đăng ký, Đăng nhập, Profile
│           │   ├── semesters.contract.ts     # DTOs Học kỳ
│           │   ├── subjects.contract.ts      # DTOs Môn học
│           │   ├── projects.contract.ts      # DTOs Đồ án môn học
│           │   ├── notes.contract.ts         # DTOs Ghi chú bài giảng & thẻ Tags
│           │   ├── tasks.contract.ts         # DTOs Công việc sinh viên
│           │   ├── schedule.contract.ts      # DTOs Lịch trình & Lịch thi
│           │   └── backup.contract.ts        # DTOs Xuất dữ liệu sao lưu JSON
│           └── index.ts                      # Public API xuất bản toàn bộ shared contracts
├── backend/                                  # MÃ NGUỒN BACKEND REST API (Node.js + Express 5 + Prisma)
│   ├── .env                                  # Biến môi trường local (PORT, DB_URL, JWT_SECRET...)
│   ├── .env.example                          # File mẫu cấu hình biến môi trường
│   ├── package.json                          # Dependencies backend (Express, Prisma, Zod, Bcrypt, JWT...)
│   ├── package-lock.json                     # Khóa phiên bản dependencies backend
│   ├── tsconfig.json                         # Cấu hình TypeScript Strict Mode cho backend
│   ├── prisma.config.ts                      # Cấu hình datasource URL cho Prisma CLI v7
│   ├── prisma/
│   │   ├── schema.prisma                     # Định nghĩa 10+ Models & 8 Enums Prisma ORM
│   │   └── seed.ts                           # Script khởi tạo dữ liệu sinh viên mẫu (npm run prisma:seed)
│   └── src/
│       ├── server.ts                         # Entry point khởi động HTTP Server & wire-up 8 domain modules
│       ├── types/
│       │   └── express.d.ts                  # Type declaration mở rộng Express.Request (req.user, req.id)
│       ├── config/
│       │   ├── env-schema.ts                 # Schema Zod validate biến môi trường (Fail-Fast)
│       │   └── env.ts                        # Module parse & export biến môi trường đã validate
│       ├── shared/                           # CÁC THÀNH PHẦN DÙNG CHUNG TOÀN BACKEND
│       │   ├── db/
│       │   │   └── prismaClient.ts           # Singleton instance PrismaClient với PrismaPg adapter
│       │   ├── errors/
│       │   │   └── appErrors.ts              # Cây phân cấp AppError (ValidationError, AuthError, NotFoundError...)
│       │   ├── middleware/
│       │   │   ├── asyncBoundary.ts          # Middleware wrapper bắt Promise Rejection trong async routes
│       │   │   ├── authGuard.ts              # Middleware xác thực JWT Access Token & Anti-IDOR
│       │   │   ├── errorHandler.ts           # Centralized Error Middleware (bắt AppError & ZodError)
│       │   │   └── rateLimit.ts              # Rate Limiter cho Auth và toàn bộ API
│       │   └── utils/
│       │       └── logger.ts                 # Cấu hình Pino Structured Logger kèm Redaction bảo mật
│       └── modules/                          # 8 PHÂN HỆ BOUNDED CONTEXTS THEO CHUẨN DDD
│           ├── health/                       # Phân hệ Giám sát Sức khỏe (/health, /live, /ready)
│           │   ├── health.routes.ts          # Endpoints kiểm tra Liveness & Readiness DB
│           │   └── index.ts                  # Public API của module health
│           ├── auth/                         # Phân hệ Xác thực & Quản lý Phiên sinh viên
│           │   ├── auth.types.ts             # TypeScript types cho DTOs và JWT payload
│           │   ├── auth.schemas.ts           # Zod validation schema cho Register/Login
│           │   ├── auth.repository.ts        # Tầng truy vấn User và RefreshToken trong DB
│           │   ├── auth.service.ts           # Xử lý logic băm mật khẩu bcrypt, phát hành token JWT
│           │   ├── auth.controller.ts        # Tiếp nhận request, thiết lập Cookie httpOnly
│           │   ├── auth.routes.ts            # Định nghĩa endpoints /register, /login, /refresh, /logout, /me
│           │   └── index.ts                  # Public API của module auth
│           ├── semesters/                    # Phân hệ Quản lý Học kỳ
│           │   ├── semesters.types.ts        # TypeScript interfaces cho Semester DTOs
│           │   ├── semesters.schemas.ts      # Zod validation schema cho Học kỳ
│           │   ├── semesters.repository.ts   # Tương tác bảng semesters trong PostgreSQL
│           │   ├── semesters.service.ts      # Logic nghiệp vụ học kỳ & đánh dấu học kỳ hiện tại (isCurrent)
│           │   ├── semesters.controller.ts   # Xử lý HTTP requests cho học kỳ
│           │   ├── semesters.routes.ts       # Định nghĩa endpoints CRUD /api/semesters
│           │   └── index.ts                  # Public API của module semesters
│           ├── subjects/                     # Phân hệ Quản lý Môn học
│           │   ├── subjects.types.ts         # TypeScript interfaces cho Subject DTOs
│           │   ├── subjects.schemas.ts       # Zod validation schema cho Môn học (tín chỉ, mã màu)
│           │   ├── subjects.repository.ts    # Tương tác bảng subjects và relation counters
│           │   ├── subjects.service.ts       # Xử lý logic môn học theo học kỳ của sinh viên
│           │   ├── subjects.controller.ts    # Xử lý HTTP requests cho môn học
│           │   ├── subjects.routes.ts        # Định nghĩa endpoints CRUD /api/subjects
│           │   └── index.ts                  # Public API của module subjects
│           ├── projects/                     # Phân hệ Quản lý Đồ án môn học
│           │   ├── projects.types.ts         # TypeScript interfaces cho Project DTOs
│           │   ├── projects.schemas.ts       # Zod validation schema cho Đồ án (deadline, liên kết môn)
│           │   ├── projects.repository.ts    # Tương tác bảng projects trong PostgreSQL
│           │   ├── projects.service.ts       # Xử lý logic đồ án & kiểm soát quyền sở hữu
│           │   ├── projects.controller.ts    # Xử lý HTTP requests cho đồ án
│           │   ├── projects.routes.ts        # Định nghĩa endpoints CRUD /api/projects
│           │   └── index.ts                  # Public API của module projects
│           ├── notes/                        # Phân hệ Quản lý Ghi chú bài giảng
│           │   ├── notes.types.ts            # TypeScript interfaces cho Note DTOs & NoteFilter
│           │   ├── notes.schemas.ts          # Zod validation schema (Ép buộc ràng buộc chống note rác)
│           │   ├── notes.repository.ts       # Tương tác bảng notes & upsert thẻ tags tự động
│           │   ├── notes.service.ts          # Logic phân loại bài giảng, ghim (pin), lưu trữ (archive)
│           │   ├── notes.controller.ts       # Xử lý HTTP requests cho ghi chú
│           │   ├── notes.routes.ts           # Định nghĩa endpoints CRUD, toggle pin/archive /api/notes
│           │   └── index.ts                  # Public API của module notes
│           ├── tasks/                        # Phân hệ Quản lý Công việc sinh viên
│           │   ├── tasks.types.ts            # TypeScript interfaces cho Task DTOs & TaskFilter
│           │   ├── tasks.schemas.ts          # Zod validation schema (Ép buộc liên kết môn/đồ án)
│           │   ├── tasks.repository.ts       # Tương tác bảng tasks & tags trong PostgreSQL
│           │   ├── tasks.service.ts          # Logic trạng thái Kanban (TODO, IN_PROGRESS, DONE), độ ưu tiên
│           │   ├── tasks.controller.ts       # Xử lý HTTP requests cho công việc
│           │   ├── tasks.routes.ts           # Định nghĩa endpoints CRUD, cập nhật status /api/tasks
│           │   └── index.ts                  # Public API của module tasks
│           ├── schedule/                     # Phân hệ Quản lý Lịch trình & Lịch thi
│           │   ├── schedule.types.ts         # TypeScript interfaces cho ScheduleEvent DTOs
│           │   ├── schedule.schemas.ts       # Zod validation schema cho sự kiện lịch
│           │   ├── schedule.repository.ts    # Tương tác bảng schedule_events trong PostgreSQL
│           │   ├── schedule.service.ts       # Logic truy vấn sự kiện lịch theo khoảng thời gian tuần/tháng
│           │   ├── schedule.controller.ts    # Xử lý HTTP requests cho lịch trình
│           │   ├── schedule.routes.ts        # Định nghĩa endpoints CRUD /api/schedule
│           │   └── index.ts                  # Public API của module schedule
│           └── backup/                       # Phân hệ Xuất/Nhập Dữ liệu Sao lưu
│               ├── backup.types.ts           # TypeScript interfaces cho cấu trúc dữ liệu JSON backup
│               ├── backup.service.ts         # Logic trích xuất toàn bộ dữ liệu tài khoản & tính SHA-256 Checksum
│               ├── backup.controller.ts      # Xử lý HTTP request trả về file JSON đính kèm
│               ├── backup.routes.ts          # Định nghĩa endpoint GET /api/backup/export
│               └── index.ts                  # Public API của module backup
└── frontend/                                 # MÃ NGUỒN FRONTEND SPA (React 19 + TypeScript + Vite)
    ├── .env                                  # Biến môi trường local (VITE_API_BASE_URL)
    ├── .env.example                          # File mẫu cấu hình biến môi trường client
    ├── index.html                            # HTML template gốc của ứng dụng React
    ├── package.json                          # Khai báo dependencies frontend (React, Router, Vite...)
    ├── package-lock.json                     # Khóa phiên bản dependencies frontend
    ├── tsconfig.json                         # Cấu hình TypeScript cho ứng dụng React
    ├── tsconfig.node.json                    # Cấu hình TypeScript cho Vite build config
    ├── vite.config.ts                        # File cấu hình Vite dev server & plugins
    └── src/
        ├── vite-env.d.ts                     # Type declaration cho Vite Client (import.meta.env)
        ├── main.tsx                          # Entry point khởi tạo React DOM gắn vào #root
        ├── App.tsx                           # Root Component cung cấp Router
        ├── assets/
        │   └── styles/
        │       └── global.css                # CSS Design Tokens, biến màu sắc, reset style & layout
        ├── components/                       # CÁC REUSABLE UI COMPONENTS DÙNG CHUNG
        │   ├── common/
        │   │   └── Modal.tsx                 # Reusable Modal Dialog
        │   └── layout/
        │       ├── Sidebar.tsx               # Thanh điều hướng trái chứa 8 menu chính & Profile
        │       ├── Topbar.tsx                # Thanh header trên hiển thị bộ chọn học kỳ & môn học toàn cục
        │       ├── AppLayout.tsx             # Master Layout lồng Sidebar, Topbar và React Router Outlet
        │       └── ProtectedRoute.tsx        # Guard bảo vệ các trang học tập yêu cầu đăng nhập
        ├── contexts/                         # STATE MANAGEMENT QUA REACT CONTEXT
        │   ├── AuthContext.tsx               # Quản lý phiên đăng nhập JWT, user profile, login, register, logout
        │   ├── AppFilterContext.tsx          # Quản lý bộ lọc ngữ cảnh học tập toàn cục (học kỳ, môn học active)
        │   └── ToastContext.tsx              # Quản lý thông báo nổi (Toast notifications)
        ├── services/                         # TẦNG GIAO TIẾP MẠNG & HTTP CLIENT
        │   └── api.ts                        # Wrapper Fetch API Client hỗ trợ Bearer Token, Cookie và Blob download
        ├── router/                           # ĐIỀU HƯỚNG ROUTING CLIENT-SIDE
        │   └── index.tsx                     # Khai báo toàn bộ Client routes (Public + Protected)
        └── features/                         # CÁC TÍNH NĂNG THEO MÔ HÌNH FEATURE-BASED
            ├── auth/                         # Feature Xác thực & Tài khoản
            │   ├── pages/
            │   │   ├── LoginPage.tsx         # Trang đăng nhập tài khoản sinh viên
            │   │   └── RegisterPage.tsx      # Trang đăng ký tài khoản sinh viên mới
            │   └── index.ts                  # Public API của feature auth
            ├── status/                       # Feature Giám sát Trạng thái Hệ thống
            │   ├── pages/
            │   │   └── StatusPage.tsx        # Trang kiểm tra kết nối Backend API & Database Readiness
            │   └── index.ts                  # Public API của feature status
            ├── notes/                        # Feature Quản lý Ghi chú bài giảng
            │   ├── components/
            │   │   ├── NoteCard.tsx          # Card hiển thị ghi chú, badge loại bài, pin, archive
            │   │   └── NoteModal.tsx         # Modal tạo/sửa note có preview markdown
            │   ├── pages/
            │   │   └── NotesListPage.tsx     # Trang danh sách ghi chú bài giảng (tìm kiếm & lọc)
            │   └── index.ts                  # Public API của feature notes
            ├── tasks/                        # Feature Quản lý Công việc & Bài tập
            │   ├── components/
            │   │   ├── TaskCard.tsx          # Card công việc, checkbox đổi status, priority badge
            │   │   └── TaskModal.tsx         # Modal tạo/sửa công việc học tập & deadline
            │   ├── pages/
            │   │   └── TasksListPage.tsx     # Bảng Kanban 3 cột (TODO, IN_PROGRESS, DONE)
            │   └── index.ts                  # Public API của feature tasks
            ├── schedule/                     # Feature Quản lý Thời khóa biểu & Lịch thi
            │   ├── components/
            │   │   └── EventModal.tsx        # Modal thêm sự kiện lịch học / thi / deadline
            │   ├── pages/
            │   │   └── ScheduleWeekPage.tsx  # Thời khóa biểu tuần 7 ngày & chuyển tuần
            │   └── index.ts                  # Public API của feature schedule
            ├── semesters/                    # Feature Quản lý Học kỳ & Môn học
            │   ├── components/
            │   │   ├── SemesterModal.tsx     # Modal tạo học kỳ mới (isCurrent)
            │   │   └── SubjectModal.tsx      # Modal tạo môn học (tín chỉ, giảng viên, màu)
            │   ├── pages/
            │   │   └── SemesterOverviewPage.tsx # Trang tổng quan học kỳ & danh sách môn học
            │   └── index.ts                  # Public API của feature semesters
            ├── projects/                     # Feature Quản lý Đồ án Môn học
            │   ├── components/
            │   │   └── ProjectModal.tsx      # Modal tạo/sửa đồ án môn học
            │   ├── pages/
            │   │   └── ProjectsListPage.tsx  # Trang danh sách đồ án môn học & tiến độ
            │   └── index.ts                  # Public API của feature projects
            ├── progress/                     # Feature Tổng quan Tiến độ Học tập
            │   ├── pages/
            │   │   └── ProgressDashboardPage.tsx # Dashboard thống kê số note, % tasks, tín chỉ
            │   └── index.ts                  # Public API của feature progress
            └── settings/                     # Feature Cài đặt & Sao lưu Dữ liệu
                ├── pages/
                │   └── SettingsPage.tsx      # Hồ sơ sinh viên & 1-click Download JSON Backup
                └── index.ts                  # Public API của feature settings
```

---

## 3. TỪ ĐIỂN TỆP TIN & PHÂN HỆ MÃ NGUỒN CHI TIẾT (FILE DICTIONARY)

### 3.1. Thư mục Gốc & Cấu hình Hệ thống (`/`)

| Đường dẫn tệp | Vai trò & Chức năng chi tiết | Công nghệ sử dụng |
| :--- | :--- | :--- |
| [package.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/package.json) | Điều phối các scripts của Monorepo: `dev` (chạy song song backend + frontend), `build`, `type-check`, `lint`, `prisma:generate`, `clean`. | `npm workspaces`, `concurrently` |
| [docker-compose.yml](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/docker-compose.yml) | Khởi chạy container `snote-postgres` trên cổng 5432, cấu hình user `postgres`, database `snote_db` và volume lưu trữ bền vững. | `Docker`, `PostgreSQL 16 Alpine` |
| [RULES.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/RULES.md) | Bảng quy tắc, chuẩn mực, thẩm quyền tài liệu, quy ước tên SNOTE và checklist-first workflow bắt buộc đọc trước mọi hành động. | `Markdown` |
| [.agents/skills/autonomous-task-execution/SKILL.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/.agents/skills/autonomous-task-execution/SKILL.md) | Kỹ năng AI thực thi tự chủ liên tục 100% không xin phép, tự động lập checklist, build, test, fix lỗi và hoàn tất mục tiêu. | `Antigravity Workspace Skill` |
| [.gemini/skills/autonomous-task-execution/SKILL.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/.gemini/skills/autonomous-task-execution/SKILL.md) | Bản sao kỹ năng thực thi tự chủ cho Gemini Agent trong thư mục cấu hình `.gemini/`. | `Gemini Skill` |
| [README.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/README.md) | Giới thiệu dự án SNOTE, kiến trúc Modular Monolith, yêu cầu môi trường và hướng dẫn chạy dev/build từng bước. | `Markdown` |
| [.gitignore](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/.gitignore) | Khai báo loại bỏ `node_modules/`, `.env`, `dist/`, `coverage/`, logs và dữ liệu database local khỏi Git. | `Git` |

---

### 3.2. Thư mục Tài liệu Kỹ thuật Dự án (`DOCS/`)

| Đường dẫn tệp | Vai trò & Chức năng chi tiết | Phân đoạn lộ trình |
| :--- | :--- | :--- |
| [DOCS/step_1.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_1.md) | Định nghĩa chân dung sinh viên mục tiêu, giải quyết bài toán phân mảnh ghi chú, phạm vi tính năng MVP và định hướng AI. | Bước 1 |
| [DOCS/step_2.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_2.md) | Thiết kế mô hình dữ liệu quan hệ, ERD, 8 Enums, DDL 10+ bảng, ràng buộc CHECK chống note rác, B-Tree & GIN Indexes. | Bước 2 |
| [DOCS/step_3.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3.md) | Thiết kế kiến trúc hệ thống tổng thể (Modular Monolith), phân rã 10 Bounded Contexts, quy chuẩn config, logger, error, security. | Bước 3 |
| [DOCS/step_3_setup.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_setup.md) | Tài liệu kỹ thuật chi tiết của Bước nhỏ 3.3 (Setup backend skeleton từ số 0). | Bước 3.3 |
| [DOCS/step_3_frontend.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_frontend.md) | Tài liệu kỹ thuật chi tiết của Bước nhỏ 3.4 (Setup Frontend SPA Feature-based). | Bước 3.4 |
| [DOCS/step_3_repo_structure.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_repo_structure.md) | Tài liệu kỹ thuật chi tiết của Bước nhỏ 3.5 (Cấu trúc Repo & Monorepo shared packages). | Bước 3.5 |
| [DOCS/step_3_observability_security.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_observability_security.md) | Tài liệu kỹ thuật chi tiết của Bước nhỏ 3.6 (Observability, AppError hierarchy, asyncBoundary, Pino redaction, security). | Bước 3.6 |
| [DOCS/step_3_architecture.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_architecture.md) | Tài liệu kỹ thuật tổng hợp toàn diện Bước 3 lớn (Đặc tả kiến trúc, 10 modules, stacks, repo, security, health probes). | Bước 3.7 |
| [DOCS/step_3_setup_checklist.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_setup_checklist.md) | Bảng theo dõi tiến độ nghiệm thu kỹ thuật từng tác vụ của Bước 3 (`28 / 28` tác vụ hoàn thành - 100%). | Bước 3 Checklist |
| [DOCS/step_3_integration_checklist.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_integration_checklist.md) | Bảng theo dõi kiểm thử kết nối mạng, CORS và data flow giữa Frontend SPA và Backend API (`7 / 7` đạt). | Bước 3 Checklist |
| [DOCS/step_3.5_checklist.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3.5_checklist.md) | Bảng theo dõi tiến độ thực thi cấu trúc repo và thư viện dùng chung Bước 3.5 (`6 / 6` hoàn thành). | Bước 3.5 Checklist |
| [DOCS/step_3.6_checklist.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3.6_checklist.md) | Bảng theo dõi tiến độ thực thi quan sát hệ thống & cứng hóa bảo mật Bước 3.6 (`10 / 10` hoàn thành). | Bước 3.6 Checklist |
| [DOCS/step_3.7_checklist.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3.7_checklist.md) | Bảng theo dõi tiến độ đóng gói & chuẩn hóa toàn bộ Bước 3 (`8 / 8` hoàn thành). | Bước 3.7 Checklist |
| [DOCS/step_4_plan.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_4_plan.md) | Kế hoạch kỹ thuật chi tiết của Bước 4 (Triển khai Backend Core, Prisma schema, Auth, Semesters, Subjects, Projects, Notes, Tasks, Schedule, Backup). | Bước 4 Plan |
| [DOCS/step_4_checklist.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_4_checklist.md) | Bảng theo dõi tiến độ thực thi Bước 4 (`10 / 10` hoàn thành - 100%). | Bước 4 Checklist |
| [DOCS/step_5_plan.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_5_plan.md) | Kế hoạch kỹ thuật chi tiết của Bước 5 (Triển khai Frontend V1 & UX hoàn chỉnh cho sinh viên). | Bước 5 Plan |
| [DOCS/step_5_checklist.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_5_checklist.md) | Bảng theo dõi tiến độ thực thi Bước 5 (`11 / 11` hoàn thành - 100%). | Bước 5 Checklist |
| [DOCS/step_5_frontend_enhancement_checklist.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_5_frontend_enhancement_checklist.md) | Bảng theo dõi tiến độ nâng cấp toàn diện Frontend & UX V2 (`10 / 10` hoàn thành - 100%). | Frontend UX Checklist |
| [DOCS/COMMANDS_PLAYBOOK.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/COMMANDS_PLAYBOOK.md) | Sổ tay tập trung toàn bộ câu lệnh CLI: Khởi chạy, Docker, Prisma, Build, Test PowerShell/cURL, Git và Clean dự án. | Sổ tay Vận hành |
| [DOCS/PROJECT_STRUCTURE_AND_MAP.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/PROJECT_STRUCTURE_AND_MAP.md) | Tài liệu tra cứu cấu trúc dự án, ma trận công nghệ, từ điển tệp tin và vị trí áp dụng (File này). | Bản đồ Dự án |

---

### 3.3. Thư mục Tri thức Chat AI (`DOCS/ai_chat_docs/`)

| Đường dẫn tệp | Vai trò & Chức năng chi tiết | Nguyên tắc quản lý |
| :--- | :--- | :--- |
| [DOCS/ai_chat_docs/README.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/README.md) | Bản đồ tri thức và nguyên tắc mở rộng bất biến (Append-Only) cho AI Agent. | Chỉ mục |
| [DOCS/ai_chat_docs/01_PROJECT_ACHIEVEMENTS.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/01_PROJECT_ACHIEVEMENTS.md) | Tổng kết toàn bộ các thành tựu, quyết định kiến trúc và kết quả kỹ thuật đã hoàn thành 100%. | Bất biến (Append-Only) |
| [DOCS/ai_chat_docs/02_PENDING_TASKS_AND_ROADMAP.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/02_PENDING_TASKS_AND_ROADMAP.md) | Danh mục chi tiết các công việc cần làm tiếp theo từ Bước 4 đến Bước 8. | Bất biến (Append-Only) |
| [DOCS/ai_chat_docs/03_DEVELOPMENT_WORKFLOW_AND_PROCESS.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/03_DEVELOPMENT_WORKFLOW_AND_PROCESS.md) | Quy trình chuẩn mực Checklist-First, DDD Layering, Error Handling, Logging, Git. | Bất biến (Append-Only) |
| [DOCS/ai_chat_docs/04_RESEARCH_GUARDRAILS_AND_LAWS.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/04_RESEARCH_GUARDRAILS_AND_LAWS.md) | Ranh giới kỹ thuật bất biến (Anti-Junk notes, Single ACID DB, Anti-IDOR, Modular Monolith). | Bất biến (Append-Only) |
| [DOCS/ai_chat_docs/05_AI_ROADMAP_AND_FUTURE_STRATEGY.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/05_AI_ROADMAP_AND_FUTURE_STRATEGY.md) | Lộ trình và chiến lược AI 4 giai đoạn (Smart Extraction $\rightarrow$ Exam Predictor $\rightarrow$ Multi-modal $\rightarrow$ Autonomous). | Bất biến (Append-Only) |
| [DOCS/ai_chat_docs/06_STEP_3_HANDOVER_AND_COMPLETION.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/06_STEP_3_HANDOVER_AND_COMPLETION.md) | Biên bản nghiệm thu toàn diện Bước 3 và danh mục hành động bàn giao sang Bước 4. | Bất biến (Append-Only) |
| [DOCS/ai_chat_docs/07_STEP_4_EXECUTION_PLAN.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/07_STEP_4_EXECUTION_PLAN.md) | Kế hoạch chi tiết và chiến lược kỹ thuật triển khai Bước 4 Backend Core & Database. | Bất biến (Append-Only) |
| [DOCS/ai_chat_docs/08_STEP_5_EXECUTION_PLAN.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/08_STEP_5_EXECUTION_PLAN.md) | Kế hoạch chi tiết và chiến lược kỹ thuật triển khai Bước 5 Frontend V1 & UX. | Bất biến (Append-Only) |
| [DOCS/ai_chat_docs/09_FRONTEND_UX_ENHANCEMENT.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/ai_chat_docs/09_FRONTEND_UX_ENHANCEMENT.md) | Đặc tả Design System, chuẩn Typography, Iconography, Theme Tokens và UX Micro-interactions. | Bất biến (Append-Only) |

---

### 3.4. Thư mục Thư viện Dùng chung (`packages/shared/`)

| Đường dẫn tệp | Vai trò & Chức năng chi tiết | Công nghệ sử dụng |
| :--- | :--- | :--- |
| [packages/shared/package.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/package.json) | Khai báo package `@snote/shared` xuất bản types và contracts dùng chung cho cả backend và frontend. | `npm package` |
| [packages/shared/tsconfig.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/tsconfig.json) | Cấu hình TypeScript compiler xuất file định nghĩa `.d.ts` vào thư mục `dist/`. | `TypeScript` |
| [packages/shared/src/enums.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/enums.ts) | Định nghĩa 8 Enums chuẩn: `UserStatus`, `SemesterStatus`, `SubjectStatus`, `ProjectStatus`, `NoteType`, `TaskStatus`, `TaskPriority`, `ScheduleEventType`. | `TypeScript Enums` |
| [packages/shared/src/contracts/api.contract.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/contracts/api.contract.ts) | Định nghĩa wrapper chuẩn `ApiResponse<T>`, `ApiErrorResponse` và `PaginationQuery`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/auth.contract.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/contracts/auth.contract.ts) | Định nghĩa DTOs `RegisterDto`, `LoginDto`, `UserResponseDto`, `AuthResponseDto`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/semesters.contract.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/contracts/semesters.contract.ts) | Định nghĩa DTOs `CreateSemesterDto`, `UpdateSemesterDto`, `SemesterResponseDto`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/subjects.contract.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/contracts/subjects.contract.ts) | Định nghĩa DTOs `CreateSubjectDto`, `UpdateSubjectDto`, `SubjectResponseDto`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/projects.contract.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/contracts/projects.contract.ts) | Định nghĩa DTOs `CreateProjectDto`, `UpdateProjectDto`, `ProjectResponseDto`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/notes.contract.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/contracts/notes.contract.ts) | Định nghĩa interfaces `CreateNoteDto`, `UpdateNoteDto`, `NoteResponseDto`, `TagDto`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/tasks.contract.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/contracts/tasks.contract.ts) | Định nghĩa interfaces `CreateTaskDto`, `UpdateTaskDto`, `TaskResponseDto`, `TaskFilter`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/schedule.contract.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/contracts/schedule.contract.ts) | Định nghĩa DTOs `CreateScheduleEventDto`, `UpdateScheduleEventDto`, `ScheduleEventResponseDto`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/backup.contract.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/contracts/backup.contract.ts) | Định nghĩa interface `UserBackupPayload`. | `TypeScript Interfaces` |
| [packages/shared/src/index.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared/src/index.ts) | Public API duy nhất xuất bản 100% contracts và enums của `@snote/shared`. | `TypeScript Exports` |

---

### 3.5. Mã nguồn Backend API (`backend/`)

| Đường dẫn tệp | Vai trò & Chức năng chi tiết | Công nghệ sử dụng |
| :--- | :--- | :--- |
| [backend/package.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/package.json) | Khai báo dependencies backend (Express, Prisma, Zod, Pino, Helmet, Bcrypt, JWT...) và build scripts. | `npm package` |
| [backend/tsconfig.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/tsconfig.json) | Cấu hình TypeScript Strict Mode, target `ES2022`, module `CommonJS`, rootDir `./src`, outDir `./dist`. | `TypeScript` |
| [backend/prisma.config.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/prisma.config.ts) | Cấu hình datasource URL từ biến môi trường cho Prisma CLI v7. | `Prisma Config` |
| [backend/prisma/schema.prisma](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/prisma/schema.prisma) | Khai báo 10+ Models (`User`, `RefreshToken`, `Semester`, `Subject`, `Project`, `Note`, `Task`, `Tag`, `ScheduleEvent`, `BackupRecord`) và 8 Enums. | `Prisma Schema` |
| [backend/prisma/seed.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/prisma/seed.ts) | Script nạp dữ liệu mẫu sinh viên thực tế (user, 1 học kỳ, 3 môn học, 1 đồ án, 3 tags, 2 notes, 3 tasks, 2 sự kiện lịch). | `TypeScript`, `PrismaClient` |
| [backend/src/server.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/server.ts) | Entry point chính của backend: Cấu hình Helmet, CORS, CookieParser, Pino HTTP, RateLimit, wire-up 8 domain routers và ErrorHandler. | `Express 5`, `Pino`, `Helmet`, `CORS` |
| [backend/src/types/express.d.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/types/express.d.ts) | Định nghĩa TypeScript declaration mở rộng `Express.Request` chứa thông tin `req.user` và `req.id`. | `TypeScript Declaration` |
| [backend/src/config/env-schema.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/config/env-schema.ts) | Định nghĩa schema Zod để kiểm tra chặt chẽ kiểu dữ liệu của biến môi trường (`PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`...). | `Zod` |
| [backend/src/config/env.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/config/env.ts) | Thực thi parse `process.env`. Nếu thiếu hoặc sai cấu hình, dừng server ngay lập tức (**Fail-Fast**). | `Zod`, `dotenv` |
| [backend/src/shared/db/prismaClient.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/db/prismaClient.ts) | Khởi tạo Singleton instance `prisma` kết nối qua `PrismaPg` adapter và pool `pg`. | `PrismaClient`, `@prisma/adapter-pg`, `pg` |
| [backend/src/shared/utils/logger.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/utils/logger.ts) | Cấu hình Pino Structured Logger kèm tính năng `redact` che giấu tokens và passwords. | `Pino` |
| [backend/src/shared/errors/appErrors.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/errors/appErrors.ts) | Cây phân cấp Custom Errors (`AppError`, `ValidationError`, `AuthError`, `ForbiddenError`, `NotFoundError`, `ConflictError`). | `TypeScript Classes` |
| [backend/src/shared/middleware/asyncBoundary.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/middleware/asyncBoundary.ts) | Middleware wrapper bọc các route handler bất đồng bộ, tự động chuyển lỗi qua `next(err)`. | `Express Middleware` |
| [backend/src/shared/middleware/authGuard.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/middleware/authGuard.ts) | Middleware xác thực JWT Bearer Token và gán `req.user` bảo vệ chống tấn công IDOR. | `jsonwebtoken`, `Express` |
| [backend/src/shared/middleware/rateLimit.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/middleware/rateLimit.ts) | Cấu hình Rate Limiters (`loginRateLimiter` 10 req/15m, `apiRateLimiter` 100 req/1m). | `express-rate-limit` |
| [backend/src/shared/middleware/errorHandler.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/middleware/errorHandler.ts) | Middleware bắt lỗi tập trung: Tự động map `ZodError` và `AppError` sang HTTP response chuẩn có mã code và context. | `Express Error Middleware`, `ZodError` |
| [backend/src/modules/health/health.routes.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/health/health.routes.ts) | Endpoints kiểm tra sức khỏe hệ thống: `/health`, `/health/live`, `/health/ready` (query DB). | `Express Router`, `PrismaPg` |
| [backend/src/modules/health/index.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/health/index.ts) | Public API của module health. | `TypeScript Exports` |
| [backend/src/modules/auth/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/auth) | Phân hệ Xác thực: Đăng ký, Đăng nhập, Token Rotation, Cookie httpOnly, Bcrypt cost 12. | `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `Prisma` |
| [backend/src/modules/semesters/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/semesters) | Phân hệ Học kỳ: CRUD học kỳ, đánh dấu học kỳ hiện tại (`isCurrent`), soft delete. | `PrismaClient`, `Zod`, `Express` |
| [backend/src/modules/subjects/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/subjects) | Phân hệ Môn học: CRUD môn học, số tín chỉ, giảng viên, mã màu, relation counters. | `PrismaClient`, `Zod`, `Express` |
| [backend/src/modules/projects/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/projects) | Phân hệ Đồ án môn học: CRUD đồ án, deadline, liên kết môn học, soft delete. | `PrismaClient`, `Zod`, `Express` |
| [backend/src/modules/notes/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/notes) | Phân hệ Ghi chú bài giảng: CRUD, ghim, lưu trữ, tags, chống note rác (`subjectId \|\| projectId`). | `PrismaClient`, `Zod`, `Express` |
| [backend/src/modules/tasks/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/tasks) | Phân hệ Công việc sinh viên: CRUD, trạng thái Kanban, độ ưu tiên, deadline, tags. | `PrismaClient`, `Zod`, `Express` |
| [backend/src/modules/schedule/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/schedule) | Phân hệ Lịch trình & Lịch thi: Quản lý sự kiện lịch theo tuần/tháng, lặp lại sự kiện. | `PrismaClient`, `Zod`, `Express` |
| [backend/src/modules/backup/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/backup) | Phân hệ Sao lưu dữ liệu: Export toàn bộ dữ liệu tài khoản ra JSON kèm SHA-256 checksum. | `Node Crypto`, `PrismaClient`, `Express` |

---

### 3.6. Mã nguồn Frontend SPA (`frontend/`)

| Đường dẫn tệp | Vai trò & Chức năng chi tiết | Công nghệ sử dụng |
| :--- | :--- | :--- |
| [frontend/package.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/package.json) | Khai báo dependencies frontend (React 19, React Router DOM v7, Vite, TypeScript) và build scripts. | `npm package` |
| [frontend/tsconfig.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/tsconfig.json) | Cấu hình TypeScript compiler cho React Client kèm alias `@snote/shared`. | `TypeScript` |
| [frontend/vite.config.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/vite.config.ts) | Cấu hình plugin React cho Vite, resolve alias `@snote/shared` và dev server cổng `5173`. | `Vite`, `@vitejs/plugin-react` |
| [frontend/index.html](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/index.html) | File HTML gốc chứa thẻ `<div id="root">` và nhúng `/src/main.tsx`. | `HTML5` |
| [frontend/src/assets/styles/global.css](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/assets/styles/global.css) | Toàn bộ CSS toàn cục: CSS variables màu sắc, dark theme, reset style, typography, scrollbars, spin animation. | `CSS3 Custom Properties` |
| [frontend/src/services/api.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/services/api.ts) | Wrapper HTTP API Client đóng gói fetch, tự động chèn `Authorization: Bearer <token>`, gửi credentials và hỗ trợ tải blob. | `Fetch API`, `TypeScript` |
| [frontend/src/contexts/ThemeContext.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/contexts/ThemeContext.tsx) | React Context quản lý Dark/Light theme, tự động lưu trữ và đồng bộ với `localStorage`. | `React Context` |
| [frontend/src/contexts/AuthContext.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/contexts/AuthContext.tsx) | React Context quản lý phiên đăng nhập JWT, user profile, đăng ký, đăng xuất, tự phục hồi session. | `React Context` |
| [frontend/src/contexts/AppFilterContext.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/contexts/AppFilterContext.tsx) | React Context quản lý bộ lọc ngữ cảnh toàn cục (Học kỳ active, Môn học active). | `React Context` |
| [frontend/src/contexts/ToastContext.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/contexts/ToastContext.tsx) | React Context hiển thị các thông báo phản hồi thao tác nổi với Lucide Icons (Success / Error / Info). | `React Context`, `Lucide Icons` |
| [frontend/src/components/common/Modal.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/components/common/Modal.tsx) | Modal Dialog tái sử dụng cho các form tạo/sửa dữ liệu kèm animation `scaleIn`. | `React 19`, `Lucide Icons` |
| [frontend/src/components/common/MarkdownViewer.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/components/common/MarkdownViewer.tsx) | Component render Markdown chuẩn GitHub (`react-markdown` + `remark-gfm`) cho bài giảng. | `react-markdown`, `remark-gfm` |
| [frontend/src/components/common/QuickActionModal.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/components/common/QuickActionModal.tsx) | Modal Tạo Nhanh toàn cục (Quick Action) cho phép tạo ngay Note, Task hoặc Lịch học từ bất kỳ đâu. | `React 19`, `Lucide Icons` |
| [frontend/src/components/layout/Sidebar.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/components/layout/Sidebar.tsx) | Thanh điều hướng trái chứa Logo SNOTE, 8 menu tính năng chính, nút đổi theme Dark/Light và user profile. | `React 19`, `react-router-dom`, `Lucide` |
| [frontend/src/components/layout/Topbar.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/components/layout/Topbar.tsx) | Header chứa bộ chọn học kỳ & môn học toàn cục (Context Selector) và nút Tạo Nhanh (+). | `React 19`, `Lucide` |
| [frontend/src/components/layout/AppLayout.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/components/layout/AppLayout.tsx) | Khung bố cục chính (Master Layout) lồng Sidebar, Topbar và React Router `<Outlet />`. | `React 19`, `react-router-dom` |
| [frontend/src/components/layout/ProtectedRoute.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/components/layout/ProtectedRoute.tsx) | Guard kiểm tra xác thực, tự động chuyển hướng về `/login` nếu chưa đăng nhập. | `React 19`, `react-router-dom` |
| [frontend/src/features/auth/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/auth) | Phân hệ Xác thực: `LoginPage.tsx` (ẩn/hiện mật khẩu, demo fill), `RegisterPage.tsx` (đăng ký). | `React 19`, `Lucide` |
| [frontend/src/features/notes/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/notes) | Phân hệ Ghi chú: `NotesListPage.tsx` (chế độ Lưới/Danh sách), `NoteCard.tsx` (ước tính thời gian đọc), `NoteModal.tsx` (thanh công cụ Markdown). | `React 19`, `react-markdown` |
| [frontend/src/features/tasks/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/tasks) | Phân hệ Công việc: `TasksListPage.tsx` (Kanban 3 cột, Confetti celebration), `TaskCard.tsx` (chuyển cột nhanh), `TaskModal.tsx`. | `React 19`, `canvas-confetti` |
| [frontend/src/features/schedule/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/schedule) | Phân hệ Thời khóa biểu: `ScheduleWeekPage.tsx` (lịch tuần 7 ngày, highlight ngày hôm nay), `EventModal.tsx`. | `React 19`, `Lucide` |
| [frontend/src/features/semesters/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/semesters) | Phân hệ Học kỳ & Môn học: `SemesterOverviewPage.tsx`, `SemesterModal.tsx`, `SubjectModal.tsx` (bảng chọn màu). | `React 19`, `Lucide` |
| [frontend/src/features/projects/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/projects) | Phân hệ Đồ án môn học: `ProjectsListPage.tsx`, `ProjectModal.tsx`. | `React 19`, `Lucide` |
| [frontend/src/features/progress/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/progress) | Phân hệ Tiến độ học tập: `ProgressDashboardPage.tsx` (Bento metrics, phân tích % theo môn). | `React 19`, `Lucide` |
| [frontend/src/features/settings/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/settings) | Phân hệ Cài đặt & Sao lưu: `SettingsPage.tsx` (hồ sơ sinh viên, đổi theme, 1-click Download JSON Backup). | `React 19`, `Lucide` |
| [frontend/src/features/status/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/status) | Phân hệ Giám sát sức khỏe: `StatusPage.tsx` (kiểm tra `/health/live` và `/health/ready` real-time). | `React 19`, `Lucide` |
| [frontend/src/router/index.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/router/index.tsx) | Cấu hình React Router DOM điều hướng toàn bộ 8 phân hệ học tập lồng trong `ProtectedRoute` & `AppLayout`. | `react-router-dom` |
| [frontend/src/App.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/App.tsx) | Root Component bọc `ThemeProvider`, `AuthProvider`, `ToastProvider` và `AppFilterProvider`. | `React 19` |
| [frontend/src/main.tsx](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/main.tsx) | Điểm khởi đầu của ứng dụng React, gắn vào thẻ `#root` trong DOM. | `React DOM 19` |

---

## 4. QUY TRÌNH BẢO TRÌ VÀ CẬP NHẬT TÀI LIỆU BẮT BUỘC (THEO ĐIỀU 4)

Mỗi khi phát triển hoặc sửa đổi tính năng trong dự án:
1. **Thêm / Đổi Thư viện hoặc Công nghệ:**
   - Cập nhật ngay vào **Mục 1 (Tech Stack Matrix)**: Ghi rõ Tên, Phiên bản, Vị trí áp dụng, Nhiệm vụ cốt lõi, Chức năng chi tiết và Lý do lựa chọn.
2. **Thêm / Đổi File hoặc Thư mục:**
   - Cập nhật ngay vào **Mục 2 (Directory Tree)**: Bổ sung nhánh cây thư mục tương ứng.
   - Cập nhật ngay vào **Mục 3 (File Dictionary)**: Thêm dòng tra cứu chi tiết gồm Đường dẫn tệp, Vai trò/Chức năng chi tiết và Công nghệ sử dụng trong file đó.
3. **Tuân thủ Tuyệt đối:** Không để xảy ra tình trạng code đã thay đổi nhưng tài liệu bản đồ không được cập nhật.
