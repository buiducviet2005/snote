# PHÂN HỆ 3: HẠ TẦNG KHÔNG GIAN LÀM VIỆC, LẬP LỊCH & CHIA SẺ TÀI NGUYÊN (WORKSPACES, UNIFIED SCHEDULING & PLATFORM PLATFORM)
> **Tỷ lệ phân chia**: Phần 3 trong cấu trúc 4 - 3 - 3 (Bao gồm 3 Modules cốt lõi).  
> **Nguyên tắc độc lập**: Đóng gói hoàn chỉnh thành một Bounded Context hạ tầng và tiện ích nền tảng, không phụ thuộc vào logic nội bộ của Phân hệ 1 (Học tập cá nhân) hay Phân hệ 2 (Lớp học/Nhóm/Đồ án).

---

## 1. MỤC TIÊU & TỔNG QUAN PHÂN HỆ
Phân hệ 3 đóng vai trò là hạ tầng điều phối không gian (Spatial Multi-tenancy), quản lý thời gian đồng bộ (Temporal Engine), bảo mật ủy quyền chia sẻ tài nguyên (Access Delegation & Public Links), và sao lưu toàn vẹn hệ thống (Data Integrity & Disaster Recovery).

### Danh mục 3 Modules thành phần:
1. **Module 8: Multi-tenant Workspaces Engine (Đa không gian làm việc)**: Cơ chế cô lập dữ liệu theo 4 loại ngữ cảnh (`PERSONAL`, `SUBJECT`, `PROJECT`, `GROUP`), quản trị phân quyền thành viên không gian làm việc (`WorkspaceRole`: OWNER, MANAGER, MEMBER, VIEWER), quy trình gửi/chấp nhận/từ chối lời mời (`WorkspaceMembershipStatus`).
2. **Module 9: Unified Calendar & Schedule Engine (Lập lịch & Thời gian tập trung)**: Động cơ lịch thời gian thực, quản lý sự kiện (`ScheduleEventType`: Lịch học, Lịch thi, Deadline, Họp nhóm, Sự kiện cá nhân), sự kiện lặp theo chuẩn RRULE (`isRecurring`), tổng hợp lịch trình theo dải ngày (Day/Week/Month).
3. **Module 10: Resource Sharing, Backup & Platform Utilities (Chia sẻ tài nguyên, Sao lưu & Tiện ích)**:
   - **Chia sẻ tài nguyên (`ResourceShare`)**: Phân quyền truy cập đa hình (`NOTE`, `TASK`, `PROJECT`, `COLLECTION`), cấp link công khai qua mã bảo mật `shareToken`, kiểm soát quyền `VIEW` / `EDIT` / `ADMIN` và thời hạn hết hạn (`expiresAt`).
   - **Sao lưu & Phục hồi (`BackupRecord`)**: Xuất dữ liệu JSON nén, xuất Markdown, kiểm tra toàn vẹn mã hóa SHA-256 Checksum, cơ chế phục hồi dữ liệu người dùng khi có sự cố.
   - **Tìm kiếm toàn cục (`Global Search`)**: Tìm kiếm nhanh trên mọi tài nguyên hệ thống theo phạm vi quyền hạn.

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU ĐỘC LẬP (DATA MODEL)

Phân hệ 3 sử dụng mô hình **Đa hình (Polymorphic Delegation)** và **Soft Reference**. Bảng `ResourceShare` trỏ đến tài nguyên bằng cặp `(targetType, targetId: UUID)` mà không cần Foreign Key cứng đến bảng nguồn. Bảng `Workspace` và `ScheduleEvent` lưu các ID ngữ cảnh dưới dạng chuỗi UUID.

```text
Workspace (1) ────< (N) WorkspaceMember (N) ────> [User UUID]
  │
  ├──── (Soft Ref: subjectId / projectId / groupId)
  │
ScheduleEvent ──── (Soft Ref: userId / workspaceId / semesterId)
  │
ResourceShare ──── (Polymorphic: targetType + targetId UUID)
  │
BackupRecord ─────> [User UUID]
```

### Chi tiết các thực thể dữ liệu (Prisma Schema):

```prisma
enum WorkspaceType {
  PERSONAL
  SUBJECT
  PROJECT
  GROUP
}

enum WorkspaceStatus {
  ACTIVE
  ARCHIVED
}

enum WorkspaceRole {
  OWNER
  MANAGER
  MEMBER
  VIEWER
}

enum WorkspaceMembershipStatus {
  PENDING
  ACCEPTED
  DECLINED
  REMOVED
}

enum ScheduleEventType {
  CLASS
  EXAM
  DEADLINE
  GROUP_MEETING
  PERSONAL
}

enum ShareTargetType {
  NOTE
  TASK
  PROJECT
  COLLECTION
}

enum ShareAccessLevel {
  VIEW
  EDIT
  ADMIN
}

// Thực thể Không gian làm việc đa ngữ cảnh
model Workspace {
  id        String          @id @default(uuid()) @db.Uuid
  type      WorkspaceType
  name      String          @db.VarChar(150)
  ownerId   String          @map("owner_id") @db.Uuid
  status    WorkspaceStatus @default(ACTIVE)
  timezone  String          @default("Asia/Ho_Chi_Minh") @db.VarChar(100)
  version   Int             @default(1)
  // Các Soft Reference ngữ cảnh học tập / đồ án (không FK cứng)
  subjectId String?         @unique @map("subject_id") @db.Uuid
  projectId String?         @unique @map("project_id") @db.Uuid
  groupId   String?         @unique @map("group_id") @db.Uuid
  createdAt DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt DateTime?       @map("deleted_at") @db.Timestamptz(6)

  members WorkspaceMember[]

  @@index([ownerId])
  @@index([type, status, deletedAt])
  @@map("workspaces")
}

// Quản trị thành viên và quyền hạn trong Workspace
model WorkspaceMember {
  id          String                    @id @default(uuid()) @db.Uuid
  workspaceId String                    @map("workspace_id") @db.Uuid
  userId      String                    @map("user_id") @db.Uuid
  invitedById String?                   @map("invited_by_id") @db.Uuid
  role        WorkspaceRole             @default(MEMBER)
  status      WorkspaceMembershipStatus @default(PENDING)
  version     Int                       @default(1)
  invitedAt   DateTime                  @default(now()) @map("invited_at") @db.Timestamptz(6)
  expiresAt   DateTime?                 @map("expires_at") @db.Timestamptz(6)
  joinedAt    DateTime?                 @map("joined_at") @db.Timestamptz(6)
  createdAt   DateTime                  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime                  @updatedAt @map("updated_at") @db.Timestamptz(6)

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@index([userId, status])
  @@index([workspaceId, status])
  @@map("workspace_members")
}

// Động cơ sự kiện lịch & thời gian tập trung
model ScheduleEvent {
  id             String            @id @default(uuid()) @db.Uuid
  userId         String            @map("user_id") @db.Uuid
  workspaceId    String?           @map("workspace_id") @db.Uuid
  semesterId     String?           @map("semester_id") @db.Uuid
  subjectId      String?           @map("subject_id") @db.Uuid
  projectId      String?           @map("project_id") @db.Uuid
  title          String            @db.VarChar(150)
  location       String?           @db.VarChar(150)
  eventType      ScheduleEventType @default(PERSONAL) @map("event_type")
  startTime      DateTime          @map("start_time") @db.Timestamptz(6)
  endTime        DateTime          @map("end_time") @db.Timestamptz(6)
  isRecurring    Boolean           @default(false) @map("is_recurring")
  recurrenceRule String?           @map("recurrence_rule") @db.VarChar(100)
  createdAt      DateTime          @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime          @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt      DateTime?         @map("deleted_at") @db.Timestamptz(6)

  @@index([userId, deletedAt])
  @@index([startTime, endTime])
  @@index([workspaceId, deletedAt])
  @@map("schedule_events")
}

// Bảng chia sẻ tài nguyên đa hình & cấp phép link công khai
model ResourceShare {
  id               String           @id @default(uuid()) @db.Uuid
  ownerId          String           @map("owner_id") @db.Uuid
  targetType       ShareTargetType  @map("target_type")
  targetId         String           @map("target_id") @db.Uuid // UUID của note, task, project
  sharedWithUserId String?          @map("shared_with_user_id") @db.Uuid
  sharedWithEmail  String?          @map("shared_with_email") @db.VarChar(255)
  accessLevel      ShareAccessLevel @default(VIEW) @map("access_level")
  shareToken       String?          @unique @map("share_token") @db.VarChar(64)
  isPublic         Boolean          @default(false) @map("is_public")
  expiresAt        DateTime?        @map("expires_at") @db.Timestamptz(6)
  createdAt        DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([ownerId])
  @@index([sharedWithUserId])
  @@index([targetType, targetId])
  @@index([shareToken])
  @@map("resource_shares")
}

// Bản ghi nhật ký sao lưu an toàn
model BackupRecord {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  fileName  String   @map("file_name") @db.VarChar(255)
  fileSize  Int      @map("file_size")
  checksum  String   @db.VarChar(64)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  @@index([userId])
  @@map("backup_records")
}
```

---

## 3. DANH SÁCH API CONTRACTS (ENDPOINTS)

### Module 8: Quản trị Workspaces (`/api/workspaces`)
- `GET /api/workspaces`: Danh sách workspace mà user có quyền truy cập (kèm phân trang, lọc type).
- `POST /api/workspaces`: Khởi tạo workspace mới (name, type, timezone).
- `GET /api/workspaces/:id`: Thông tin chi tiết một workspace.
- `GET /api/workspaces/:id/context`: Trả về quyền hiệu lực (Capabilities) của user trong workspace (canEdit, canManageMembers, canExport).
- `PUT /api/workspaces/:id`: Cập nhật tên hoặc múi giờ của workspace.
- `DELETE /api/workspaces/:id`: Lưu trữ/xóa mềm workspace.
- `GET /api/workspaces/:id/members`: Danh sách thành viên và trạng thái lời mời.
- `POST /api/workspaces/:id/members`: Mời thành viên mới tham gia bằng email.
- `PATCH /api/workspaces/:id/members/:userId`: Cập nhật vai trò (`MANAGER`, `MEMBER`, `VIEWER`).
- `DELETE /api/workspaces/:id/members/:userId`: Xóa quyền thành viên khỏi workspace.
- `POST /api/workspaces/invitations/:id/accept`: Chấp nhận lời mời tham gia workspace.
- `POST /api/workspaces/invitations/:id/decline`: Từ chối lời mời tham gia.

### Module 9: Lịch tập trung & Quản lý thời gian (`/api/schedule`)
- `GET /api/schedule`: Lấy danh sách toàn bộ sự kiện lịch và các công việc có hạn chót trong khoảng ngày (`from`, `to`), hỗ trợ lọc theo `workspaceId` hoặc `eventType`.
- `POST /api/schedule/events`: Tạo sự kiện lịch mới (title, location, startTime, endTime, eventType, recurrenceRule).
- `PUT /api/schedule/events/:id`: Cập nhật thông tin sự kiện lịch.
- `DELETE /api/schedule/events/:id`: Xóa sự kiện lịch.
- `GET /api/schedule/upcoming`: Lấy các sự kiện và deadline quan trọng sắp diễn ra trong 7 ngày tới.

### Module 10: Chia sẻ tài nguyên, Sao lưu & Tiện ích (`/api/shares`, `/api/backup`, `/api/search`)
- `POST /api/shares`: Tạo liên kết chia sẻ tài nguyên (chỉ định targetType, targetId, accessLevel, isPublic, expiresAt).
- `GET /api/shares/my-shares`: Danh sách các tài nguyên mà user hiện tại đang chia sẻ cho người khác.
- `GET /api/shares/shared-with-me`: Danh sách tài nguyên người khác chia sẻ cho user hiện tại.
- `DELETE /api/shares/:id`: Thu hồi quyền chia sẻ.
- `GET /api/shares/public/:token`: Endpoint công khai (Public Link) cho phép xem nội dung tài nguyên không cần đăng nhập nếu có token hợp lệ.
- `GET /api/backup/export`: Xuất gói sao lưu JSON toàn diện của tài khoản cá nhân, đính kèm mã SHA-256 Checksum.
- `GET /api/backup/export-markdown`: Xuất toàn bộ tài liệu dưới định dạng tệp Markdown (.zip).
- `POST /api/backup/restore`: Nhập lại file JSON sao lưu để phục hồi dữ liệu người dùng.
- `GET /api/search`: Tìm kiếm toàn diện theo từ khóa, lọc theo targetType và phạm vi workspace.

---

## 4. GIAO DIỆN & CẤU TRÚC COMPONENT FRONTEND

Cấu trúc thư mục độc lập trong frontend:
```text
frontend/src/
├── workspaces/
│   ├── components/       # WorkspaceSelector, WorkspaceModal, MemberInviteList, RoleBadge
│   ├── context/          # WorkspaceContext, WorkspaceLayout
│   └── hooks/            # useWorkspaces, useWorkspaceContext
├── features/
│   ├── schedule/
│   │   ├── components/   # CalendarMonthView, CalendarWeekView, EventModal, UpcomingWidget
│   │   ├── hooks/        # useSchedule, useCalendarNavigation
│   │   └── pages/        # SchedulePage
│   ├── shares/
│   │   ├── components/   # ShareModal, AccessLevelSelect, PublicLinkCard, SharedResourceList
│   │   ├── hooks/        # useResourceShares
│   │   └── pages/        # PublicShareViewPage
│   └── settings/ (sao lưu & cấu hình)
│       ├── components/   # BackupExportCard, RestoreUploadModal, ChecksumVerifier
│       └── pages/        # SettingsPage, StatusPage
```

---

## 5. CƠ CHẾ ĐẢM BẢO TÍNH ĐỘC LẬP & KHÔNG ẢNH HƯỞNG (ZERO-COUPLING CONTRACT)

Để người chịu trách nhiệm Phân hệ 3 làm việc hoàn toàn độc lập với Phân hệ 1 và Phân hệ 2:

1. **Mô hình Ủy quyền Đa hình (Polymorphic Soft Reference)**:
   - Module `shares` không tạo bất kỳ foreign key nào đến bảng `notes`, `tasks` hay `projects`. Nó lưu `targetId: UUID` và `targetType`. Khi render nội dung chia sẻ, nó chỉ gọi qua Contract Interface hoặc trả dữ liệu thô. Nếu một note hay task bị xóa, bản ghi share hết hiệu lực thông qua cơ chế Soft Check.
2. **Động cơ Lịch thuần túy (Time-Range Query Engine)**:
   - Module `schedule` tự quản lý bảng `ScheduleEvent` với thời gian bắt đầu và kết thúc (`startTime`, `endTime`).
   - Lập trình viên Phân hệ 3 có thể phát triển và kiểm thử toàn bộ giao diện Lịch tháng / Lịch tuần / Sự kiện lặp RRULE mà không cần Phân hệ 1 hay 2 phải chạy. Khi tích hợp deadline của Task, schedule service chỉ cần đọc một Contract DTO dạng `{ id: string, title: string, dueDate: Date }` mà không cần biết logic nội bộ của Task.
3. **Cô lập Không gian làm việc (Workspace Scoping Adapter)**:
   - Workspace chỉ nắm giữ membership và metadata phân quyền. Mọi quyền truy cập được tính toán dựa trên `workspaces.policy.ts` độc lập.
   - Các bảng khác có gắn `workspaceId` chỉ dùng `workspaceId` như một nhãn phân vùng (Tenant Tag). Nếu không có Workspace, các tính năng của Phân hệ 1 và 2 vẫn chạy ở chế độ Cá nhân mặc định (`PERSONAL`).
4. **Quy tắc Kiểm thử Độc lập (Independent Test Suite)**:
   - Bộ test của Phân hệ 3 kiểm thử hoàn toàn độc lập: Cấp phát token ngẫu nhiên cho link chia sẻ, kiểm tra hết hạn thời gian `expiresAt`, thuật toán tính hash SHA-256 khi sao lưu và thuật toán tính chu kỳ lặp sự kiện (Recurrence Rule).
