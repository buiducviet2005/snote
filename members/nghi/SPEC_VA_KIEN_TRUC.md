# ĐẶC TẢ KỸ THUẬT & KIẾN TRÚC: PHÂN HỆ 1 (DÀNH CHO NGHI)
> **Tài liệu hướng dẫn chi tiết về Data Model, API và Giao diện**

---

## 1. MÔ HÌNH DỮ LIỆU BẠN QUẢN LÝ (DATA MODEL)

Toàn bộ các bảng này nằm trong `backend/prisma/schema.prisma` và thuộc quyền quản lý của bạn:

```prisma
enum UserRole {
  STUDENT
  TEACHER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum SemesterStatus {
  PLANNED
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum SubjectStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum NoteType {
  LECTURE
  LAB_REPORT
  EXAM_PREP
  PROJECT_LOG
  MEETING_MINUTES
  GENERAL
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model User {
  id           String     @id @default(uuid()) @db.Uuid
  email        String     @unique @db.VarChar(255)
  passwordHash String?    @map("password_hash") @db.VarChar(255)
  googleId     String?    @unique @map("google_id") @db.VarChar(255)
  fullName     String     @map("full_name") @db.VarChar(100)
  avatarUrl    String?    @map("avatar_url")
  timezone     String     @default("Asia/Ho_Chi_Minh") @db.VarChar(50)
  role         UserRole   @default(STUDENT)
  status       UserStatus @default(ACTIVE)
  createdAt    DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt    DateTime?  @map("deleted_at") @db.Timestamptz(6)

  refreshTokens RefreshToken[]
  semesters     Semester[]
  subjects      Subject[]
  notes         Note[]
  tasks         Task[]
  tags          Tag[]
  taskAssignments TaskAssignee[]

  @@map("users")
}

model RefreshToken {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  tokenHash String    @map("token_hash") @db.VarChar(255)
  expiresAt DateTime  @map("expires_at") @db.Timestamptz(6)
  revokedAt DateTime? @map("revoked_at") @db.Timestamptz(6)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("refresh_tokens")
}

model Semester {
  id           String         @id @default(uuid()) @db.Uuid
  userId       String         @map("user_id") @db.Uuid
  name         String         @db.VarChar(100)
  academicYear String         @map("academic_year") @db.VarChar(50)
  startDate    DateTime?      @map("start_date") @db.Date
  endDate      DateTime?      @map("end_date") @db.Date
  status       SemesterStatus @default(ACTIVE)
  isCurrent    Boolean        @default(false) @map("is_current")
  createdAt    DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt    DateTime?      @map("deleted_at") @db.Timestamptz(6)

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  subjects Subject[]

  @@index([userId, deletedAt])
  @@map("semesters")
}

model Subject {
  id         String        @id @default(uuid()) @db.Uuid
  userId     String        @map("user_id") @db.Uuid
  semesterId String        @map("semester_id") @db.Uuid
  name       String        @db.VarChar(150)
  code       String?       @db.VarChar(50)
  credits    Int           @default(3)
  lecturer   String?       @db.VarChar(100)
  color      String?       @default("#3b82f6") @db.VarChar(20)
  status     SubjectStatus @default(ACTIVE)
  createdAt  DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime      @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt  DateTime?     @map("deleted_at") @db.Timestamptz(6)

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  semester Semester @relation(fields: [semesterId], references: [id], onDelete: Cascade)
  notes    Note[]
  tasks    Task[]

  @@index([userId, semesterId, deletedAt])
  @@map("subjects")
}

model Note {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  subjectId   String?   @map("subject_id") @db.Uuid
  // Ràng buộc mềm (Soft reference): không tạo FK sang project/workspace
  projectId   String?   @map("project_id") @db.Uuid
  workspaceId String?   @map("workspace_id") @db.Uuid
  title       String    @db.VarChar(255)
  content     String    @db.Text
  noteType    NoteType  @default(LECTURE) @map("note_type")
  isPinned    Boolean   @default(false) @map("is_pinned")
  isArchived  Boolean   @default(false) @map("is_archived")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz(6)

  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  subject   Subject?       @relation(fields: [subjectId], references: [id], onDelete: SetNull)
  noteTags  NoteTag[]
  taskLinks TaskNoteLink[]

  @@index([userId, deletedAt])
  @@index([userId, isPinned, deletedAt])
  @@map("notes")
}

model Tag {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  name      String   @db.VarChar(50)
  color     String?  @default("#64748b") @db.VarChar(20)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  noteTags NoteTag[]
  taskTags TaskTag[]

  @@unique([userId, name])
  @@map("tags")
}

model NoteTag {
  noteId String @map("note_id") @db.Uuid
  tagId  String @map("tag_id") @db.Uuid

  note Note @relation(fields: [noteId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([noteId, tagId])
  @@map("note_tags")
}

model Task {
  id          String       @id @default(uuid()) @db.Uuid
  userId      String       @map("user_id") @db.Uuid
  subjectId   String?      @map("subject_id") @db.Uuid
  // Ràng buộc mềm (Soft reference): không tạo FK sang project/workspace
  projectId   String?      @map("project_id") @db.Uuid
  workspaceId String?      @map("workspace_id") @db.Uuid
  title       String       @db.VarChar(255)
  description String?      @db.Text
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?    @map("due_date") @db.Timestamptz(6)
  completedAt DateTime?    @map("completed_at") @db.Timestamptz(6)
  createdAt   DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt   DateTime?    @map("deleted_at") @db.Timestamptz(6)

  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  subject   Subject?       @relation(fields: [subjectId], references: [id], onDelete: SetNull)
  assignees TaskAssignee[]
  taskTags  TaskTag[]
  noteLinks TaskNoteLink[]

  @@index([userId, status, deletedAt])
  @@map("tasks")
}

model TaskTag {
  taskId String @map("task_id") @db.Uuid
  tagId  String @map("tag_id") @db.Uuid

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([taskId, tagId])
  @@map("task_tags")
}

model TaskAssignee {
  taskId     String   @map("task_id") @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  assignedAt DateTime @default(now()) @map("assigned_at") @db.Timestamptz(6)

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([taskId, userId])
  @@map("task_assignees")
}

model TaskNoteLink {
  taskId String @map("task_id") @db.Uuid
  noteId String @map("note_id") @db.Uuid

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  note Note @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@id([taskId, noteId])
  @@map("task_note_links")
}
```

---

## 2. DANH SÁCH API ENDPOINTS BẠN CHỊU TRÁCH NHIỆM

### Auth (`/api/auth`)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/profile`

### Semesters & Subjects (`/api/semesters`, `/api/subjects`)
- `GET /api/semesters`, `POST /api/semesters`, `PUT /api/semesters/:id`, `DELETE /api/semesters/:id`
- `GET /api/subjects`, `POST /api/subjects`, `PUT /api/subjects/:id`, `DELETE /api/subjects/:id`

### Notes (`/api/notes`)
- `GET /api/notes`, `GET /api/notes/:id`, `POST /api/notes`, `PUT /api/notes/:id`, `DELETE /api/notes/:id`
- `PATCH /api/notes/:id/pin`, `PATCH /api/notes/:id/archive`

### Tasks (`/api/tasks`)
- `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `POST /api/tasks/:id/links/notes`
