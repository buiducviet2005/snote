# Bước 3 – Thiết kế Kiến trúc Hệ thống & Nền tảng Kỹ thuật (AI Note)

Tài liệu này chuyển hóa toàn bộ các định nghĩa sản phẩm (**Bước 1**) và mô hình thực thể dữ liệu (**Bước 2**) thành **bản thiết kế kiến trúc hệ thống và quy chuẩn nền tảng kỹ thuật chi tiết** cho dự án **AI Note**.

Mọi quyết định kiến trúc được xác lập dựa trên nguyên lý cốt lõi (first principles), đáp ứng tính toàn vẹn dữ liệu học tập, tối ưu hóa chu kỳ phát triển MVP cho đội ngũ tinh gọn (1–3 lập trình viên), đồng thời chuẩn bị sẵn đường dẫn tiến hóa cho các giai đoạn AI nâng cao trong tương lai.

---

## MỤC LỤC CHI TIẾT

1. [Chiến lược Kiến trúc Tổng thể (Modular Monolith)](#1-chiến-lược-kiến-trúc-tổng-thể-modular-monolith)
   - 1.1. Bối cảnh bài toán & Ràng buộc kỹ thuật
   - 1.2. Quyết định kiến trúc & Lập luận kỹ thuật
   - 1.3. Ranh giới Transaction ACID & Chiến lược mở rộng tương lai
2. [Phân rã Domain & Ranh giới Module (Domain-Driven Design)](#2-phân-rã-domain--ranh-giới-module-domain-driven-design)
   - 2.1. Bản đồ 10 Bounded Contexts
   - 2.2. Kiến trúc phân tầng nội bộ (Layered Architecture)
   - 2.3. Quy tắc ranh giới và kiểm soát phụ thuộc (Acyclic Dependencies)
3. [Quyết định Stack Công nghệ (Technology Stack)](#3-quyết-định-stack-công-nghệ-technology-stack)
   - 3.1. Backend Stack & Chiến lược ORM vs Raw SQL
   - 3.2. Frontend Stack & Chiến lược quản lý State
   - 3.3. Hạ tầng Cơ sở dữ liệu (PostgreSQL 16)
4. [Cấu trúc Thư mục & Tổ chức Mã nguồn Dự án](#4-cấu-trúc-thư-mục--tổ-chức-mã-nguồn-dự-án)
   - 4.1. Cây thư mục tổng thể (Monorepo Layout)
   - 4.2. Quy ước đặt tên file và trách nhiệm từng file
5. [Quy chuẩn Kỹ thuật Hệ thống](#5-quy-chuẩn-kỹ-thuật-hệ-thống)
   - 5.1. Quản lý cấu hình & Khởi động Fail-Fast (Zod Validation)
   - 5.2. Chuẩn Structured Logging (Pino + Correlation Request ID)
   - 5.3. Chuẩn xử lý lỗi tập trung (Centralized Custom Error Hierarchy)
   - 5.4. Quy chuẩn An toàn & Bảo mật MVP (Security Baseline & Chống IDOR)
6. [Hợp đồng Giao diện & DTO Validation Schemas](#6-hợp-đồng-giao-diện--dto-validation-schemas)
   - 6.1. Hợp đồng Service Interfaces
   - 6.2. Zod Validation Schemas (Ràng buộc Ngữ cảnh Học tập)
7. [Hướng dẫn Khởi tạo & Thiết lập Môi trường từ Số 0 (Step-by-Step Setup)](#7-hướng-dẫn-khởi-tạo--thiết-lập-môi-trường-từ-số-0-step-by-step-setup)
   - 7.1. Cài đặt công cụ nền tảng
   - 7.2. Thiết lập Docker PostgreSQL Container
   - 7.3. Khởi tạo Backend Node.js + TypeScript
   - 7.4. Cài đặt Dependencies & Cấu hình TypeScript
   - 7.5. Xây dựng Module Cấu hình Env & Prisma Client
   - 7.6. Xây dựng Skeleton Server, Middleware & Route Wire-up
   - 7.7. Kiểm thử tích hợp khởi động (Verification Checklist)
8. [Tiêu chí Nghiệm thu Bước 3 (Definition of Done) & Chuyển giao Bước 4](#8-tiêu-chí-nghiệm-thu-bước-3-definition-of-done--chuyển-giao-bước-4)

---

## 1. Chiến lược Kiến trúc Tổng thể (Modular Monolith)

### 1.1. Bối cảnh bài toán & Ràng buộc kỹ thuật
- **Đặc thù dữ liệu quan hệ mạnh:** AI Note quản lý dữ liệu học tập có cấu trúc phân cấp chặt chẽ: `users` $\rightarrow$ `semesters` $\rightarrow$ `subjects` / `projects` $\rightarrow$ `notes` / `tasks` + `tags`. Ràng buộc cốt lõi từ Bước 1 và Bước 2 đòi hỏi:
  - Một ghi chú hoặc công việc **bắt buộc phải gắn với ít nhất một Môn học (`subject_id`) hoặc Đồ án (`project_id`)** để ngăn chặn triệt để "note rác".
  - Mọi thực thể riêng tư phải truy vết trực tiếp về `user_id`.
- **Yêu cầu nhất quán dữ liệu (Strong Consistency):** Các thao tác tạo note kèm tag, tạo task liên kết ghi chú (`task_note_links`), hoặc sao lưu/phục hồi phải đảm bảo tính nguyên tử (Atomicity). Mất dữ liệu học tập là điều không thể chấp nhận.
- **Nguồn lực thực tế:** Team quy mô 1–3 người, mục tiêu tối thượng là ship nhanh bản MVP non-AI ổn định, phục vụ cá nhân và nhóm học tập sinh viên.

### 1.2. Quyết định kiến trúc & Lập luận kỹ thuật
Hệ thống lựa chọn kiến trúc **Modular Monolith** (Monolith theo khối module):
- **1 Frontend Single Page Application (React + Vite)**.
- **1 Backend API Application (Node.js + Express + TypeScript)** xử lý toàn bộ logic nghiệp vụ trong một tiến trình duy nhất.
- **1 Database PostgreSQL** đóng vai trò nguồn chân lý duy nhất (Single Source of Truth).

```mermaid
graph TD
    UserClient["Frontend SPA (React + Vite)"] -->|"HTTPS / REST API (Bearer JWT)"| AppServer["Backend API Server (Node.js Modular Monolith)"]

    subgraph AppServerProcess ["Tiến trình Backend Duy nhất (Single Process)"]
        AuthCtx["Auth & Users Module"]
        StudyCtx["Study Context Module (Semesters, Subjects, Projects)"]
        KnowledgeCtx["Knowledge Base Module (Notes, Tags)"]
        WorkflowCtx["Workflow Module (Tasks, Schedule)"]
        InfraCtx["System Module (Search, Backup)"]
    end

    AppServer -->|"Connection Pool (Prisma Client + Raw SQL)"| PostgresDB[("PostgreSQL 16 Engine (Single ACID Boundary)")]
```

#### Vì sao loại bỏ Microservices ở giai đoạn này?
1. **Tránh chi phí mạng và độ trễ phân tán (Network Overhead):** Microservices tạo ra độ trễ qua network hop giữa các service khi truy vấn thông tin học kỳ, môn học, ghi chú và công việc.
2. **Loại bỏ Distributed Transactions (Saga / 2PC):** Các ràng buộc CHECK liên bảng và khóa ngoại composite nếu bị tách thành nhiều database riêng biệt sẽ buộc phải áp dụng eventual consistency hoặc saga phức tạp, làm tăng rủi ro sai lệch dữ liệu học tập.
3. **Giảm gánh nặng vận hành (DevOps Overhead):** Không cần service discovery, API gateway phức tạp, container orchestration (Kubernetes) ở quy mô MVP.

### 1.3. Ranh giới Transaction ACID & Chiến lược mở rộng tương lai
- **Ranh giới Transaction:** Mọi thao tác ghi nhiều bảng (ví dụ: tạo ghi chú + ghi nhận tags + cập nhật vector tìm kiếm) được thực hiện trong **1 Transaction PostgreSQL duy nhất** (`BEGIN ... COMMIT / ROLLBACK`).
- **Đường thoát tương lai (Future-Ready Path):** 
  - Toàn bộ backend được thiết kế theo các module nghiệp vụ tách biệt (DDD Bounded Contexts).
  - Khi triển khai **Roadmap AI (v1 $\rightarrow$ v4)** với các tác vụ nặng (tính toán vector embedding, RAG, sinh quiz/flashcards, GPU compute), thành phần AI sẽ được tách thành một service vệ tinh độc lập (`ai-service`) giao tiếp qua REST/gRPC/Message Queue, trong khi non-AI core vẫn giữ nguyên vẹn trong Monolith DB.

---

## 2. Phân rã Domain & Ranh giới Module (Domain-Driven Design)

### 2.1. Bản đồ 10 Bounded Contexts

| Nhóm Domain | Tên Module | Trách nhiệm nghiệp vụ cốt lõi |
| :--- | :--- | :--- |
| **Identity & Access** | `auth` | Đăng ký tài khoản, đăng nhập, JWT Access/Refresh tokens, mã hóa mật khẩu (`argon2`/`bcrypt`). |
| | `users` | Hồ sơ sinh viên, thiết lập múi giờ (`timezone`), trạng thái tài khoản (`user_status`). |
| **Study Context** | `semesters` | Quản lý học kỳ, thời gian bắt đầu/kết thúc, trạng thái học kỳ (`semester_status`). |
| | `subjects` | Quản lý môn học theo học kỳ, mã môn, số tín chỉ, giảng viên. |
| | `projects` | Đồ án, bài tập lớn, quản lý thành viên dự án (`project_members`), vai trò thành viên. |
| **Knowledge Base** | `notes` | Soạn thảo, quản lý ghi chú, phân loại (`note_type`: `LECTURE`, `ASSIGNMENT`, `EXAM_REVIEW`...), soft delete. |
| | `tags` | Quản lý kho nhãn cá nhân, liên kết đa năng qua `note_tags` và `task_tags`. |
| **Workflow** | `tasks` | Quản lý công việc học tập, deadline, độ ưu tiên (`LOW`, `MEDIUM`, `HIGH`), trạng thái (`TODO`, `IN_PROGRESS`, `DONE`). |
| | `schedule` | Thời khóa biểu tuần/tháng, sự kiện học tập (`CLASS`, `EXAM`, `DEADLINE`), đồng bộ lịch. |
| **System & Utilities** | `search` | Tìm kiếm tổng hợp đa tiêu chí kết hợp PostgreSQL Full-Text Search (`tsvector`, GIN Index). |
| | `backup` | Xuất/nhập dữ liệu có cấu trúc (JSON, Markdown) theo học kỳ/môn học; quản lý lịch sử sao lưu. |

### 2.2. Kiến trúc phân tầng nội bộ (Layered Architecture)

Mỗi module nghiệp vụ tuân thủ nghiêm ngặt mô hình phân tầng:

$$\text{HTTP Request} \longrightarrow \mathbf{Route} \longrightarrow \mathbf{Controller} \longrightarrow \mathbf{Service} \longrightarrow \mathbf{Repository} \longrightarrow \text{PostgreSQL}$$

```text
src/modules/notes/
├── notes.routes.ts       # Định nghĩa endpoints HTTP, gắn middleware (Auth, Validate)
├── notes.controller.ts   # Tiếp nhận Request, bóc tách params/body, gọi Service, trả Response
├── notes.service.ts      # Chứa 100% Business Logic, kiểm tra quyền sở hữu, quản lý Transaction
├── notes.repository.ts   # Thực hiện truy vấn DB qua Prisma Client hoặc Raw SQL
├── notes.schemas.ts      # Zod validation schemas cho DTOs đầu vào
├── notes.types.ts        # TypeScript Interfaces (DTOs, Filters, Entity Types)
└── index.ts              # Public API duy nhất của module (export Service Interface)
```

### 2.3. Quy tắc ranh giới và kiểm soát phụ thuộc (Acyclic Dependencies)

1. **Giao tiếp liên module qua Public API:**
   - Module A muốn sử dụng nghiệp vụ của Module B **chỉ được phép gọi thông qua Service Interface** được export tại `src/modules/B/index.ts`.
   - **Tuyệt đối cấm:** Module A import trực tiếp `*.repository.ts` hoặc query trực tiếp bảng dữ liệu thuộc Module B.
2. **Đồ thị phụ thuộc đơn hướng (Acyclic Graph):**
   - Không tạo quan hệ phụ thuộc vòng (circular dependency).
   - Chiều phụ thuộc chuẩn:
     $$\text{Workflow / Knowledge} \longrightarrow \text{Study Context} \longrightarrow \text{Identity \& Access}$$
   - Module `schedule` được phép đọc dữ liệu từ `tasks`, nhưng module `tasks` không được import ngược lại `schedule`.

---

## 3. Quyết định Stack Công nghệ (Technology Stack)

### 3.1. Backend Stack & Chiến lược ORM vs Raw SQL

- **Runtime & Ngôn ngữ:** `Node.js` (LTS v18/v20/v22) + `TypeScript` thiết lập `strict: true`.
- **Framework Web:** `Express.js` (gọn nhẹ, minh bạch, dễ dàng kiểm soát luồng middleware).
- **ORM & Công cụ Migration:** `Prisma ORM` kết hợp `Raw SQL`.

#### Chiến lược phân định rõ ràng giữa Prisma và Raw SQL:

| Thao tác dữ liệu | Công cụ | Lập luận kỹ thuật |
| :--- | :--- | :--- |
| **CRUD nghiệp vụ cơ bản** | `Prisma Client` | Tự động sinh kiểu dữ liệu an toàn (Type-safe), tăng tốc độ viết code, hạn chế lỗi chính tả field/table. |
| **Ràng buộc CHECK phức tạp** | `Raw SQL` trong Migration | Ràng buộc `CHECK (subject_id IS NOT NULL OR project_id IS NOT NULL)` không thể sinh tự động bằng Prisma Schema. Phải viết trực tiếp trong migration SQL. |
| **Trigger cập nhật thời gian** | `Raw SQL` trong Migration | Trigger tự động cập nhật `updated_at = NOW()` trước khi update dòng dữ liệu. |
| **Full-Text Search (FTS)** | `Raw SQL` (`$queryRaw`) | Tạo cột `search_vector tsvector` tự động cập nhật (Generated Column / Trigger), đánh GIN Index, và truy vấn bằng `websearch_to_tsquery()` + `ts_rank()`. |
| **Ghi đồng thời nhiều bảng** | `prisma.$transaction()` | Đảm bảo tính nguyên tử ACID cho các chuỗi thao tác liên quan. |

### 3.2. Frontend Stack & Chiến lược quản lý State

- **Nền tảng & Build Tool:** `React` (v18+) + `TypeScript` + `Vite` (Single Page Application - SPA).
- **Lý do không dùng SSR (Next.js):** Ứng dụng là không gian học tập cá nhân phía sau màn hình đăng nhập, không có nhu cầu SEO công khai hay Web Crawler. Kiến trúc SPA giảm thiểu độ phức tạp của server hydration, tối ưu tốc độ phản hồi trên client.
- **Phân định State Management:**
  - **Server State (Dữ liệu từ API):** Sử dụng **TanStack Query (React Query)** để quản lý bộ nhớ đệm (cache), tự động làm mới (invalidation), retry khi lỗi mạng, và cập nhật giao diện lạc quan (optimistic updates).
  - **Client / UI State (Ngữ cảnh giao diện):** Sử dụng **Zustand** để quản lý trạng thái chọn lựa hiện tại của sinh viên (`activeSemesterId`, `activeSubjectId`, `activeProjectId`, theme, sidebar collapse).

### 3.3. Hạ tầng Cơ sở dữ liệu (PostgreSQL 16)
- Chuẩn hóa toàn bộ trường thời gian bằng `TIMESTAMPTZ` (UTC). Hiển thị theo `timezone` người dùng.
- Áp dụng xóa mềm (`deleted_at TIMESTAMPTZ`) trên các bảng nghiệp vụ chính (`notes`, `tasks`, `subjects`, `projects`).
- Khóa chính chuẩn hóa `id UUID DEFAULT gen_random_uuid()`.

---

## 4. Cấu trúc Thư mục & Tổ chức Mã nguồn Dự án

### 4.1. Cây thư mục tổng thể (Monorepo Layout)

```text
ai-note/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                 # Định nghĩa mô hình dữ liệu Prisma
│   │   └── migrations/                   # Thư mục lưu trữ các file SQL migrations
│   ├── src/
│   │   ├── config/                       # Quản lý & xác thực biến môi trường
│   │   │   ├── env.ts                    # Export object config đã parse
│   │   │   └── env-schema.ts             # Zod schema cho environment variables
│   │   ├── modules/                      # 10 Bounded Contexts (Modular Monolith)
│   │   │   ├── auth/                     # Xác thực & Token
│   │   │   ├── users/                    # Hồ sơ người dùng
│   │   │   ├── semesters/                # Học kỳ
│   │   │   ├── subjects/                 # Môn học
│   │   │   ├── projects/                 # Đồ án & Thành viên
│   │   │   ├── notes/                    # Ghi chú bài giảng & tài liệu
│   │   │   │   ├── notes.routes.ts
│   │   │   │   ├── notes.controller.ts
│   │   │   │   ├── notes.service.ts
│   │   │   │   ├── notes.repository.ts
│   │   │   │   ├── notes.schemas.ts
│   │   │   │   ├── notes.types.ts
│   │   │   │   └── index.ts              # Public Service Interface export
│   │   │   ├── tags/                     # Nhãn phân loại
│   │   │   ├── tasks/                    # Công việc học tập & Deadline
│   │   │   ├── schedule/                 # Thời khóa biểu & Sự kiện
│   │   │   ├── search/                   # Full-Text Search đa tiêu chí
│   │   │   └── backup/                   # Sao lưu & Xuất dữ liệu Markdown/JSON
│   │   ├── shared/                       # Các module & tiện ích dùng chung
│   │   │   ├── db/
│   │   │   │   └── prismaClient.ts       # Singleton instance của PrismaClient
│   │   │   ├── errors/                   # Cây phân cấp Custom Error classes
│   │   │   │   └── appErrors.ts
│   │   │   ├── middleware/               # Middlewares dùng chung
│   │   │   │   ├── authGuard.ts          # Xác thực JWT & inject User Payload
│   │   │   │   ├── errorHandler.ts       # Centralized Error Handling Middleware
│   │   │   │   ├── requestLogger.ts      # Logging request kèm RequestId
│   │   │   │   └── validateRequest.ts   # Middleware validate body/query bằng Zod
│   │   │   └── utils/
│   │   │       └── logger.ts             # Pino Logger instance
│   │   └── server.ts                     # Entry point khởi chạy HTTP Server
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/                          # HTTP client & React Query hooks
│   │   ├── components/                   # UI components dùng chung (Buttons, Modals, Inputs)
│   │   ├── features/                     # UI theo domain (notes/, tasks/, schedule/, auth/)
│   │   ├── store/                        # Zustand stores (UI context: semester, subject)
│   │   ├── routes/                       # Cấu hình Client-side Routing
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docs/                                 # Tài liệu quy chuẩn kỹ thuật dự án
│   ├── step_1.md
│   ├── step_2.md
│   └── step_3.md
└── docker-compose.yml                     # Cấu hình PostgreSQL local container
```

---

## 5. Quy chuẩn Kỹ thuật Hệ thống

### 5.1. Quản lý cấu hình & Khởi động Fail-Fast (Zod Validation)
- Mọi biến cấu hình được định nghĩa tập trung và kiểm tra kiểu dữ liệu nghiêm ngặt.
- **Cơ chế Fail-Fast:** Khi khởi chạy server, nếu thiếu bất kỳ biến môi trường bắt buộc nào (như `DATABASE_URL`, `JWT_SECRET`), tiến trình Node.js sẽ in ra danh sách lỗi và **chủ động dừng lại ngay lập tức (`process.exit(1)`)**, ngăn chặn việc chạy với cấu hình sai sót.

```ts
// src/config/env-schema.ts
import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url('DATABASE_URL phải là một connection string hợp lệ'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET phải có độ dài tối thiểu 32 ký tự'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET phải có tối thiểu 32 ký tự'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173')
});

export type EnvConfig = z.infer<typeof envSchema>;
```

### 5.2. Chuẩn Structured Logging (Pino + Correlation Request ID)
- Sử dụng **Pino** để tạo structured JSON logs.
- Mỗi request đi qua hệ thống đều được middleware gán một `requestId` duy nhất (UUID v4) qua header `x-request-id`.
- Mọi log ghi lại trong suốt vòng đời xử lý request đều gắn kèm: `timestamp`, `level`, `requestId`, `userId` (nếu đã đăng nhập), `method`, `url`, và `responseTime`.

```ts
// src/shared/utils/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' }
  } : undefined
});
```

### 5.3. Chuẩn xử lý lỗi tập trung (Centralized Custom Error Hierarchy)
Hệ thống sử dụng các class lỗi kế thừa từ `AppError` để kiểm soát mã trạng thái HTTP:

```ts
// src/shared/errors/appErrors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Dữ liệu đầu vào không hợp lệ', details?: any) {
    super(400, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Yêu cầu xác thực tài khoản') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Bạn không có quyền thực hiện hành động này') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy tài nguyên yêu cầu') {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Dữ liệu xung đột hoặc đã tồn tại') {
    super(409, message);
  }
}
```

Middleware `errorHandler` ở cuối Express Pipeline:
- Chuyển đổi chính xác các `AppError` thành JSON phản hồi chuẩn `{ error: { message, details } }`.
- Bắt các mã lỗi vi phạm từ PostgreSQL (ví dụ `23505` unique violation, `23503` foreign key violation) và ánh xạ về `ConflictError` hoặc `ValidationError`.
- Đối với lỗi không xác định (`500`): Ghi log full stack trace nội bộ kèm `requestId`, nhưng **chỉ trả về thông điệp chung `Internal Server Error` cho client để bảo vệ an toàn thông tin**.

### 5.4. Quy chuẩn An toàn & Bảo mật MVP (Security Baseline)
1. **Kiểm soát Quyền Sở hữu Nghiêm ngặt (Ngăn chặn IDOR):**
   - Mọi câu lệnh truy vấn dữ liệu (SELECT, UPDATE, DELETE) của sinh viên **bắt buộc phải kèm điều kiện `WHERE user_id = :currentUserId`** tại tầng Service/Repository.
   - Tuyệt đối không chỉ dựa vào `id` truyền từ URL params mà không xác thực quyền sở hữu.
2. **Cơ chế Token Kép (Dual-Token Auth):**
   - `Access Token` (JWT, thời hạn ngắn: 15–30 phút) truyền qua Authorization Header.
   - `Refresh Token` (thời hạn 7 ngày) lưu trữ trong cookie `httpOnly`, `Secure`, `SameSite=Strict` để chống tấn công XSS.
   - Mật khẩu người dùng được hash bằng `argon2id` (hoặc `bcrypt` với cost factor $\ge 12$).
3. **HTTP Security Headers & CORS:**
   - Kích hoạt `helmet` để cấu hình các header an toàn (X-Content-Type-Options, X-Frame-Options...).
   - Cấu hình CORS chặt chẽ, chỉ cho phép duy nhất domain frontend được chỉ định trong `.env`.
4. **Rate Limiting:**
   - Giới hạn tần suất gọi API tại các route xác thực (`/api/auth/login`, `/api/auth/register`) bằng `express-rate-limit` để ngăn chặn tấn công Brute-force và DoS.

---

## 6. Hợp đồng Giao diện & DTO Validation Schemas

### 6.1. Hợp đồng Service Interfaces

```ts
// src/modules/notes/notes.types.ts
export interface NoteFilter {
  subjectId?: string;
  projectId?: string;
  noteType?: 'LECTURE' | 'ASSIGNMENT' | 'EXAM_REVIEW' | 'RESOURCE' | 'IDEA';
  searchQuery?: string;
  tagIds?: string[];
  page?: number;
  limit?: number;
}

export interface CreateNoteDto {
  title: string;
  content: string;
  subjectId?: string;
  projectId?: string;
  noteType: 'LECTURE' | 'ASSIGNMENT' | 'EXAM_REVIEW' | 'RESOURCE' | 'IDEA';
  tagNames?: string[];
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  subjectId?: string;
  projectId?: string;
  noteType?: 'LECTURE' | 'ASSIGNMENT' | 'EXAM_REVIEW' | 'RESOURCE' | 'IDEA';
  tagNames?: string[];
}

export interface INotesService {
  createNote(userId: string, dto: CreateNoteDto): Promise<any>;
  getNoteById(userId: string, noteId: string): Promise<any>;
  listNotes(userId: string, filter: NoteFilter): Promise<{ data: any[]; total: number; page: number; limit: number }>;
  updateNote(userId: string, noteId: string, dto: UpdateNoteDto): Promise<any>;
  deleteNote(userId: string, noteId: string): Promise<void>;
}
```

```ts
// src/modules/tasks/tasks.types.ts
export interface TaskFilter {
  subjectId?: string;
  projectId?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  fromDueDate?: Date;
  toDueDate?: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  subjectId?: string;
  projectId?: string;
  dueAt?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  tagNames?: string[];
}

export interface ITasksService {
  createTask(userId: string, dto: CreateTaskDto): Promise<any>;
  listTasks(userId: string, filter: TaskFilter): Promise<any[]>;
  updateTaskStatus(userId: string, taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE'): Promise<any>;
  deleteTask(userId: string, taskId: string): Promise<void>;
}
```

### 6.2. Zod Validation Schemas (Ràng buộc Ngữ cảnh Học tập)

```ts
// src/modules/notes/notes.schemas.ts
import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề ghi chú không được để trống').max(255),
  content: z.string().min(1, 'Nội dung ghi chú không được để trống'),
  subjectId: z.string().uuid('ID môn học không hợp lệ').optional(),
  projectId: z.string().uuid('ID đồ án không hợp lệ').optional(),
  noteType: z.enum(['LECTURE', 'ASSIGNMENT', 'EXAM_REVIEW', 'RESOURCE', 'IDEA'], {
    errorMap: () => ({ message: 'Loại ghi chú không hợp lệ' })
  }),
  tagNames: z.array(z.string().trim().min(1)).optional()
}).refine(
  (data) => Boolean(data.subjectId || data.projectId),
  {
    message: 'Ghi chú bắt buộc phải gắn với ít nhất một Môn học (subjectId) hoặc Đồ án (projectId)',
    path: ['subjectId']
  }
);
```

---

## 7. Hướng dẫn Khởi tạo & Thiết lập Môi trường từ Số 0 (Step-by-Step Setup)

### 7.1. Cài đặt công cụ nền tảng
- Cài đặt **Node.js (LTS v18/v20/v22)** từ trang chủ `nodejs.org`.
- Cài đặt **Docker Desktop** để chạy container PostgreSQL.

### 7.2. Thiết lập Docker PostgreSQL Container
Tại thư mục gốc dự án (`ai-note/`), tạo file `docker-compose.yml`:

```yaml
version: '3.9'

services:
  postgres_db:
    image: postgres:16-alpine
    container_name: ainote_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ainote_dev_user
      POSTGRES_PASSWORD: ainote_dev_password_2026
      POSTGRES_DB: ainote_dev_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Khởi động database container:
```bash
docker compose up -d postgres_db
```

### 7.3. Khởi tạo Backend Node.js + TypeScript
```bash
mkdir -p backend/src
cd backend

# Khởi tạo package.json
npm init -y
```

### 7.4. Cài đặt Dependencies & Cấu hình TypeScript
```bash
# Cài đặt Production Dependencies
npm install express cors dotenv helmet express-rate-limit zod pino pino-http @prisma/client

# Cài đặt Development Dependencies
npm install -D typescript tsx @types/node @types/express @types/cors pino-pretty prisma
```

Tạo file `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

Thêm scripts vào `backend/package.json`:
```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev"
}
```

### 7.5. Xây dựng Module Cấu hình Env & Prisma Client

Tạo file `backend/.env.example`:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://ainote_dev_user:ainote_dev_password_2026@localhost:5432/ainote_dev_db?schema=public"
JWT_SECRET="super_secret_jwt_access_key_min_32_characters"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="super_secret_jwt_refresh_key_min_32_characters"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```
Tạo file `backend/.env` bằng cách copy từ `.env.example`.

Khởi tạo cấu hình Prisma:
```bash
npx prisma init
```

Tạo file `backend/src/config/env.ts`:
```ts
import dotenv from 'dotenv';
import { envSchema } from './env-schema';

dotenv.config();

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Lỗi cấu hình biến môi trường không hợp lệ:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
```

Tạo file `backend/src/shared/db/prismaClient.ts`:
```ts
import { PrismaClient } from '@prisma/client';
import { env } from '../../config/env';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});
```

### 7.6. Xây dựng Skeleton Server, Middleware & Route Wire-up

Tạo file `backend/src/server.ts`:
```ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { notesRouter } from './modules/notes/notes.routes';

const app = express();

// Global Middlewares
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'ai-note-backend', timestamp: new Date().toISOString() });
});

// Register Domain Routers
app.use('/api/notes', notesRouter);

// Centralized Error Handling Placeholder
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

app.listen(env.PORT, () => {
  logger.info(`🚀 Server AI Note Backend đang chạy tại port ${env.PORT} [${env.NODE_ENV}]`);
});
```

Tạo file `backend/src/modules/notes/notes.routes.ts`:
```ts
import { Router } from 'express';

export const notesRouter = Router();

notesRouter.get('/', (req, res) => {
  res.status(200).json({ message: 'Danh sách ghi chú (stub)', data: [] });
});

notesRouter.post('/', (req, res) => {
  res.status(201).json({ message: 'Tạo ghi chú thành công (stub)' });
});
```

### 7.7. Kiểm thử tích hợp khởi động (Verification Checklist)
1. Chạy lệnh dev server:
   ```bash
   npm run dev
   ```
2. Gửi request kiểm tra:
   - `GET http://localhost:4000/health` $\rightarrow$ Nhận `{ "status": "ok", ... }` với status `200`.
   - `GET http://localhost:4000/api/notes` $\rightarrow$ Nhận `{ "message": "...", "data": [] }` với status `200`.

---

## 8. Tiêu chí Nghiệm thu Bước 3 (Definition of Done) & Chuyển giao Bước 4

Bước 3 – Thiết kế Kiến trúc Hệ thống & Nền tảng Kỹ thuật được nghiệm thu khi đáp ứng 100% các tiêu chí:

- [x] **Kiến trúc Tổng thể:** Đã xác lập mô hình Modular Monolith, xác định rõ transaction boundary trong 1 database PostgreSQL duy nhất, chứng minh tính phù hợp so với Microservices.
- [x] **Phân rã Bounded Contexts:** Đã chia 10 module độc lập theo DDD, tuân thủ nguyên tắc phụ thuộc một chiều (Acyclic) và phân tầng Route $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Repository.
- [x] **Stack Công nghệ & Chiến lược SQL:** Đã chốt Node.js + TypeScript (Strict) + Express + Prisma (kết hợp Raw SQL cho CHECK constraints, triggers, tsvector/GIN index và search query).
- [x] **Quy chuẩn Vận hành & An toàn:** Đã hoàn thiện thiết kế Fail-Fast Config (Zod), Structured Logging (Pino), Centralized Errors và Security Baseline (Dual Token, Helmet, CORS, Ownership Check chống IDOR).
- [x] **Hợp đồng & Skeleton:** Đã định nghĩa đầy đủ Service Interfaces, DTOs, Zod Validation Schemas và xây dựng thành công bộ khung khởi động kiểm thử.

---

### Chuyển giao sang Bước 4:
Với nền tảng kiến trúc đã được thiết lập vững chắc, dự án chính thức tiến vào **Bước 4 – Triển khai Backend Core**:
1. Ánh xạ toàn bộ schema Bước 2 thành DDL/Migrations PostgreSQL.
2. Viết migrations thủ công cho custom enums, CHECK ngữ cảnh học tập, triggers và FTS vector.
3. Triển khai Module Authentication và các API nghiệp vụ chính: Notes, Tasks, Schedule, Backup.
