# Bảng Checklist Thực thi Bước 3.6: Quan sát & Cứng hóa Bảo mật Backend (SNOTE)

Tài liệu này dùng để theo dõi, quản lý và xác thực từng tác vụ trong **Bước nhỏ 3.6: Thiết lập Observability (Logging/Error Handling) & Cứng hóa Bảo mật Backend** thuộc **Bước 3 lớn (Thiết kế Kiến trúc & Nền tảng)** của dự án **SNOTE**.

---

## 📊 BẢNG TIẾN ĐỘ THỰC THI BƯỚC 3.6

| ID | Hạng mục công việc | File / Lệnh liên quan | Tiêu chí đạt | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| `SEC-01` | **Tạo tài liệu đặc tả chuẩn hóa Bước 3.6** | `DOCS/step_3_observability_security.md` | Tài liệu phân tích đầy đủ: AppError hierarchy, asyncBoundary, Pino redaction, middleware pipeline, rateLimit, authGuard JWT. | ✅ **[x] Đạt** |
| `SEC-02` | **Nâng cấp Hệ thống Custom Errors** | `backend/src/shared/errors/appErrors.ts` | Khai báo `AppError` với `isOperational`, `context`, `statusCode`, `code`; các lớp con `ValidationError`, `AuthError`, `ForbiddenError`, `NotFoundError`. | ✅ **[x] Đạt** |
| `SEC-03` | **Xây dựng `asyncBoundary` Wrapper** | `backend/src/shared/middleware/asyncBoundary.ts` | Wrapper bắt lỗi bất đồng bộ cho route handler, tự động chuyển lỗi sang `next(err)` không cần try/catch thủ công. | ✅ **[x] Đạt** |
| `SEC-04` | **Nâng cấp Centralized `errorHandler`** | `backend/src/shared/middleware/errorHandler.ts` | Phân biệt `isOperational` (log warn, mã chuẩn) vs lỗi bất ngờ 500 (log error, ẩn stack trace); đính kèm `requestId` và `context`. | ✅ **[x] Đạt** |
| `SEC-05` | **Xử lý `unhandledRejection` & `uncaughtException`** | `backend/src/server.ts` | Đăng ký process handlers ghi log fatal rồi shutdown sạch sẽ khi có lỗi runtime nghiêm trọng. | ✅ **[x] Đạt** |
| `SEC-06` | **Nâng cấp Pino Structured Logger với Redaction** | `backend/src/shared/utils/logger.ts` | Cấu hình `redact` che giấu `authorization`, `password`, `passwordHash`; hỗ trợ `pino-pretty` ở dev, JSON ở production. | ✅ **[x] Đạt** |
| `SEC-07` | **Cài đặt & Xây dựng `rateLimit` Middleware** | `backend/src/shared/middleware/rateLimit.ts` | Cấu hình `loginRateLimiter` (10 requests/15 phút) và `apiRateLimiter` (100 requests/1 phút). | ✅ **[x] Đạt** |
| `SEC-08` | **Cài đặt `jsonwebtoken` & Xây dựng `authGuard`** | `backend/src/shared/middleware/authGuard.ts`<br>`backend/src/types/express.d.ts` | Verify JWT token từ `Authorization: Bearer <token>`, gắn `req.user = { id }` chống IDOR. | ✅ **[x] Đạt** |
| `SEC-09` | **Sắp xếp Chuẩn Pipeline Middleware trong `server.ts`** | `backend/src/server.ts` | Thứ tự: `disable('x-powered-by')` $\rightarrow$ `helmet()` $\rightarrow$ `cors()` $\rightarrow$ `express.json({ limit: '1mb' })` $\rightarrow$ `requestLogger` $\rightarrow$ `apiRateLimiter` $\rightarrow$ Routes $\rightarrow$ `errorHandler`. | ✅ **[x] Đạt** |
| `SEC-10` | **Áp dụng vào Notes Module & Kiểm thử Toàn diện** | `backend/src/modules/notes/` | Sử dụng `asyncBoundary`, `authGuard`, `ValidationError`, enforce `userId` ở Service/Repo. Chạy type-check và test HTTP API đạt 100%. | ✅ **[x] Đạt** |

---

## 📝 NHẬT KÝ THỰC THI THỰC TẾ (EXECUTION LOGS)

1. **Đặc tả Kiến trúc Bước 3.6:** Tạo [DOCS/step_3_observability_security.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_observability_security.md).
2. **Cài đặt jsonwebtoken & Custom Types:** Cài đặt `jsonwebtoken`, `@types/jsonwebtoken` và tạo [backend/src/types/express.d.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/types/express.d.ts) khai báo `req.user = { id, email }`.
3. **Nâng cấp AppError Hierarchy:** Hoàn thiện [appErrors.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/errors/appErrors.ts) bổ sung `isOperational`, `context`, `statusCode`, `code` (`ValidationError`, `AuthError`, `ForbiddenError`, `NotFoundError`, `ConflictError`).
4. **Xây dựng Async Boundary & Error Handler:** Tạo [asyncBoundary.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/middleware/asyncBoundary.ts) và nâng cấp [errorHandler.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/middleware/errorHandler.ts) tự động phân luồng log `warn`/`error` và gán `requestId`.
5. **Cứng hóa Bảo mật & Rate Limiting:**
   * Tạo [rateLimit.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/middleware/rateLimit.ts) (`loginRateLimiter` 10 req/15m, `apiRateLimiter` 100 req/1m).
   * Tạo [authGuard.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/middleware/authGuard.ts) xác thực JWT token.
   * Cấu hình [logger.ts](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/shared/utils/logger.ts) với `redact` tự động che giấu mật khẩu và bearer tokens.
6. **Kiểm thử Thực tế:**
   * `npm run build` & `npm run type-check` $\rightarrow$ **0 lỗi TypeScript**.
   * Test `GET /health` $\rightarrow$ **HTTP 200 OK**.
   * Test `POST /api/notes` (Không có subjectId/projectId) $\rightarrow$ **HTTP 400 VALIDATION_ERROR** (bắt đúng lỗi chống note rác qua Zod & AppError).
   * Test `POST /api/notes` (Hợp lệ) $\rightarrow$ **HTTP 201 Created**.
