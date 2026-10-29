# PHÂN HỆ 1: QUẢN TRỊ ĐỊNH DANH & HỌC TẬP CÁ NHÂN (CORE IDENTITY & PERSONAL ACADEMIC)
> **Tỷ lệ phân chia**: Phần 1 trong cấu trúc 4 - 3 - 3 (Bao gồm 4 Modules cốt lõi).  
> **Nguyên tắc độc lập**: Đóng gói hoàn chỉnh thành một Bounded Context độc lập, không phụ thuộc vào Phân hệ 2 (Lớp/Nhóm/Đồ án) hay Phân hệ 3 (Workspace/Lịch/Chia sẻ).

---

## 1. MỤC TIÊU & TỔNG QUAN PHÂN HỆ
Phân hệ 1 tập trung toàn bộ vào trải nghiệm tự học và quản lý tri thức cá nhân của sinh viên. Đây là nền tảng phục vụ một cá nhân độc lập mà không cần phải tham gia vào bất kỳ lớp học, nhóm hay dự án cộng tác nào.

### Danh mục 4 Modules thành phần:
1. **Module 1: Authentication & User Profile (Xác thực & Hồ sơ)**: Quản lý định danh, đăng ký, đăng nhập mật khẩu/Google OAuth2, cấp phát và thu hồi JWT/Refresh Token, phân quyền RBAC hệ thống (STUDENT, TEACHER, ADMIN).
2. **Module 2: Semesters & Academic Subjects (Học kỳ & Môn học)**: Quản trị niên khóa học kỳ (Semester), môn học theo học kỳ (Subject), số tín chỉ, giảng viên, mã môn, trạng thái học tập.
3. **Module 3: Notes & Knowledge Management (Ghi chú & Quản lý tri thức)**: Soạn thảo ghi chú bài giảng (Note), phân loại theo ngữ cảnh học tập (`NoteType`), hệ thống gắn nhãn tự do (`Tag`), ghim (`isPinned`), lưu trữ (`isArchived`).
4. **Module 4: Personal Tasks & Todo Engine (Công việc & Năng suất cá nhân)**: Quản lý danh sách việc cần làm (Task), phân loại ưu tiên (`TaskPriority`), trạng thái (`TaskStatus`), deadline, ghi nhận thời gian hoàn thành.

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU ĐỘC LẬP (DATA MODEL)

Phân hệ 1 tự chủ hoàn toàn về mặt dữ liệu. Các bảng thuộc phân hệ này không tạo ràng buộc khóa ngoại cứng (Foreign Key Constraint) trỏ sang bảng của Phân hệ 2 hay Phân hệ 3. Mọi liên kết ngoại vi chỉ lưu dưới dạng Soft Reference (`UUID` có thể null).

```text
User (1) ────< (N) RefreshToken
  │
  ├────< (N) Semester (1) ────< (N) Subject
  │                                   │
  ├────< (N) Note (1) ────< (N) NoteTag >──── (N) Tag
  │           │                                   │
  │           └───────────┐                       │
  │                       ▼                       │
  └────< (N) Task (1) ────< (N) TaskNoteLink      │
              │                                   │
              ├───────────< (N) TaskTag >─────────┘
              └───────────< (N) TaskAssignee
```

### Chi tiết các thực thể dữ liệu (Prisma Schema):

```prisma
// Enum trạng thái người dùng & phân quyền
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

// Bảng người dùng trung tâm
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
  // Soft Reference sang hệ thống ngoài (không tạo FK Prisma)
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
  // Soft Reference sang hệ thống ngoài (không tạo FK Prisma)
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

## 3. DANH SÁCH API CONTRACTS (ENDPOINTS)

### Module 1: Xác thực & Người dùng (`/api/auth`)
- `POST /api/auth/register`: Đăng ký tài khoản sinh viên mới (email, password, fullName).
- `POST /api/auth/login`: Xác thực mật khẩu, trả access token (JWT 15m), set refresh token vào `HttpOnly` Cookie.
- `POST /api/auth/google`: Đăng nhập/Đăng ký tự động bằng Google ID token.
- `POST /api/auth/refresh`: Cấp mới access token từ refresh token hợp lệ trong cookie.
- `POST /api/auth/logout`: Thu hồi token hiện tại, xóa cookie.
- `GET /api/auth/me`: Lấy thông tin user đăng nhập hiện tại và vai trò hệ thống.
- `PUT /api/auth/profile`: Cập nhật họ tên, avatar URL, múi giờ.

### Module 2: Học kỳ & Môn học (`/api/semesters`, `/api/subjects`)
- `GET /api/semesters`: Danh sách học kỳ của người dùng (hỗ trợ lọc status, isCurrent).
- `POST /api/semesters`: Tạo học kỳ mới (name, academicYear, startDate, endDate).
- `PUT /api/semesters/:id`: Chỉnh sửa học kỳ, đánh dấu học kỳ hiện tại (`isCurrent`).
- `DELETE /api/semesters/:id`: Xóa mềm học kỳ.
- `GET /api/subjects`: Danh sách môn học (lọc theo semesterId, status).
- `POST /api/subjects`: Tạo môn học (name, code, credits, lecturer, color, semesterId).
- `PUT /api/subjects/:id`: Chỉnh sửa môn học.
- `DELETE /api/subjects/:id`: Xóa mềm môn học.

### Module 3: Ghi chú cá nhân (`/api/notes`)
- `GET /api/notes`: Lấy danh sách ghi chú (hỗ trợ tìm kiếm từ khóa, lọc theo subjectId, noteType, tagId, isPinned, phân trang).
- `GET /api/notes/:id`: Đọc chi tiết nội dung ghi chú.
- `POST /api/notes`: Tạo ghi chú mới (title, content, subjectId, noteType, tagIds).
- `PUT /api/notes/:id`: Chỉnh sửa tiêu đề, nội dung ghi chú, gắn thẻ.
- `PATCH /api/notes/:id/pin`: Bật/tắt ghim ghi chú lên đầu.
- `PATCH /api/notes/:id/archive`: Lưu trữ hoặc hủy lưu trữ ghi chú.
- `DELETE /api/notes/:id`: Xóa mềm ghi chú.

### Module 4: Quản lý công việc cá nhân (`/api/tasks`)
- `GET /api/tasks`: Lấy danh sách công việc (lọc theo status, priority, subjectId, dueDate).
- `POST /api/tasks`: Tạo công việc cá nhân (title, description, priority, dueDate, subjectId).
- `PUT /api/tasks/:id`: Cập nhật chi tiết công việc.
- `PATCH /api/tasks/:id/status`: Đổi trạng thái (`TODO` -> `IN_PROGRESS` -> `DONE` -> `CANCELLED`), tự động ghi nhận `completedAt`.
- `DELETE /api/tasks/:id`: Xóa mềm công việc.
- `POST /api/tasks/:id/links/notes`: Liên kết công việc với một ghi chú học tập.

---

## 4. GIAO DIỆN & CẤU TRÚC COMPONENT FRONTEND

Cấu trúc thư mục độc lập trong frontend:
```text
frontend/src/features/
├── auth/
│   ├── components/       # LoginForm, RegisterForm, GoogleAuthButton
│   ├── hooks/            # useAuth, useSession
│   └── pages/            # LoginPage, RegisterPage, ProfilePage
├── notes/
│   ├── components/       # NoteEditor, NoteCard, NoteList, TagSelector, NoteFilter
│   ├── hooks/            # useNotes, useNoteTags
│   └── pages/            # NotesPage, NoteDetailPage
├── tasks/
│   ├── components/       # TaskBoard, TaskTable, TaskFormModal, TaskStatusBadge
│   ├── hooks/            # useTasks, useTaskFilter
│   └── pages/            # TasksPage
└── academic/ (semesters & subjects)
    ├── components/       # SemesterSelect, SubjectBadge, SubjectManagerModal
    └── hooks/            # useAcademicContext
```

---

## 5. CƠ CHẾ ĐẢM BẢO TÍNH ĐỘC LẬP & KHÔNG ẢNH HƯỞNG (ZERO-COUPLING CONTRACT)

Để người chịu trách nhiệm Phân hệ 1 phát triển và kiểm thử mà **hoàn toàn không bị ảnh hưởng và không làm ảnh hưởng đến Phân hệ 2 và Phân hệ 3**:

1. **Ranh giới Soft Reference (Không Khóa Ngoại Sang Context Khác)**:
   - Các trường `projectId` và `workspaceId` trong bảng `Note` và `Task` là các trường UUID thông thường, **không có `@relation` ràng buộc khóa ngoại** đến bảng `Project` hay `Workspace`.
   - Phân hệ 1 coi `projectId` hay `workspaceId` chỉ là một mã định danh ngữ cảnh (Context Tag/UUID). Phân hệ 1 không cần biết bảng `Project` hay `Workspace` có tồn tại hay không.
2. **Khởi chạy độc lập (Standalone Development & Testing)**:
   - Một lập trình viên có thể dựng riêng database chỉ gồm các bảng của Phân hệ 1, chạy backend chỉ gắn router `authRoutes`, `semesterRoutes`, `subjectRoutes`, `noteRoutes`, `taskRoutes`.
   - Hệ thống hoạt động trơn tru như một ứng dụng Todo & Note-taking cá nhân hoàn chỉnh.
3. **Không import chéo Service của Phân hệ 2 hoặc 3**:
   - `notes.service.ts` và `tasks.service.ts` chỉ tương tác với cơ sở dữ liệu qua Prisma của các bảng nội bộ (`notes`, `tasks`, `tags`, `subjects`). Không gọi bất kỳ hàm nào từ `classes.service.ts` hay `workspaces.service.ts`.
4. **Kiểm thử độc lập (Independent Test Suite)**:
   - Bộ unit test và integration test của Phân hệ 1 chạy độc lập 100% bằng cách mock `req.user` mà không cần quan tâm lớp học, nhóm hay lịch trình có dữ liệu hay không.
