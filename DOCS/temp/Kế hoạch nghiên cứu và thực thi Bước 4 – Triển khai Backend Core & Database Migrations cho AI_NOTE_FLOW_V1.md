# Kế hoạch nghiên cứu và thực thi Bước 4 – Triển khai Backend Core & Database Migrations cho AI_NOTE_FLOW_V1

## Tổng quan mục tiêu Bước 4

Bước 4 trong AI_NOTE_FLOW_V1 tập trung vào việc biến toàn bộ thiết kế dữ liệu (Bước 2) và kiến trúc backend (Bước 3) thành một backend chạy được, có schema rõ ràng, migration chuẩn, auth bảo mật và các module nghiệp vụ cốt lõi hoạt động trên dữ liệu thật.[^1][^2]
Bản kế hoạch này không viết code chi tiết mà chuẩn hóa lại các hạng mục nghiên cứu và thực thi để NAVER có thể tiến hành với mindset Lead Engineer, tránh brute-force, đảm bảo tính đúng đắn, khả năng mở rộng và an toàn dữ liệu.[^2][^1]

## Phân rã Bước 4 thành các cụm công việc

### 1. Chuẩn hóa lại schema & DDL từ Bước 2

- Rà soát lại toàn bộ thiết kế ERD, bảng và quan hệ đã được chốt ở Bước 2 (User, Semester, Subject, Project, Note, Task, ScheduleEvent, Tag, Attachment, SyncLog, Backup…).[^3]
- Chuyển thiết kế logic (ERD) thành DDL PostgreSQL rõ ràng: `CREATE TYPE`, `CREATE TABLE`, `FOREIGN KEY`, `UNIQUE`, `CHECK`, `INDEX` với đầy đủ ràng buộc về tính toàn vẹn và bảo vệ khỏi “note rác”.[^1][^3]
- Xác định rõ các enum/status ở mức DB (task_status, task_priority, semester_status, user_status…) và chuẩn hóa naming để đồng nhất với layer ứng dụng (TypeScript enums / Zod schema).[^1]
- Thiết kế các CHECK constraint quan trọng, ví dụ: `subject_id IS NOT NULL OR project_id IS NOT NULL` cho notes/tasks để không tồn tại ghi chú “trôi nổi”, đúng triết lý gắn note vào context học tập.[^3][^1]

### 2. Thiết lập Prisma schema và pipeline migration

- Mapping từng bảng trong DDL PostgreSQL sang `schema.prisma` với các model tương ứng (User, Semester, Subject, Project, Note, Task, ScheduleEvent, Tag, Attachment, SyncLog, Backup…).[^2][^3]
- Đảm bảo mapping chính xác kiểu dữ liệu: `timestamptz`, `enum`, `jsonb`, `uuid`, `serial/bigserial` bằng các type Prisma tương ứng, tránh mất thông tin hoặc ép kiểu nguy hiểm.[^2]
- Thiết lập adapter PostgreSQL đúng phiên bản (Prisma 7 + `@prisma/adapter-pg` như đã chốt ở Bước 3) và kiểm tra lại cấu hình connection (pooling, timeout,…).[^2]
- Chạy migration đầu tiên: `npx prisma migrate dev --name init_snote_core_schema` (hoặc tên tương đương đã được định nghĩa), xác minh rằng schema sinh ra trong PostgreSQL trùng với thiết kế ở DDL.[^3][^2]
- Thiết lập cơ chế seed dữ liệu: tạo script seed cho user mẫu, 1–2 học kỳ, vài môn học, vài projects, notes, tasks để phục vụ test manual và test tự động về sau.[^1][^3]

### 3. Bổ sung ràng buộc DB nâng cao (CHECK, Trigger) chống “note rác”

- Định nghĩa chuẩn các CHECK constraint then chốt: gắn context bắt buộc (subject/project), không cho phép deadline ở quá khứ cho một số loại task nếu triết lý sản phẩm yêu cầu, giới hạn độ dài tiêu đề, v.v.[^3][^1]
- Thiết kế Trigger hoặc Constraint nâng cao nếu cần: ví dụ log SyncLog mỗi khi Note hoặc Task thay đổi, hoặc auto cập nhật `updated_at` đồng nhất trên nhiều bảng.[^3]
- Đảm bảo mọi logic “integrity-critical” nằm ở DB trước, sau đó mới được phản chiếu ở service layer – đúng tinh thần High-Stakes Engineering (không để bug frontend/backend phá nát dữ liệu lõi).[^1][^2]

### 4. Thiết kế và triển khai module Auth hoàn chỉnh

- Chuẩn hóa lại flow Auth: Register → Login → Refresh Token → Logout → Me, bám đúng vào quyết định ở tài liệu Step 3 (JWT Access Token + Refresh Token lưu trong cookie `httpOnly`, `Secure`).[^2][^3]
- Áp dụng hashing mật khẩu với bcrypt (cost factor 12) như roadmap, đánh giá trade-off giữa độ an toàn và latency trên máy sinh viên, có thể benchmark thực tế.[^3]
- Thiết kế lại schema User liên quan đến auth: field password_hash, email unique, trạng thái user (active/blocked), các timestamp như `last_login_at`, `password_changed_at` nếu cần.[^1][^3]
- Thiết lập middleware auth ở backend: parse token, load user, fail-fast với AppError chuẩn hóa từ Bước 3 (không để lẫn lộn logic auth vào từng route).[^2]
- Viết test cơ bản cho auth: đăng ký, đăng nhập, refresh token, truy cập endpoint bảo vệ, thử các case sai mật khẩu, token hết hạn, token sửa tay.[^1][^2]

### 5. Triển khai các module nghiệp vụ cốt lõi (CRUD Real Data)

- Semesters & Subjects Module: API CRUD cho học kỳ và môn học, gắn với user, kiểm soát quyền sở hữu và tránh trùng tên vô nghĩa nếu cần.[^3]
- Projects Module: quản lý đồ án, nhóm, deadline đồ án; đảm bảo liên kết đúng với môn học và user, xử lý case xóa môn/project có cascade hay soft-delete.[^1][^3]
- Notes Module: CRUD + soft delete, gắn note với subject/project, gắn tag, đảm bảo tôn trọng CHECK constraint đã định nghĩa ở DB để không tồn tại note “mồ côi”.[^3][^1]
- Tasks Module: CRUD + trạng thái (TODO/IN_PROGRESS/DONE), priority, deadline; cho phép filter theo môn, project, trạng thái để chuẩn bị cho frontend Kanban/To-do list.[^1][^3]
- Schedule Module: quản lý sự kiện lịch học, lịch thi, lịch đồ án; API lấy lịch theo tuần/tháng cho một user, tối ưu query để phục vụ hiển thị calendar ở Bước 5.[^3][^1]
- Backup Module: API export toàn bộ dữ liệu (notes, tasks, schedule, tags, subjects, projects) của một user ra JSON/ZIP chuẩn, giữ triết lý dữ liệu mở và khả năng backup/di chuyển nền tảng.[^3]

### 6. Thiết kế API surface và contract ổn định cho frontend

- Chuẩn hóa naming và URL cho các endpoint: `/api/auth/*`, `/api/notes/*`, `/api/tasks/*`, `/api/semesters/*`,… đảm bảo không đổi lung tung, tránh phá vỡ contract khi chuyển sang Bước 5.[^2][^1]
- Định nghĩa schema request/response bằng Zod hoặc DTO chung (`@snote/shared`) đã được setup ở Bước 3, đảm bảo type-safe end-to-end.[^2]
- Quy định rõ các quy tắc phân trang, filter, sort (query params) cho notes/tasks/schedule để tránh phải refactor lớn khi dữ liệu tăng nhiều học kỳ.[^1][^3]

### 7. Health check, observability và test tối thiểu

- Đảm bảo module health check từ Bước 3 (`/live`, `/ready`) được kết nối với DB mới, bao gồm kiểm tra migration đã chạy, DB reachable, phiên bản schema đúng.[^2]
- Thiết lập logging đầy đủ cho các module mới (auth, notes, tasks, schedule, backup) với Pino và cơ chế redaction đã thiết kế ở Bước 3 để không log nhầm dữ liệu nhạy cảm.[^2]
- Viết test tối thiểu (integration test hoặc e2e đơn giản) cho các flows: tạo user → tạo semester/subject → tạo note/task → export backup, đảm bảo đường đi dữ liệu chính hoạt động đúng.[^1][^2]

## Thứ tự thực thi khuyến nghị (mindset Lead Engineer)

| Thứ tự | Cụm công việc | Lý do ưu tiên |
|-------|---------------|---------------|
| 1 | Chuẩn hóa DDL & Prisma schema | Nếu schema sai thì mọi thứ phía trên đều hỏng; sửa sớm rẻ hơn. |
| 2 | Migrations + Seed + CHECK/Trigger | Đảm bảo nền dữ liệu vững, ngăn bug ứng dụng phá dữ liệu. |
| 3 | Auth module | Không có auth thì mọi nghiệp vụ khác đều không thể chạy đúng với user thật. |
| 4 | Semesters/Subjects/Projects | Đặt trục tổ chức dữ liệu học tập (context) trước khi sinh note/task. |
| 5 | Notes/Tasks/Schedule | Triển khai core workflows mà sinh viên tương tác hàng ngày. |
| 6 | Backup/Export | Đảm bảo quyền sở hữu dữ liệu và khả năng di chuyển nền tảng. |
| 7 | Health check, logging, test | Củng cố chất lượng, chuẩn bị cho Bước 5/6/7 về sau. |

## Tiêu chuẩn chất lượng và điểm cần tự review khắt khe

- Không chấp nhận schema “tạm dùng được”: mọi bảng, khóa ngoại, enum phải được lý giải bằng use case thực tế của sinh viên và triết lý tránh note rác.[^1]
- Mọi logic quan trọng liên quan đến tính toàn vẹn và bảo vệ dữ liệu đều phải nằm trước ở DB (constraint, trigger) rồi mới phản chiếu lên service, không phụ thuộc vào “tử tế” của frontend.[^3][^1]
- Auth phải được coi là biên an ninh sống còn: không được phép để endpoint nào truy cập/ghi dữ liệu người khác chỉ vì quên check user_id hay thiếu guard.[^2]
- Mọi API đều cần được kiểm tra bằng dữ liệu seed và ít nhất một vòng test manual: “Nếu cho 1 sinh viên năm nhất dùng 1 tuần, dữ liệu của họ có bị rác, trôi nổi, mất, hay lẫn với người khác không?”.[^3][^1]

## Kết luận

Với kế hoạch trên, Bước 4 được đóng khung thành chuỗi công việc rõ ràng: từ chuẩn hóa schema, migrations, auth, đến các module nghiệp vụ và backup, bám sát các tài liệu Bước 2 và Bước 3 đã hoàn thành.[^2][^3]
Khi hoàn thành Bước 4 theo chuẩn này, backend của AI Note (SNOTE) sẽ đạt mức “non-AI core vững chắc”: dữ liệu sạch, an toàn, có khả năng backup, sẵn sàng để Bước 5 xây dựng frontend và các bước AI/production về sau.[^1][^3][^2]

---

## References

1. [chat/tôi muốn tiến trình được chia thành các bước lớn,.md](chat/tôi muốn tiến trình được chia thành các bước lớn,.md)

2. [đánh dấu các bước/ai_chat_docs/06_STEP_3_HANDOVER_AND_COMPLETION.md](đánh dấu các bước/ai_chat_docs/06_STEP_3_HANDOVER_AND_COMPLETION.md)

3. [đánh dấu các bước/ai_chat_docs/02_PENDING_TASKS_AND_ROADMAP.md](đánh dấu các bước/ai_chat_docs/02_PENDING_TASKS_AND_ROADMAP.md)

