# ĐẶC TẢ KỸ THUẬT & KIẾN TRÚC: PHÂN HỆ 3 (DÀNH CHO VIỆT)
> **Tài liệu hướng dẫn chi tiết về Data Model, API và Giao diện**

---

## 1. MÔ HÌNH DỮ LIỆU BẠN QUẢN LÝ (DATA MODEL)

Toàn bộ các bảng này nằm trong `backend/prisma/schema.prisma` và thuộc quyền quản lý của bạn:

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

// Bảng Không gian làm việc
model Workspace {
  id        String          @id @default(uuid()) @db.Uuid
  type      WorkspaceType
  name      String          @db.VarChar(150)
  ownerId   String          @map("owner_id") @db.Uuid
  status    WorkspaceStatus @default(ACTIVE)
  timezone  String          @default("Asia/Ho_Chi_Minh") @db.VarChar(100)
  version   Int             @default(1)
  // Các Soft Reference ngữ cảnh học tập / đồ án (lưu UUID, không FK cứng)
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

// Thành viên và phân quyền trong Workspace
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

// Lập lịch & Quản lý thời gian
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

// Chia sẻ tài nguyên đa hình & mã hóa liên kết
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

// Nhật ký sao lưu & kiểm tra toàn vẹn
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

## 2. DANH SÁCH API ENDPOINTS BẠN CHỊU TRÁCH NHIỆM

### Workspaces (`/api/workspaces`)
- `GET /api/workspaces`
- `POST /api/workspaces`
- `GET /api/workspaces/:id`
- `GET /api/workspaces/:id/context`
- `PUT /api/workspaces/:id`
- `DELETE /api/workspaces/:id`
- `GET /api/workspaces/:id/members`
- `POST /api/workspaces/:id/members`
- `PATCH /api/workspaces/:id/members/:userId`
- `DELETE /api/workspaces/:id/members/:userId`
- `POST /api/workspaces/invitations/:id/accept`
- `POST /api/workspaces/invitations/:id/decline`

### Schedule (`/api/schedule`)
- `GET /api/schedule`
- `POST /api/schedule/events`
- `PUT /api/schedule/events/:id`
- `DELETE /api/schedule/events/:id`
- `GET /api/schedule/upcoming`

### Shares, Backup & Search (`/api/shares`, `/api/backup`, `/api/search`)
- `POST /api/shares`
- `GET /api/shares/my-shares`
- `GET /api/shares/shared-with-me`
- `DELETE /api/shares/:id`
- `GET /api/shares/public/:token`
- `GET /api/backup/export`
- `GET /api/backup/export-markdown`
- `POST /api/backup/restore`
- `GET /api/search`
