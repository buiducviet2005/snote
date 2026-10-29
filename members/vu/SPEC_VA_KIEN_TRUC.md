# ĐẶC TẢ KỸ THUẬT & KIẾN TRÚC: PHÂN HỆ 2 (DÀNH CHO VŨ)
> **Tài liệu hướng dẫn chi tiết về Data Model, API, Giao diện và Kịch bản Demo**

---

## 1. MÔ HÌNH DỮ LIỆU BẠN QUẢN LÝ (DATA MODEL)

Toàn bộ các bảng này nằm trong `backend/prisma/schema.prisma` và thuộc quyền quản lý trực tiếp của bạn:

> **Mô hình phân cấp (đã cập nhật — đồ án NGANG CẤP với nhóm):**
> `Lớp (CourseClass) 1 → n Nhóm (StudyGroup)`
> `Lớp (CourseClass) 1 → n Đồ án (Project)`
> `Đồ án (Project) 1 → n Thành viên (ProjectMember)` và `1 → n Báo cáo (ProgressReport)`.
> Đồ án lớp **không còn nằm trong nhóm**; thành viên đồ án được quản lý trực tiếp qua `ProjectMember`. Cột `Project.groupId` được giữ nullable để tương thích dữ liệu cũ, dự án lớp mới tạo sẽ có `groupId = null`.

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

// Thành viên lớp học
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

// Nhóm học tập trong lớp
model StudyGroup {
  id        String   @id @default(uuid()) @db.Uuid
  classId   String   @map("class_id") @db.Uuid
  leaderId  String   @map("leader_id") @db.Uuid
  name      String   @db.VarChar(150)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  courseClass CourseClass        @relation(fields: [classId], references: [id], onDelete: Cascade)
  members     StudyGroupMember[]

  @@index([classId])
  @@map("study_groups")
}

// Thành viên nhóm học tập (chống tham gia nhiều nhóm trong 1 lớp)
model StudyGroupMember {
  groupId  String   @map("group_id") @db.Uuid
  classId  String   @map("class_id") @db.Uuid
  userId   String   @map("user_id") @db.Uuid
  joinedAt DateTime @default(now()) @map("joined_at") @db.Timestamptz(6)

  group       StudyGroup  @relation(fields: [groupId], references: [id], onDelete: Cascade)
  courseClass CourseClass @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@id([groupId, userId])
  @@unique([classId, userId])
  @@index([userId])
  @@map("study_group_members")
}

// Đồ án môn học
model Project {
  id          String        @id @default(uuid()) @db.Uuid
  userId      String        @map("user_id") @db.Uuid
  classId     String?       @map("class_id") @db.Uuid
  groupId     String?       @map("group_id") @db.Uuid // Legacy: giữ nullable, dự án lớp mới không dùng
  // Soft Reference học kỳ & môn học của Nghi (không FK cứng)
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

// Báo cáo tiến độ định kỳ
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

## 2. DANH SÁCH API ENDPOINTS BẠN CHỊU TRÁCH NHIỆM

### Classes (`/api/classes`)
- `GET /api/classes`: Lấy danh sách lớp của user.
- `POST /api/classes`: Tạo lớp học (dành cho Teacher).
- `GET /api/classes/:id`: Chi tiết lớp, danh sách nhóm, đồ án.
- `PUT /api/classes/:id`: Sửa thông tin lớp.
- `DELETE /api/classes/:id`: Xóa mềm lớp học.
- `POST /api/classes/join`: Sinh viên nhập mã code để ghi danh.
- `GET /api/classes/:id/members`: Danh sách thành viên trong lớp.
- `POST /api/classes/:id/members`: Thêm sinh viên bằng email.
- `PATCH /api/classes/:id/members/:userId`: Cập nhật vai trò (`STUDENT` / `CLASS_ADMIN`).
- `DELETE /api/classes/:id/members/:userId`: Xóa thành viên khỏi lớp.

### Groups (`/api/classes/:classId/groups`)
- `GET /api/classes/:classId/groups`: Danh sách nhóm trong lớp.
- `POST /api/classes/:classId/groups`: Tạo nhóm mới, người tạo tự động là Trưởng nhóm (`leaderId`).
- `PUT /api/classes/:classId/groups/:groupId`: Sửa tên nhóm hoặc chuyển giao quyền trưởng nhóm.
- `DELETE /api/classes/:classId/groups/:groupId`: Giải tán nhóm.
- `POST /api/classes/:classId/groups/:groupId/members`: Thêm thành viên vào nhóm.
- `DELETE /api/classes/:classId/groups/:groupId/members/:userId`: Xóa thành viên khỏi nhóm.

### Projects & Reports (`/api/projects`, `/api/classes/:classId/projects`, `/api/classes/:classId/overview`)

**Đồ án lớp (ngang cấp với nhóm):**
- `POST /api/classes/:id/projects`: Tạo đồ án lớp (body: `name`, `description?`, `dueDate?`, `memberIds?` — bỏ trống `memberIds` = gán toàn bộ sinh viên lớp).
- `PUT /api/classes/:id/projects/:projectId`: Cập nhật đồ án lớp (tên, mô tả, hạn nộp, trạng thái).
- `DELETE /api/classes/:id/projects/:projectId`: Xóa mềm đồ án lớp.
- `GET /api/classes/:id/projects/:projectId/reports`: Lịch sử báo cáo tiến độ.
- `POST /api/classes/:id/projects/:projectId/reports`: Thành viên đồ án nộp báo cáo tiến độ (`progressPercent`, `summary`, `blockers`).
- `PUT /api/classes/:id/projects/:projectId/reports/:reportId/review`: Giảng viên chấm điểm (`reviewScore` 0-100) + nhận xét (`reviewComment`).
- `GET /api/classes/:classId/overview`: Ma trận tiến độ tổng quan toàn lớp cho Giảng viên.

**Đồ án độc lập (không thuộc lớp):**
- `GET /api/projects`: Danh sách đồ án.
- `POST /api/projects`: Tạo đồ án mới.
- `GET /api/projects/:id`: Chi tiết đồ án và thành viên.
- `PUT /api/projects/:id`: Cập nhật trạng thái đồ án (`PLANNED`, `ACTIVE`, `COMPLETED`...).
- `DELETE /api/projects/:id`: Xóa mềm đồ án.

**Thành viên đồ án (dùng chung cho cả đồ án lớp và độc lập):**
- `POST /api/projects/:id/members`: Mời/thêm thành viên (`emailOrUserId`, `role`).
- `PUT /api/projects/:id/members/:memberUserId`: Đổi vai trò thành viên (`OWNER` / `ADMIN` / `MEMBER` / `VIEWER`).
- `DELETE /api/projects/:id/members/:memberUserId`: Xóa thành viên hoặc tự rời khỏi đồ án.
- `GET /api/projects/invitations` + `POST /api/projects/:id/invitations/accept|decline`: Xử lý lời mời đồ án độc lập.

---

## 3. KỊCH BẢN DEMO LIVE KHI THUYẾT TRÌNH CỦA VŨ

Chuẩn bị sẵn 2 tài khoản trên 2 tab trình duyệt:
1. **Tab 1: Trình duyệt ẩn danh (Tài khoản Giảng viên)**:
   - Tạo lớp môn học: "Công nghệ phần mềm - HK2".
   - Vào tab **"Đồ án lớp"** → tạo đồ án, chọn thành viên (hoặc gán cả lớp).
   - Mở màn hình `/classes/:id/overview` để chuẩn bị xem tiến độ.
2. **Tab 2: Trình duyệt thường (Tài khoản Sinh viên)**:
   - Nhập mã vào lớp thành công.
   - (Tùy chọn) Tạo nhóm "Nhóm 01 - SNOTE" và thêm thành viên.
   - Mở đồ án lớp được giao, gửi **Báo cáo tiến độ tuần 3**: `Tiến độ: 75%`, `Summary: Đã xong API và Database`, `Blockers: Chưa tối ưu UI mobile`.
3. **Quay lại Tab 1 (Giảng viên)**:
   - Nhấn F5: Ma trận tiến độ lập tức hiện Báo cáo tuần 3.
   - Nhấn "Đánh giá": Cho `90 điểm`, ghi nhận xét: *"Tiến độ tốt, cần bổ sung responsive"*.
   - Màn hình hiển thị điểm số và mộc thời gian ngay lập tức.
👉 **Kết quả**: Cả hội đồng nhìn thấy luồng tương tác thực tế sống động trong 2 phút mà bạn không cần phải giải thích lý thuyết dài dòng.
