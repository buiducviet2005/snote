# TỪ ĐIỂN CẤU TRÚC, BẢN ĐỒ MÃ NGUỒN VÀ MA TRẬN CÔNG NGHỆ DỰ ÁN (SNOTE)

Tài liệu này mô tả công nghệ, cấu trúc mã nguồn và vai trò các thành phần chính của SNOTE. Cập nhật nội dung khi cấu trúc hoặc công nghệ của dự án thay đổi.

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
| **Shared TypeScript source** | Local source | `packages/shared/src/`, resolve trực tiếp bởi frontend | Enums và DTOs dùng chung trong giao diện | Không build thành package riêng; backend hiện dùng types do Prisma sinh. | Giữ một nguồn enum/DTO phía client mà không cần thêm bước cài/build package. |

---

### 1.8. Tầng Giao diện Người dùng (Frontend Client SPA Layer)

| Công nghệ / Thư viện | Phiên bản | Vị trí áp dụng | Nhiệm vụ cốt lõi | Chức năng chi tiết | Lý do lựa chọn & Lợi ích |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **React** | `^19.0.0` | `frontend/src/` | Thư viện xây dựng giao diện người dùng (UI Library) | Xây dựng Single Page Application (SPA) dạng Component-based, quản lý state và render UI theo luồng dữ liệu một chiều. | Phiên bản React 19 mới nhất, hiệu năng render tối ưu, hỗ trợ Hooks hiện đại. |
| **Vite** | `^6.2.0` | `frontend/vite.config.ts`, `frontend/` | Frontend Tooling, Dev Server & Bundler | Khởi động Dev server tức thì với Native ESM Hot Module Replacement (HMR), đóng gói mã nguồn production tối ưu qua Rollup manualChunks. | Tốc độ khởi động và reload nhanh gấp hàng chục lần so với Webpack truyền thống. |
| **React Router DOM** | `^7.2.0` | `frontend/src/router/`, `frontend/src/App.tsx` | Điều hướng Client-Side Routing | Quản lý chuyển trang mượt mà không reload trình duyệt (`/notes`, `/tasks`, `/schedule`, `/semesters`, `/status`), lồng ghép Master Layout (`<Outlet />`). | Chuẩn mực điều hướng hàng đầu cho React SPA, hỗ trợ nested routes và layouts sạch sẽ. |
| **Lucide React** | `^1.16.0` | `frontend/src/` | Hệ thống Biểu tượng Vector (Iconography) | Cung cấp hơn 1000+ biểu tượng vector đồng nhất, sắc nét, hỗ trợ chỉnh kích thước và màu sắc linh hoạt. | Thay thế hoàn toàn emojis thô sơ, mang lại diện mạo học thuật chuẩn mực, chuyên nghiệp. |
| **React Markdown & Remark GFM** | `^10.1.0` / `^4.0.1` | `frontend/src/components/common/MarkdownViewer.tsx`, - `frontend/src/features/notes/components/NoteCard.tsx`: Thẻ hiển thị bài ghi tối ưu hóa diện tích nội dung (Content-First), thanh header 1 dòng tích hợp nhận diện đặc tính đa nhiệm (link, checklist, ảnh, code, file), mở link nhanh 1-click, chuyển đổi Note sang Task, nút Xóa đặt cạnh Ghim và Lưu trữ, loại bỏ viền và nút footer thừa.<br>- `frontend/src/features/notes/pages/NotesListPage.tsx`: Trang quản lý ghi chú bài học trung tâm với 5 chế độ xem (`GRID`, `COMPACT Bento`, `SPLIT`, `KANBAN`, `LIST`), thanh bộ lọc thu gọn (Collapsible Filter), tích hợp tạo Task từ Note. | Trình hiển thị Markdown GitHub-Flavored | Biên dịch và hiển thị Markdown phong phú (tiêu đề, khối code, bảng biểu, danh sách công việc, trích dẫn). | Trải nghiệm ghi chú học tập chuyên sâu cho sinh viên IT và kỹ thuật. |
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
|-- backend/                 # Express API, Prisma schema, migrations
|-- frontend/                # React SPA, feature modules and shared UI
|-- packages/shared/         # Shared TypeScript contracts
|-- DOCS/                    # Product, architecture and developer documentation
|   |-- step_1.md
|   |-- step_2.md
|   |-- step_3*.md
|   |-- COMMANDS_PLAYBOOK.md
|   |-- PROJECT_STRUCTURE_AND_MAP.md
|   `-- TECH_STACK_REVIEW.md
|-- docker-compose.yml       # Local PostgreSQL service
|-- package.json             # Monorepo scripts
|-- README.md                 # Project overview and quick start
|-- SETUP.md                  # Detailed setup guide
|-- AGENTS.md / RULES.md      # Concise project instructions
|-- .agents/skills/ux-ui-pro/ # SNOTE-specific UI guidance
|-- setup.bat / setup.sh      # Setup helpers
`-- .gitignore
```

---

## 3. TỪ ĐIỂN TỆP TIN & PHÂN HỆ MÃ NGUỒN CHI TIẾT (FILE DICTIONARY)

### 3.1. Thư mục Gốc & Cấu hình Hệ thống (`/`)

| Đường dẫn tệp | Vai trò & Chức năng chi tiết | Công nghệ sử dụng |
| :--- | :--- | :--- |
| [package.json](../package.json) | Điều phối các scripts của Monorepo: `dev` (chạy song song backend + frontend), `build`, `type-check`, `lint`, `prisma:generate`, `clean`. | `npm workspaces`, `concurrently` |
| [docker-compose.yml](../docker-compose.yml) | Khởi chạy container `snote-postgres` trên cổng 5432, cấu hình user `postgres`, database `snote_db` và volume lưu trữ bền vững. | `Docker`, `PostgreSQL 16 Alpine` |
| [README.md](../README.md) | Giới thiệu dự án SNOTE, kiến trúc Modular Monolith, yêu cầu môi trường và hướng dẫn chạy dev/build từng bước. | `Markdown` |
| [AGENTS.md](../AGENTS.md) / [RULES.md](../RULES.md) | Điểm vào và quy tắc dự án rút gọn cho công cụ hỗ trợ lập trình. | `Markdown` |
| [.agents/skills/ux-ui-pro/SKILL.md](../.agents/skills/ux-ui-pro/SKILL.md) | Hướng dẫn UX/UI riêng cho giao diện SNOTE. | Skill nội bộ |
| [.gitignore](../.gitignore) | Khai báo loại bỏ `node_modules/`, `.env`, `dist/`, `coverage/`, logs và dữ liệu database local khỏi Git. | `Git` |

---

### 3.2. Thư mục Tài liệu Kỹ thuật Dự án (`DOCS/`)

| Đường dẫn tệp | Vai trò & Chức năng chi tiết | Phân đoạn lộ trình |
| :--- | :--- | :--- |
| [DOCS/step_1.md](../DOCS/step_1.md) | Định nghĩa chân dung sinh viên mục tiêu, giải quyết bài toán phân mảnh ghi chú, phạm vi tính năng MVP và định hướng AI. | Bước 1 |
| [DOCS/step_2.md](../DOCS/step_2.md) | Thiết kế mô hình dữ liệu quan hệ, ERD, 8 Enums, DDL 10+ bảng, ràng buộc CHECK chống note rác, B-Tree & GIN Indexes. | Bước 2 |
| [DOCS/step_3.md](../DOCS/step_3.md) | Thiết kế kiến trúc hệ thống tổng thể (Modular Monolith), phân rã 10 Bounded Contexts, quy chuẩn config, logger, error, security. | Bước 3 |
| [DOCS/step_3_setup.md](../DOCS/step_3_setup.md) | Tài liệu kỹ thuật chi tiết của Bước nhỏ 3.3 (Setup backend skeleton từ số 0). | Bước 3.3 |
| [DOCS/step_3_frontend.md](../DOCS/step_3_frontend.md) | Tài liệu kỹ thuật chi tiết của Bước nhỏ 3.4 (Setup Frontend SPA Feature-based). | Bước 3.4 |
| [DOCS/step_3_repo_structure.md](../DOCS/step_3_repo_structure.md) | Tài liệu kỹ thuật chi tiết của Bước nhỏ 3.5 (Cấu trúc Repo & Monorepo shared packages). | Bước 3.5 |
| [DOCS/step_3_observability_security.md](../DOCS/step_3_observability_security.md) | Tài liệu kỹ thuật chi tiết của Bước nhỏ 3.6 (Observability, AppError hierarchy, asyncBoundary, Pino redaction, security). | Bước 3.6 |
| [DOCS/step_3_architecture.md](../DOCS/step_3_architecture.md) | Tài liệu kỹ thuật tổng hợp toàn diện Bước 3 lớn (Đặc tả kiến trúc, 10 modules, stacks, repo, security, health probes). | Bước 3.7 |
| [DOCS/COMMANDS_PLAYBOOK.md](../DOCS/COMMANDS_PLAYBOOK.md) | Sổ tay tập trung toàn bộ câu lệnh CLI: Khởi chạy, Docker, Prisma, Build, Test PowerShell/cURL, Git và Clean dự án. | Sổ tay Vận hành |
| [DOCS/PROJECT_STRUCTURE_AND_MAP.md](../DOCS/PROJECT_STRUCTURE_AND_MAP.md) | Tài liệu tra cứu cấu trúc dự án, ma trận công nghệ, từ điển tệp tin và vị trí áp dụng (File này). | Bản đồ Dự án |
| [DOCS/TECH_STACK_REVIEW.md](../DOCS/TECH_STACK_REVIEW.md) | Nhãn đánh giá công nghệ: cốt lõi, theo tính năng, công cụ dev, tùy chọn và dư thừa. | Đánh giá công nghệ |

---

### 3.4. Shared TypeScript Source (`packages/shared/`)

| Đường dẫn tệp | Vai trò & Chức năng chi tiết | Công nghệ sử dụng |
| :--- | :--- | :--- |
| [packages/shared/src/enums.ts](../packages/shared/src/enums.ts) | Định nghĩa 8 Enums chuẩn: `UserStatus`, `SemesterStatus`, `SubjectStatus`, `ProjectStatus`, `NoteType`, `TaskStatus`, `TaskPriority`, `ScheduleEventType`. | `TypeScript Enums` |
| [packages/shared/src/contracts/api.contract.ts](../packages/shared/src/contracts/api.contract.ts) | Định nghĩa wrapper chuẩn `ApiResponse<T>`, `ApiErrorResponse` và `PaginationQuery`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/auth.contract.ts](../packages/shared/src/contracts/auth.contract.ts) | Định nghĩa DTOs `RegisterDto`, `LoginDto`, `UserResponseDto`, `AuthResponseDto`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/semesters.contract.ts](../packages/shared/src/contracts/semesters.contract.ts) | Định nghĩa DTOs `CreateSemesterDto`, `UpdateSemesterDto`, `SemesterResponseDto`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/subjects.contract.ts](../packages/shared/src/contracts/subjects.contract.ts) | Định nghĩa DTOs `CreateSubjectDto`, `UpdateSubjectDto`, `SubjectResponseDto`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/projects.contract.ts](../packages/shared/src/contracts/projects.contract.ts) | Định nghĩa DTOs `CreateProjectDto`, `UpdateProjectDto`, `ProjectResponseDto`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/notes.contract.ts](../packages/shared/src/contracts/notes.contract.ts) | Định nghĩa interfaces `CreateNoteDto`, `UpdateNoteDto`, `NoteResponseDto`, `TagDto`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/tasks.contract.ts](../packages/shared/src/contracts/tasks.contract.ts) | Định nghĩa interfaces `CreateTaskDto`, `UpdateTaskDto`, `TaskResponseDto`, `TaskFilter`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/schedule.contract.ts](../packages/shared/src/contracts/schedule.contract.ts) | Định nghĩa DTOs `CreateScheduleEventDto`, `UpdateScheduleEventDto`, `ScheduleEventResponseDto`. | `TypeScript Interfaces` |
| [packages/shared/src/contracts/backup.contract.ts](../packages/shared/src/contracts/backup.contract.ts) | Định nghĩa interface `UserBackupPayload`. | `TypeScript Interfaces` |
| [packages/shared/src/index.ts](../packages/shared/src/index.ts) | Entry point của enums/contracts frontend được resolve trực tiếp từ source. | `TypeScript Exports` |

---

### 3.5. Mã nguồn Backend API (`backend/`)

| Đường dẫn tệp | Vai trò & Chức năng chi tiết | Công nghệ sử dụng |
| :--- | :--- | :--- |
| [backend/package.json](../backend/package.json) | Khai báo dependencies backend (Express, Prisma, Zod, Pino, Helmet, Bcrypt, JWT...) và build scripts. | `npm package` |
| [backend/tsconfig.json](../backend/tsconfig.json) | Cấu hình TypeScript Strict Mode, target `ES2022`, module `CommonJS`, rootDir `./src`, outDir `./dist`. | `TypeScript` |
| [backend/prisma.config.ts](../backend/prisma.config.ts) | Cấu hình datasource URL từ biến môi trường cho Prisma CLI v7. | `Prisma Config` |
| [backend/prisma/schema.prisma](../backend/prisma/schema.prisma) | Khai báo 10+ Models (`User`, `RefreshToken`, `Semester`, `Subject`, `Project`, `Note`, `Task`, `Tag`, `ScheduleEvent`, `BackupRecord`) và 8 Enums. | `Prisma Schema` |
| [backend/prisma/seed.ts](../backend/prisma/seed.ts) | Script nạp dữ liệu mẫu sinh viên thực tế (user, 1 học kỳ, 3 môn học, 1 đồ án, 3 tags, 2 notes, 3 tasks, 2 sự kiện lịch). | `TypeScript`, `PrismaClient` |
| [backend/src/server.ts](../backend/src/server.ts) | Entry point chính của backend: Cấu hình Helmet, CORS, CookieParser, Pino HTTP, RateLimit, wire-up 8 domain routers và ErrorHandler. | `Express 5`, `Pino`, `Helmet`, `CORS` |
| [backend/src/types/express.d.ts](../backend/src/types/express.d.ts) | Định nghĩa TypeScript declaration mở rộng `Express.Request` chứa thông tin `req.user` và `req.id`. | `TypeScript Declaration` |
| [backend/src/config/env-schema.ts](../backend/src/config/env-schema.ts) | Định nghĩa schema Zod để kiểm tra chặt chẽ kiểu dữ liệu của biến môi trường (`PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`...). | `Zod` |
| [backend/src/config/env.ts](../backend/src/config/env.ts) | Thực thi parse `process.env`. Nếu thiếu hoặc sai cấu hình, dừng server ngay lập tức (**Fail-Fast**). | `Zod`, `dotenv` |
| [backend/src/shared/db/prismaClient.ts](../backend/src/shared/db/prismaClient.ts) | Khởi tạo Singleton instance `prisma` kết nối qua `PrismaPg` adapter và pool `pg`. | `PrismaClient`, `@prisma/adapter-pg`, `pg` |
| [backend/src/shared/utils/logger.ts](../backend/src/shared/utils/logger.ts) | Cấu hình Pino Structured Logger kèm tính năng `redact` che giấu tokens và passwords. | `Pino` |
| [backend/src/shared/errors/appErrors.ts](../backend/src/shared/errors/appErrors.ts) | Cây phân cấp Custom Errors (`AppError`, `ValidationError`, `AuthError`, `ForbiddenError`, `NotFoundError`, `ConflictError`). | `TypeScript Classes` |
| [backend/src/shared/middleware/asyncBoundary.ts](../backend/src/shared/middleware/asyncBoundary.ts) | Middleware wrapper bọc các route handler bất đồng bộ, tự động chuyển lỗi qua `next(err)`. | `Express Middleware` |
| [backend/src/shared/middleware/authGuard.ts](../backend/src/shared/middleware/authGuard.ts) | Middleware xác thực JWT Bearer Token và gán `req.user` bảo vệ chống tấn công IDOR. | `jsonwebtoken`, `Express` |
| [backend/src/shared/middleware/adminGuard.ts](../backend/src/shared/middleware/adminGuard.ts) | Middleware RBAC: Kiểm tra vai trò `ADMIN`, chặn tài khoản sinh viên thường (`403 Forbidden`). | `Express Middleware` |
| [backend/src/shared/middleware/rateLimit.ts](../backend/src/shared/middleware/rateLimit.ts) | Cấu hình Rate Limiters (`loginRateLimiter` 10 req/15m, `apiRateLimiter` 100 req/1m). | `express-rate-limit` |
| [backend/src/shared/middleware/errorHandler.ts](../backend/src/shared/middleware/errorHandler.ts) | Middleware bắt lỗi tập trung: Tự động map `ZodError` và `AppError` sang HTTP response chuẩn có mã code và context. | `Express Error Middleware`, `ZodError` |
| [backend/src/modules/health/health.routes.ts](../backend/src/modules/health/health.routes.ts) | Endpoints kiểm tra sức khỏe hệ thống: `/health`, `/health/live`, `/health/ready` (query DB). | `Express Router`, `PrismaPg` |
| [backend/src/modules/health/index.ts](../backend/src/modules/health/index.ts) | Public API của module health. | `TypeScript Exports` |
| [backend/src/modules/auth/](../backend/src/modules/auth) | Phân hệ Xác thực: Đăng ký, Đăng nhập, Token Rotation, Cookie httpOnly, Cập nhật Profile, Đổi mật khẩu, Bcrypt cost 12. | `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `Prisma` |
| [backend/src/modules/semesters/](../backend/src/modules/semesters) | Phân hệ Học kỳ: CRUD học kỳ, đánh dấu học kỳ hiện tại (`isCurrent`), soft delete. | `PrismaClient`, `Zod`, `Express` |
| [backend/src/modules/subjects/](../backend/src/modules/subjects) | Phân hệ Môn học: CRUD môn học, số tín chỉ, giảng viên, mã màu, relation counters. | `PrismaClient`, `Zod`, `Express` |
| [backend/src/modules/projects/](../backend/src/modules/projects) | Phân hệ Đồ án & Làm việc nhóm: CRUD đồ án, quản lý thành viên nhóm (`ProjectMember`), phân quyền vai trò. | `PrismaClient`, `Zod`, `Express` |
| [backend/src/modules/notes/](../backend/src/modules/notes) | Phân hệ Ghi chú bài giảng: CRUD, ghim, lưu trữ, tags, chống note rác (`subjectId \|\| projectId`). | `PrismaClient`, `Zod`, `Express` |
| [backend/src/modules/tasks/](../backend/src/modules/tasks) | Phân hệ Công việc sinh viên: CRUD, trạng thái Kanban, độ ưu tiên, deadline, tags. | `PrismaClient`, `Zod`, `Express` |
| [backend/src/modules/schedule/](../backend/src/modules/schedule) | Phân hệ Lịch trình & Lịch thi: Quản lý sự kiện lịch theo tuần/tháng, lặp lại sự kiện. | `PrismaClient`, `Zod`, `Express` |
| [backend/src/modules/backup/](../backend/src/modules/backup) | Phân hệ Sao lưu dữ liệu: Export toàn bộ dữ liệu tài khoản ra JSON kèm SHA-256 checksum. | `Node Crypto`, `PrismaClient`, `Express` |
| [backend/src/modules/ai/](../backend/src/modules/ai) | Phân hệ Trợ lý AI Học thuật: Rút trích Todo, Dự đoán đề thi, Soạn đề cương 1 trang, Giải thích khái niệm chuyên sâu. | `TypeScript`, `PrismaClient`, `Express` |

---

### 3.6. Mã nguồn Frontend SPA (`frontend/`)

| Đường dẫn tệp | Vai trò & Chức năng chi tiết | Công nghệ sử dụng |
| :--- | :--- | :--- |
| [frontend/package.json](../frontend/package.json) | Khai báo dependencies frontend (React 19, React Router DOM v7, Vite, TypeScript) và build scripts. | `npm package` |
| [frontend/tsconfig.json](../frontend/tsconfig.json) | Cấu hình TypeScript compiler cho React Client kèm alias `@snote/shared`. | `TypeScript` |
| [frontend/vite.config.ts](../frontend/vite.config.ts) | Cấu hình plugin React cho Vite, resolve alias `@snote/shared` và dev server cổng `5173`. | `Vite`, `@vitejs/plugin-react` |
| [frontend/index.html](../frontend/index.html) | File HTML gốc chứa thẻ `<div id="root">` và nhúng `/src/main.tsx`. | `HTML5` |
| [frontend/src/assets/styles/global.css](../frontend/src/assets/styles/global.css) | Toàn bộ CSS toàn cục: CSS variables màu sắc, dark theme, reset style, typography, scrollbars, spin animation. | `CSS3 Custom Properties` |
| [frontend/src/services/api.ts](../frontend/src/services/api.ts) | Wrapper HTTP API Client đóng gói fetch, tự động chèn `Authorization: Bearer <token>`, gửi credentials và hỗ trợ tải blob. | `Fetch API`, `TypeScript` |
| [frontend/src/contexts/ThemeContext.tsx](../frontend/src/contexts/ThemeContext.tsx) | React Context quản lý Dark/Light theme, tự động lưu trữ và đồng bộ với `localStorage`. | `React Context` |
| [frontend/src/contexts/AuthContext.tsx](../frontend/src/contexts/AuthContext.tsx) | React Context quản lý phiên đăng nhập JWT, user profile, role `ADMIN/STUDENT`, updateProfile, changePassword. | `React Context` |
| [frontend/src/contexts/AppFilterContext.tsx](../frontend/src/contexts/AppFilterContext.tsx) | React Context quản lý bộ lọc ngữ cảnh toàn cục (Học kỳ active, Môn học active). | `React Context` |
| [frontend/src/contexts/ToastContext.tsx](../frontend/src/contexts/ToastContext.tsx) | React Context hiển thị các thông báo phản hồi thao tác nổi với Lucide Icons (Success / Error / Info). | `React Context`, `Lucide Icons` |
| [frontend/src/components/common/Modal.tsx](../frontend/src/components/common/Modal.tsx) | Modal Dialog tái sử dụng cho các form tạo/sửa dữ liệu kèm animation `scaleIn`. | `React 19`, `Lucide Icons` |
| [frontend/src/components/common/MarkdownViewer.tsx](../frontend/src/components/common/MarkdownViewer.tsx) | Component render Markdown chuẩn GitHub (`react-markdown` + `remark-gfm`) cho bài giảng. | `react-markdown`, `remark-gfm` |
| [frontend/src/components/common/QuickActionModal.tsx](../frontend/src/components/common/QuickActionModal.tsx) | Modal Tạo Nhanh toàn cục (Quick Action) cho phép tạo ngay Note, Task hoặc Lịch học từ bất kỳ đâu. | `React 19`, `Lucide Icons` |
| [frontend/src/components/layout/Sidebar.tsx](../frontend/src/components/layout/Sidebar.tsx) | Thanh điều hướng trái chứa Logo SNOTE, 8 menu sinh viên + 1 menu AI Copilot, ẩn/hiện Trạng thái hệ thống theo quyền Admin. | `React 19`, `react-router-dom`, `Lucide` |
| [frontend/src/components/common/GlobalSearchModal.tsx](../frontend/src/components/common/GlobalSearchModal.tsx) | Modal tìm kiếm toàn cục đa tiêu chí (`Ctrl+K`), lọc theo text + môn + tag + status + priority + thời gian. | `React 19`, `Lucide` |
| [frontend/src/components/common/ShareModal.tsx](../frontend/src/components/common/ShareModal.tsx) | Modal chia sẻ tài liệu (Ghi chú, Công việc, Đồ án) qua email bạn học hoặc tạo Public Link với quyền VIEW/EDIT. | `React 19`, `Lucide` |
| [frontend/src/components/layout/Topbar.tsx](../frontend/src/components/layout/Topbar.tsx) | Header chứa bộ chọn học kỳ & môn học toàn cục, thanh tìm kiếm nhanh `Ctrl+K` và nút Tạo Nhanh (+). | `React 19`, `Lucide` |
| [frontend/src/components/layout/AppLayout.tsx](../frontend/src/components/layout/AppLayout.tsx) | Khung bố cục chính (Master Layout) lồng Sidebar, Topbar, FloatingAiChatbot và React Router `<Outlet />`. | `React 19`, `react-router-dom` |
| [frontend/src/components/layout/ProtectedRoute.tsx](../frontend/src/components/layout/ProtectedRoute.tsx) | Guard kiểm tra xác thực, tự động chuyển hướng về `/login` nếu chưa đăng nhập. | `React 19`, `react-router-dom` |
| [frontend/src/components/layout/AdminRoute.tsx](../frontend/src/components/layout/AdminRoute.tsx) | Guard phân quyền RBAC: Chặn truy cập nếu không phải `ADMIN`, hiển thị màn hình 403 Access Denied. | `React 19`, `Lucide` |
| [frontend/src/features/auth/](../frontend/src/features/auth) | Phân hệ Xác thực: `LoginPage.tsx` (1-click fill Student/Admin), `RegisterPage.tsx` (đăng ký). | `React 19`, `Lucide` |
| [frontend/src/features/notes/](../frontend/src/features/notes) | Phân hệ Ghi chú: `NotesListPage.tsx` (chế độ Lưới/Danh sách), `NoteCard.tsx` (ước tính thời gian đọc), `NoteModal.tsx` (thanh công cụ Markdown, Chia sẻ). | `React 19`, `react-markdown` |
| [frontend/src/features/tasks/](../frontend/src/features/tasks) | Phân hệ Công việc & Nhiệm vụ: `TasksListPage.tsx` (View Switcher 3 chế độ: Kanban, Danh sách Hạn chót, Ma trận Eisenhower), `QuickTaskBar.tsx` (Tạo việc nhanh 1-Click), `TasksListView.tsx`, `TasksEisenhowerView.tsx`, `TaskCard.tsx`, `TaskModal.tsx`. | `React 19`, `Lucide` |
| [frontend/src/features/schedule/](../frontend/src/features/schedule) | Phân hệ Lịch trình & Thời khóa biểu: `ScheduleWeekPage.tsx` (Trang quản lý Lịch biểu chuyên dụng), `GanttTimelineView.tsx` (Sơ đồ Gantt Timeline 31 ngày, vạch Hôm nay, Floating Tooltip, Status Tabs, 1-Click Date Cell Add), `EventModal.tsx` (4 Chế độ, Preset Ca học 1-5, Tạo lặp lại học kỳ $N$ tuần). | `React 19`, `Lucide` |
| [frontend/src/features/semesters/](../frontend/src/features/semesters) | Phân hệ Học kỳ & Môn học: `SemesterOverviewPage.tsx`, `SemesterModal.tsx`, `SubjectModal.tsx` (bảng chọn màu). | `React 19`, `Lucide` |
| [frontend/src/features/projects/](../frontend/src/features/projects) | Phân hệ Đồ án & Làm việc nhóm: `ProjectsListPage.tsx`, `ProjectModal.tsx`, `TeamMembersModal.tsx` (mời bạn học, phân công). | `React 19`, `Lucide` |
| [frontend/src/features/shares/](../frontend/src/features/shares) | Phân hệ Chia sẻ tài liệu: `PublicShareViewPage.tsx` (trang xem tài liệu công khai qua link `http://.../share/:token`). | `React 19`, `Lucide` |
| [frontend/src/features/ai/](../frontend/src/features/ai) | Phân hệ Trợ lý AI SNOTE: `FloatingAiChatbot.tsx` (nút nổi thu nhỏ `Ctrl+J`), `AiChatPage.tsx` (không gian chat toàn màn hình). | `React 19`, `Lucide`, `react-markdown` |
| [frontend/src/features/progress/](../frontend/src/features/progress) | Phân hệ Tiến độ học tập: `ProgressDashboardPage.tsx` (Bento metrics, phân tích % theo môn). | `React 19`, `Lucide` |
| [frontend/src/features/settings/](../frontend/src/features/settings) | Phân hệ Cài đặt & Sao lưu: `SettingsPage.tsx` (chỉnh sửa hồ sơ sinh viên, đổi mật khẩu, đổi theme, xuất JSON granular, xuất Markdown, khôi phục Restore JSON). | `React 19`, `Lucide` |
| [frontend/src/features/status/](../frontend/src/features/status) | Phân hệ Giám sát sức khỏe Admin: `StatusPage.tsx` (kiểm tra `/health/live` và `/health/ready` real-time, khóa RBAC). | `React 19`, `Lucide` |
| [frontend/src/router/index.tsx](../frontend/src/router/index.tsx) | Cấu hình React Router DOM điều hướng toàn bộ 8 phân hệ học tập + trang Public Share lồng trong `ProtectedRoute` & `AppLayout`. | `react-router-dom` |
| [frontend/src/App.tsx](../frontend/src/App.tsx) | Root Component bọc `ThemeProvider`, `AuthProvider`, `ToastProvider` và `AppFilterProvider`. | `React 19` |
| [frontend/src/main.tsx](../frontend/src/main.tsx) | Điểm khởi đầu của ứng dụng React, gắn vào thẻ `#root` trong DOM. | `React DOM 19` |

---

## 4. QUY TRÌNH BẢO TRÌ VÀ CẬP NHẬT TÀI LIỆU BẮT BUỘC (THEO ĐIỀU 4)

Mỗi khi phát triển hoặc sửa đổi tính năng trong dự án:
1. **Thêm / Đổi Thư viện hoặc Công nghệ:**
   - Cập nhật ngay vào **Mục 1 (Tech Stack Matrix)**: Ghi rõ Tên, Phiên bản, Vị trí áp dụng, Nhiệm vụ cốt lõi, Chức năng chi tiết và Lý do lựa chọn.
2. **Thêm / Đổi File hoặc Thư mục:**
   - Cập nhật ngay vào **Mục 2 (Directory Tree)**: Bổ sung nhánh cây thư mục tương ứng.
   - Cập nhật ngay vào **Mục 3 (File Dictionary)**: Thêm dòng tra cứu chi tiết gồm Đường dẫn tệp, Vai trò/Chức năng chi tiết và Công nghệ sử dụng trong file đó.
3. **Tuân thủ Tuyệt đối:** Không để xảy ra tình trạng code đã thay đổi nhưng tài liệu bản đồ không được cập nhật.
