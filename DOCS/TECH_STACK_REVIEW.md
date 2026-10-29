# Đánh giá công nghệ SNOTE

## Nhãn

- **[CORE]** Cần cho kiến trúc hiện tại.
- **[FEATURE]** Được tính năng đang dùng; giữ khi tính năng còn tồn tại.
- **[DEV]** Chỉ phục vụ phát triển hoặc build.
- **[OPTIONAL]** Có thể bỏ mà không mất luồng học tập chính.
- **[REDUNDANT]** Cấu hình trùng hoặc không được ứng dụng sử dụng; nên loại bỏ.

| Nhãn | Công nghệ | Vai trò thực tế | Quyết định |
|---|---|---|---|
| [CORE] | Node.js + TypeScript | Runtime và hệ kiểu cho hai ứng dụng | Giữ. |
| [CORE] | Express | API backend dạng modular monolith | Giữ; cấu trúc module hiện tại đủ dùng. |
| [CORE] | PostgreSQL + Prisma | Lưu dữ liệu, schema và migrations | Giữ một database và một ORM. |
| [CORE] | `pg` + `@prisma/adapter-pg` | Driver PostgreSQL cho Prisma 7; `pg` cũng dùng trong script migration | Giữ; hai gói bổ trợ nhau. |
| [CORE] | React + React DOM + Vite | Ứng dụng web và công cụ build/dev | Giữ. |
| [FEATURE] | React Router | Điều hướng SPA và route bảo vệ | Giữ khi ứng dụng còn nhiều màn hình. |
| [FEATURE] | Zod | Kiểm tra cấu hình và dữ liệu đầu vào | Giữ để fail-fast và validate request. |
| [FEATURE] | `jsonwebtoken`, `bcryptjs`, `cookie-parser` | Token, mã hóa mật khẩu và refresh cookie | Giữ cho xác thực hiện tại. |
| [FEATURE] | CORS, Helmet, `express-rate-limit` | Cấu hình truy cập và bảo vệ HTTP cơ bản | Giữ; mỗi gói có nhiệm vụ riêng. |
| [FEATURE] | Pino + `pino-http` | Log có cấu trúc và log request | Giữ. `pino-pretty` là [DEV], chỉ làm log local dễ đọc. |
| [FEATURE] | `google-auth-library` | Xác minh Google identity token | Giữ nếu tiếp tục hỗ trợ đăng nhập Google. |
| [FEATURE] | `react-markdown` + `remark-gfm` | Hiển thị Markdown và bảng/checklist kiểu GitHub | Giữ; plugin bổ sung tính năng cho renderer. |
| [FEATURE] | `lucide-react` | Bộ icon dùng khắp giao diện | Giữ một thư viện icon duy nhất. |
| [FEATURE] | `packages/shared/src` | Enum/DTO frontend được resolve trực tiếp qua alias | Giữ source; backend hiện dùng kiểu do Prisma sinh. |
| [DEV] | `@prisma/config`, `concurrently`, `tsx`, TypeScript, Vite React plugin | Cấu hình Prisma, chạy song song, chạy TS và build | Giữ; không chạy trong ứng dụng production. |
| [DEV] | `ui-ux-pro-max` trong `.agents/skills` | Dữ liệu tham khảo UX/UI cho agent; không thuộc bundle frontend | Giữ như công cụ thiết kế, không thêm npm dependency. |
| [OPTIONAL] | `canvas-confetti` | Hiệu ứng ăn mừng trang trí | Đã bỏ khỏi giao diện và dependencies; toast hoàn thành vẫn còn. |
| [REDUNDANT] | Cài/build riêng package `@snote/shared` | App dùng shared source qua alias, không dùng package build | Đã bỏ metadata build và bước cài/build riêng; giữ contracts source. |

## Nguyên tắc giữ stack gọn

Chưa khai báo state manager, date framework, CSS framework, API client, charting library hay animation engine riêng. Ưu tiên API trình duyệt, React state, API service và CSS sẵn có trước khi thêm thư viện.

`backend/prisma.config.ts` import trực tiếp `@prisma/config`; gói này được khai báo là dependency phát triển của backend vì Prisma config sử dụng nó.
