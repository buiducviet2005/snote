# SNOTE: kiến trúc và luồng dữ liệu hiện tại

Tài liệu này được dựng từ mã nguồn đang chạy: `frontend/src`, `backend/src`, `backend/prisma/schema.prisma`, cấu hình Vite, Dockerfile và Compose. Đây là mô tả **trạng thái triển khai hiện tại**, không phải thiết kế mong muốn.

## 1. Các phần chạy của hệ thống

| Phần | Điểm vào và trách nhiệm |
| --- | --- |
| Giao diện | `frontend/src/main.tsx` khởi tạo React; `App.tsx` lồng các context; `router/index.tsx` nối URL với trang. Vite build thành file tĩnh. |
| API | `backend/src/server.ts` khởi động Express, gắn middleware và router dưới `/api`. Mỗi module chứa route, controller, service và (nếu cần) repository. |
| Kiểu dùng chung | `packages/shared/src` xuất enum và một số DTO cho frontend. Backend dùng kiểu sinh từ Prisma. |
| Dữ liệu | `backend/prisma/schema.prisma` định nghĩa bảng, quan hệ và enum PostgreSQL. `backend/prisma/migrations` là lịch sử thay đổi schema; `prismaClient.ts` tạo client truy vấn. |

Luồng một thao tác thông thường:

```text
Người dùng → trang/component React → frontend/src/services/api.ts
           → Express route → controller (đọc/kiểm tra input)
           → service (quyền và nghiệp vụ) → repository/Prisma
           → PostgreSQL → JSON response → cập nhật state React
```

Ở chế độ phát triển, Vite chuyển tiếp `/api` đến `localhost:4000` (`frontend/vite.config.ts`). Bản tự host dùng Nginx phục vụ frontend và chuyển tiếp `/api`, `/health` đến backend (`frontend/nginx.selfhost.conf`).

## 2. Phiên đăng nhập và phân quyền

- `/api/auth` xử lý đăng ký, đăng nhập mật khẩu/Google, làm mới phiên, đăng xuất và hồ sơ. `auth.service.ts` băm mật khẩu bằng bcrypt, ký access JWT 15 phút và refresh JWT 7 ngày; hash của refresh token nằm trong bảng `RefreshToken`.
- `auth.controller.ts` trả access token trong JSON và đặt refresh token vào cookie `HttpOnly`. `frontend/src/services/api.ts` giữ access token trong bộ nhớ, tự làm mới khi cần và gửi cookie kèm yêu cầu. `AuthContext` cung cấp user và trạng thái phiên cho cây React.
- `authGuard.ts` kiểm tra Bearer JWT và gắn `req.user`. Các router dữ liệu dùng guard; quyền theo bản ghi được kiểm tra tiếp trong service/repository. `ProtectedRoute` và `AdminRoute` chỉ điều khiển giao diện, không thay thế kiểm tra ở API.
- `classes.policy.ts` quyết định quyền lớp/nhóm/báo cáo theo giảng viên, quản trị lớp, trưởng nhóm và thành viên. `workspaces.policy.ts` quyết định quyền theo vai trò membership, trạng thái và loại workspace. `studyAccess.ts` và `workspaceScope.ts` lọc truy cập công việc và workspace khi đọc/ghi dữ liệu.

## 3. Mô hình dữ liệu đang được cài đặt

Các quan hệ dưới đây xuất phát từ khóa ngoại và thao tác tạo trong `schema.prisma`, `classes.service.ts`, `workspaces.repository.ts`:

```text
User
 ├─ Semester → Subject
 ├─ CourseClass (giảng viên tạo)
 │   ├─ ClassMember (STUDENT hoặc CLASS_ADMIN)
 │   └─ StudyGroup → StudyGroupMember
 │       ├─ Workspace(type=GROUP, owner=trưởng nhóm)
 │       └─ Project(classId, groupId) → ProgressReport
 ├─ Project cá nhân / cộng tác → ProjectMember
 │   └─ Workspace(type=PROJECT, projectId)
 └─ Workspace(type=PERSONAL hoặc SUBJECT)

Note / Task / ScheduleEvent → userId và có thể gắn workspaceId,
                              subjectId hoặc projectId
Task → TaskAssignee; Note/Task → Tag; ResourceShare → tài nguyên được chia sẻ
```

- `CourseClass` do tài khoản `TEACHER` hoặc `ADMIN` tạo. Sinh viên vào lớp bằng mã/UID. Giảng viên hoặc `CLASS_ADMIN` quản lý thành viên và nhóm. Khi tạo nhóm, service tạo cùng lúc `StudyGroup`, thành viên trưởng nhóm và workspace `GROUP` trong một transaction. Thêm/xóa/chuyển trưởng nhóm đồng bộ membership và owner của workspace nhóm.
- Dự án của lớp có `classId` và `groupId`, do quản lý lớp hoặc trưởng nhóm lập. Thành viên nhóm được thêm vào `ProjectMember`. Thành viên nhóm gửi `ProgressReport`; giảng viên đánh giá. Mã hiện tại **không tự tạo workspace riêng cho dự án lớp** khi gọi `classes.service.ts#createProject`.
- Workspace có bốn loại trong enum: `PERSONAL`, `SUBJECT`, `PROJECT`, `GROUP`. `WorkspaceMember` chứa vai trò và trạng thái lời mời. `WorkspacesService` chỉ liệt kê workspace có membership `ACCEPTED`; context trả quyền hiệu lực và capability. Workspace `PERSONAL` giới hạn một bản ghi cho mỗi owner bằng kiểm tra service; workspace `SUBJECT` và `PROJECT` liên kết duy nhất đến bản ghi nguồn.
- `Task` có người tạo/sở hữu (`userId`) và nhiều `TaskAssignee`. Bộ lọc `visibleTasks` cho phép xem việc do mình tạo, được giao, hoặc thuộc nhóm/dự án mình có quyền. Ở workspace `PERSONAL`, danh sách việc tiếp tục lọc về việc do mình tạo hoặc được giao; vì vậy việc từ workspace khác có thể hiện trong danh sách cá nhân, còn bản ghi vẫn giữ liên kết gốc. `Note` và `ScheduleEvent` được lọc theo user hoặc workspace nhóm tùy màn hình/truy vấn.
- Các bảng học kỳ, môn học, ghi chú, công việc, lịch và dự án dùng `deletedAt` để loại bản ghi khỏi phần lớn truy vấn. Quan hệ và điều kiện xóa chi tiết nằm trong Prisma schema.

## 4. Luồng giao diện và API

| Màn hình/luồng | API và dữ liệu chính |
| --- | --- |
| `/workspaces`, nút chọn workspace | `GET /api/workspaces` phân trang, rồi `GET /api/workspaces/:id/context` lấy vai trò. `WorkspaceLayout` giữ workspace đang chọn, lưu ID theo user vào localStorage và truyền context cho các trang. |
| `/classes` | `/api/classes`: tạo/vào lớp, thành viên, nhóm, dự án lớp, báo cáo tiến độ và đánh giá. |
| `/projects` | `/api/projects`: dự án, thành viên và lời mời. Dự án cá nhân có thể gắn workspace PROJECT. |
| `/tasks` | `/api/tasks`: danh sách, tạo/sửa/xóa, đổi trạng thái. Trang truyền `workspaceId`; service xác nhận membership, loại workspace, dự án/môn liên quan và người được giao. |
| `/notes` | `/api/notes`: danh sách, nội dung, ghim/lưu trữ. Ghi chú nhóm được truy vấn theo workspace nhóm; ghi chú cá nhân được giới hạn theo user. |
| `/schedule` | `/api/schedule`: sự kiện và công việc có hạn trong khoảng ngày. Repository ghép hai loại thành lịch chung. |
| `/progress` | Đọc dữ liệu công việc/dự án để tổng hợp trên frontend; tiến độ nhóm/lớp có endpoint riêng ở `/api/workspaces/:id/progress` và `/api/classes/:id/overview`. |
| `/settings`, `/status` | Hồ sơ, sao lưu và trạng thái; `/status` chỉ được router frontend mở cho admin. |
| `/share/:token` | Trang công khai gọi `/api/shares/public/:token`. Chủ tài nguyên tạo/hủy share note, task hoặc project qua `/api/shares`. |
| Tìm kiếm | `/api/search` tìm note, task, project, lịch trong phạm vi truy cập do service xác định. |

`AppFilterContext` tải `/api/semesters` và `/api/subjects` để lọc theo học kỳ/môn; hai module backend vẫn được sử dụng dù không có trang quản lý học kỳ riêng trong router hiện tại. `WorkspaceLayout` tự tải lại danh sách khi có sự kiện `snote_refresh_workspaces`. Các trang phát sự kiện làm mới tương tự sau thao tác ghi.

## 5. Sao lưu và giới hạn thực tế

`/api/backup/export` tạo JSON từ các bản ghi **thuộc user đang đăng nhập** (semester, subject, project, note, task, tag, event), tính SHA-256 và ghi `BackupRecord`. `/export-markdown` xuất ghi chú dạng Markdown; `/restore` nhập lại dữ liệu theo logic trong `backup.service.ts`. Đây là sao lưu cấp tài khoản, không phải bản dump toàn bộ PostgreSQL hay dữ liệu của tất cả workspace dùng chung.

`workspaces.policy.ts` trả một số capability/quyền như document, review, Gantt. Prisma schema và router hiện tại không có module document riêng; các giá trị đó là metadata quyền cho UI, chưa chứng minh một luồng upload tài liệu hoàn chỉnh.

## 6. Chạy và triển khai từ cấu hình hiện có

- Phát triển: `npm run dev` chạy backend và frontend; `npm run db:setup` sinh Prisma client, migrate và seed. Biến bắt buộc của backend do `backend/src/config/env-schema.ts` kiểm tra: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`. `GOOGLE_CLIENT_ID` là tùy chọn.
- Kiểm tra: `npm run type-check`, `npm run build`, `npm test`. CI trong `.github/workflows/ci.yml` chạy các lệnh này với Node 24.
- Docker tự host: `docker-compose.selfhost.yml` dựng PostgreSQL, backend và frontend. PostgreSQL dùng named volume `postgres_data`; backend chạy `prisma migrate deploy` khi khởi động; frontend chỉ xuất cổng `127.0.0.1:${SNOTE_PORT:-8080}`. `docker-compose.tunnel.yml` thêm Cloudflare Tunnel nếu được bật bằng token. Xóa thư mục source không xóa named volume, nhưng sẽ mất mã và cấu hình cần để build lại image.

## 7. Những khác biệt quan trọng so với mô hình mong muốn

Mã hiện tại có lớp → nhóm → dự án của lớp; workspace `GROUP` được tạo cùng nhóm. Dự án cá nhân và nhóm đều có thể là không gian làm việc, nhưng dự án thuộc lớp vẫn là thực thể con của nhóm và chưa có workspace riêng được tạo tự động. Công việc được giao từ các nơi khác được **hiển thị** trong phạm vi cá nhân qua bộ lọc, không được sao chép/chuyển thành bản ghi mới trong workspace cá nhân. Các điểm này phải được thay đổi bằng code nếu muốn mô hình dữ liệu khác.
