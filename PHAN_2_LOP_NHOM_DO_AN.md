# PHÂN HỆ 2: QUẢN TRỊ LỚP HỌC, NHÓM & ĐỒ ÁN MÔN HỌC (ACADEMIC COLLABORATION & PROJECT MANAGEMENT)
> **Tỷ lệ phân chia**: Phần 2 trong cấu trúc 4 - 3 - 3 (Bao gồm 3 Modules cốt lõi).  
> **Nguyên tắc độc lập**: Đóng gói hoàn chỉnh thành một Bounded Context hợp tác học thuật độc lập, không phụ thuộc vào Phân hệ 1 (Ghi chú/Task cá nhân) hay Phân hệ 3 (Hạ tầng Workspace/Lập lịch/Chia sẻ).

---

## 1. MỤC TIÊU & TỔNG QUAN PHÂN HỆ
Phân hệ 2 giải quyết toàn bộ bài toán cộng tác học thuật (Academic Collaboration) trong trường đại học, bao gồm không gian lớp học do Giảng viên quản lý, chia nhóm sinh viên làm bài tập lớn/đồ án, quản lý vòng đời đồ án (Project) và quy trình nộp - đánh giá báo cáo tiến độ (Progress Report).

### Danh mục 3 Modules thành phần:
1. **Module 5: Course Classes & Member Roster (Lớp học & Danh sách thành viên)**: Quản lý lớp tín chỉ/học phần do Giảng viên (`TEACHER`) khởi tạo, cơ chế tham gia bằng mã lớp (Enrollment Code), quản trị phân quyền lớp học (`CLASS_ADMIN`, `STUDENT`).
2. **Module 6: Study Groups & Peer Teaming Engine (Nhóm học tập & Phân bổ đội nhóm)**: Thành lập nhóm làm việc trong phạm vi lớp học, phân công Trưởng nhóm (`Group Leader`), quản lý các thành viên trong nhóm, cơ chế bàn giao quyền trưởng nhóm.
3. **Module 7: Projects & Progress Reports (Quản lý Đồ án & Đánh giá Tiến độ)**: Vòng đời đồ án môn học (khởi tạo, phân công thành viên `ProjectMember`), quy trình nộp báo cáo định kỳ (`ProgressReport`: tiến độ %, tóm tắt, khó khăn vướng mắc), và quy trình Giảng viên chấm điểm/nhận xét phản biện.

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU ĐỘC LẬP (DATA MODEL)

Phân hệ 2 quản trị các quan hệ tổ chức học thuật phân cấp: `Lớp học` -> `Nhóm học tập` -> `Đồ án` -> `Báo cáo tiến độ`.  
Các liên kết với Người dùng được thực hiện qua `userId: UUID` (Soft Reference theo Shared Kernel), không import logic hay phụ thuộc bảng biểu của Phân hệ 1 hay 3.

```text
CourseClass (1) ────< (N) ClassMember (N) ────> [User UUID]
     │
     ├────< (N) StudyGroup (1) ────< (N) StudyGroupMember (N) ────> [User UUID]
     │              │
     │              ├──────────────────────┐
     ▼              ▼                      ▼
   Project (1) ─────┴────────────< (N) ProjectMember (N) ────> [User UUID]
     │
     └────< (N) ProgressReport
```

### Chi tiết các thực thể dữ liệu (Prisma Schema):

```prisma
enum ClassMemberRole {
  CLASS_ADMIN
  STUDENT
}

enum ProjectStatus {
  PLANNED
  ACTIVE
  ON_HOLD
  COMPLETED
  ARCHIVED
}

enum ProjectMemberRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum ProjectMemberStatus {
  PENDING
  ACCEPTED
  DECLINED
}

// Lớp tín chỉ môn học do Giảng viên quản lý
model CourseClass {
  id          String    @id @default(uuid()) @db.Uuid
  teacherId   String    @map("teacher_id") @db.Uuid
  name        String    @db.VarChar(150)
  code        String?   @db.VarChar(50)
  term        String?   @db.VarChar(100)
  description String?   @db.Text
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz(6)

  members      ClassMember[]
  groups       StudyGroup[]
  groupMembers StudyGroupMember[]
  projects     Project[]

  @@index([teacherId, deletedAt])
  @@map("course_classes")
}

// Thành viên tham gia lớp học
model ClassMember {
  classId  String          @map("class_id") @db.Uuid
  userId   String          @map("user_id") @db.Uuid
  role     ClassMemberRole @default(STUDENT)
  joinedAt DateTime        @default(now()) @map("joined_at") @db.Timestamptz(6)

  courseClass CourseClass @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@id([classId, userId])
  @@index([userId])
  @@map("class_members")
}

// Nhóm làm bài tập / đồ án trong lớp
model StudyGroup {
  id        String   @id @default(uuid()) @db.Uuid
  classId   String   @map("class_id") @db.Uuid
  leaderId  String   @map("leader_id") @db.Uuid
  name      String   @db.VarChar(150)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  courseClass CourseClass        @relation(fields: [classId], references: [id], onDelete: Cascade)
  members     StudyGroupMember[]
  projects    Project[]

  @@index([classId])
  @@map("study_groups")
}

// Thành viên của nhóm học tập
model StudyGroupMember {
  groupId  String   @map("group_id") @db.Uuid
  classId  String   @map("class_id") @db.Uuid
  userId   String   @map("user_id") @db.Uuid
  joinedAt DateTime @default(now()) @map("joined_at") @db.Timestamptz(6)

  group       StudyGroup  @relation(fields: [groupId], references: [id], onDelete: Cascade)
  courseClass CourseClass @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@id([groupId, userId])
  @@unique([classId, userId]) // 1 sinh viên chỉ thuộc 1 nhóm trong cùng 1 lớp
  @@index([userId])
  @@map("study_group_members")
}

// Đồ án môn học / Dự án học tập
model Project {
  id          String        @id @default(uuid()) @db.Uuid
  userId      String        @map("user_id") @db.Uuid // Người lập dự án
  classId     String?       @map("class_id") @db.Uuid
  groupId     String?       @map("group_id") @db.Uuid
  // Soft Reference học kỳ & môn học (không FK cứng)
  semesterId  String?       @map("semester_id") @db.Uuid
  subjectId   String?       @map("subject_id") @db.Uuid
  name        String        @db.VarChar(150)
  description String?       @db.Text
  status      ProjectStatus @default(ACTIVE)
  startDate   DateTime?     @map("start_date") @db.Date
  dueDate     DateTime?     @map("due_date") @db.Date
  createdAt   DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime      @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt   DateTime?     @map("deleted_at") @db.Timestamptz(6)

  courseClass     CourseClass?     @relation(fields: [classId], references: [id], onDelete: SetNull)
  studyGroup      StudyGroup?      @relation(fields: [groupId], references: [id], onDelete: SetNull)
  members         ProjectMember[]
  progressReports ProgressReport[]

  @@index([userId])
  @@index([classId, groupId])
  @@index([userId, status, deletedAt])
  @@map("projects")
}

// Thành viên đồ án
model ProjectMember {
  id        String              @id @default(uuid()) @db.Uuid
  projectId String              @map("project_id") @db.Uuid
  userId    String              @map("user_id") @db.Uuid
  role      ProjectMemberRole   @default(MEMBER)
  status    ProjectMemberStatus @default(ACCEPTED)
  joinedAt  DateTime            @default(now()) @map("joined_at") @db.Timestamptz(6)

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@index([userId])
  @@map("project_members")
}

// Báo cáo tiến độ định kỳ nộp cho Giảng viên
model ProgressReport {
  id              String    @id @default(uuid()) @db.Uuid
  projectId       String    @map("project_id") @db.Uuid
  submittedById   String    @map("submitted_by_id") @db.Uuid
  progressPercent Int       @map("progress_percent")
  summary         String    @db.Text
  blockers        String?   @db.Text
  reviewScore     Int?      @map("review_score")
  reviewComment   String?   @map("review_comment") @db.Text
  reviewedById    String?   @map("reviewed_by_id") @db.Uuid
  reviewedAt      DateTime? @map("reviewed_at") @db.Timestamptz(6)
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, createdAt])
  @@map("progress_reports")
}
```

---

## 3. DANH SÁCH API CONTRACTS (ENDPOINTS)

### Module 5: Lớp học & Danh sách thành viên (`/api/classes`)
- `GET /api/classes`: Lấy danh sách lớp mà user là giảng viên hoặc thành viên.
- `POST /api/classes`: Tạo lớp học mới (dành cho vai trò `TEACHER` hoặc `ADMIN`).
- `GET /api/classes/:id`: Chi tiết lớp học, bao gồm danh sách nhóm và dự án.
- `PUT /api/classes/:id`: Cập nhật thông tin lớp, mã lớp, mô tả.
- `DELETE /api/classes/:id`: Xóa mềm lớp học (chỉ Teacher sở hữu).
- `POST /api/classes/join`: Sinh viên nhập mã code để ghi danh vào lớp.
- `GET /api/classes/:id/members`: Danh sách sinh viên và trợ giảng trong lớp.
- `POST /api/classes/:id/members`: Thêm sinh viên trực tiếp bằng email.
- `PATCH /api/classes/:id/members/:userId`: Cập nhật vai trò thành viên (`STUDENT` <-> `CLASS_ADMIN`).
- `DELETE /api/classes/:id/members/:userId`: Đuổi thành viên ra khỏi lớp.

### Module 6: Quản lý Nhóm học tập (`/api/classes/:classId/groups`)
- `GET /api/classes/:classId/groups`: Danh sách toàn bộ các nhóm học tập trong lớp.
- `POST /api/classes/:classId/groups`: Tạo nhóm mới và tự động gán người tạo làm Trưởng nhóm (`leaderId`).
- `PUT /api/classes/:classId/groups/:groupId`: Chỉnh sửa tên nhóm hoặc chuyển giao quyền trưởng nhóm (`leaderId`).
- `DELETE /api/classes/:classId/groups/:groupId`: Giải tán nhóm (yêu cầu quyền Giảng viên hoặc Trưởng nhóm).
- `POST /api/classes/:classId/groups/:groupId/members`: Thêm thành viên vào nhóm (kiểm tra ràng buộc duy nhất 1 sinh viên / 1 nhóm trong lớp).
- `DELETE /api/classes/:classId/groups/:groupId/members/:userId`: Xóa sinh viên khỏi nhóm.

### Module 7: Đồ án & Báo cáo tiến độ (`/api/projects`, `/api/classes/:classId/projects`, `/api/classes/:classId/reports`)
- `GET /api/projects`: Danh sách đồ án/dự án của người dùng (lọc theo status, classId).
- `POST /api/projects`: Tạo đồ án mới (tên, mô tả, ngày bắt đầu, deadline, gắn classId/groupId).
- `GET /api/projects/:id`: Chi tiết đồ án và danh sách thành viên `ProjectMember`.
- `PUT /api/projects/:id`: Cập nhật trạng thái đồ án (`PLANNED`, `ACTIVE`, `COMPLETED`...).
- `DELETE /api/projects/:id`: Xóa mềm đồ án.
- `POST /api/projects/:id/members`: Mời/thêm thành viên vào đồ án.
- `GET /api/projects/:id/reports`: Lịch sử các lần nộp báo cáo tiến độ của đồ án.
- `POST /api/projects/:id/reports`: Nhóm sinh viên gửi báo cáo tiến độ mới (progressPercent, summary, blockers).
- `PATCH /api/projects/:id/reports/:reportId/review`: Giảng viên chấm điểm (`reviewScore`: 0-100) và để lại nhận xét (`reviewComment`).
- `GET /api/classes/:classId/overview`: Dashboard tổng hợp ma trận tiến độ toàn bộ các đồ án trong lớp cho giảng viên.

---

## 4. GIAO DIỆN & CẤU TRÚC COMPONENT FRONTEND

Cấu trúc thư mục độc lập trong frontend:
```text
frontend/src/features/
├── classes/
│   ├── components/       # ClassCard, ClassHeader, MemberTable, JoinClassModal, ClassAdminBadge
│   ├── hooks/            # useClasses, useClassMembers, useClassPolicy
│   └── pages/            # ClassesPage, ClassDetailPage, ClassSettingsPage
├── groups/
│   ├── components/       # GroupList, GroupMemberAvatarGroup, AssignLeaderModal, CreateGroupModal
│   └── hooks/            # useStudyGroups
├── projects/
│   ├── components/       # ProjectCard, ProjectTimeline, ProjectMemberModal, ProjectStatusDropdown
│   ├── hooks/            # useProjects, useProjectDetail
│   └── pages/            # ProjectsPage, ProjectDetailPage
└── progress/ (báo cáo tiến độ)
    ├── components/       # ProgressReportModal, ReportHistoryList, ReviewForm, ClassProgressMatrix
    ├── hooks/            # useProgressReports
    └── pages/            # ClassOverviewProgressPage
```

---

## 5. CƠ CHẾ ĐẢM BẢO TÍNH ĐỘC LẬP & KHÔNG ẢNH HƯỞNG (ZERO-COUPLING CONTRACT)

Để người chịu trách nhiệm Phân hệ 2 làm việc hoàn toàn độc lập với Phân hệ 1 và Phân hệ 3:

1. **Ranh giới Người dùng dạng Soft Reference (Identity Kernel)**:
   - Các bảng trong Phân hệ 2 chỉ lưu `userId`, `teacherId`, `leaderId`, `submittedById` dưới dạng UUID chuỗi.
   - Khi chạy độc lập, Phân hệ 2 không cần truy vấn bảng `User` để lấy mật khẩu, token hay cấu hình cá nhân. Tên và avatar người dùng được truyền qua JWT Payload hoặc Mock Identity Provider.
2. **Không phụ thuộc vào Module Notes hay Tasks của Phân hệ 1**:
   - Quá trình quản lý Đồ án và Lớp học hoàn toàn có thể chạy mà không cần một ghi chú hay công việc cá nhân nào tồn tại. Đồ án quản lý tiến độ tổng thể thông qua các bản ghi `ProgressReport` chính thức, không phụ thuộc vào cách từng sinh viên phân rã task vụn vặt ở Phân hệ 1.
3. **Không tự động ép buộc tạo Workspace của Phân hệ 3**:
   - Nhóm và Đồ án tự quản trị thành viên của mình (`StudyGroupMember`, `ProjectMember`).
   - Phân hệ 2 không import `workspaces.service.ts` hay phụ thuộc vào bảng `workspaces`. Nếu Phân hệ 3 chưa được cài đặt hoặc gặp sự cố, sinh viên và giảng viên vẫn vào lớp, lập nhóm, nộp bài và chấm điểm bình thường.
4. **Quy tắc Kiểm thử Độc lập (Independent Test Suite)**:
   - Toàn bộ nghiệp vụ kiểm tra quyền (Policy): Giảng viên chấm điểm, Trưởng nhóm nộp báo cáo, Sinh viên cùng lớp vào nhóm được kiểm thử 100% bằng Unit Test độc lập trên file `classes.policy.ts` và `classes.service.ts` với in-memory mock data.
