# Kế hoạch Kỹ thuật & Thực thi Bước 5: Triển khai Frontend V1 & Trải nghiệm Người dùng (SNOTE)

---

## 🎯 1. MỤC TIÊU CỦA BƯỚC 5

Xây dựng phiên bản **Frontend V1 hoàn chỉnh** cho ứng dụng **SNOTE**, mang lại trải nghiệm học tập liền mạch cho sinh viên đại học xoay quanh 3 trục chính: **Ghi chú (Notes)**, **Công việc (Tasks)**, và **Lịch trình (Schedule)** trên nền tảng **React 19 + TypeScript + Vite + React Router DOM v7**.

### 🌟 Tiêu chuẩn Trọng tâm:
1. **Trải nghiệm Học tập Tập trung (Context-Aware Workspace):** Cho phép sinh viên lọc toàn bộ ghi chú, công việc và lịch học theo Học kỳ (Semester) và Môn học (Subject) đang chọn.
2. **Tuân thủ Tuyệt đối Ràng buộc Chống "Note Rác":** Form tạo ghi chú và công việc bắt buộc phải gắn với Môn học hoặc Đồ án (`(subjectId || projectId)`).
3. **Bảo mật & Phiên làm việc (Session & Anti-IDOR):** Tích hợp Auth Context, lưu trữ Access Token, tự động chèn `Authorization: Bearer <token>` vào mọi API requests, bảo vệ các routes bằng `ProtectedRoute`.
4. **Giao diện Trực quan & Đồng bộ:** Thiết kế Design System học tập hiện đại, responsive, hỗ trợ Kanban board, Weekly calendar, Markdown viewer và Toast thông báo.

---

## 🏛️ 2. PHÂN RÃ CÁC PHÂN HỆ FRONTEND V1 (FEATURE-BASED ARCHITECTURE)

```text
frontend/src/
├── services/api.ts                   # HTTP Client tự động gắn Auth token & Base URL
├── contexts/
│   ├── AuthContext.tsx               # Quản lý xác thực, đăng nhập, đăng ký, đăng xuất, user state
│   └── AppFilterContext.tsx          # Quản lý bộ lọc ngữ cảnh toàn cục (Active Semester / Subject / Project)
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx             # Master Layout lồng Sidebar, Topbar, Content và Toasts
│   │   ├── Sidebar.tsx               # Navigation menu (Notes, Tasks, Schedule, Progress, Subjects, Projects, Settings)
│   │   ├── Topbar.tsx                # Context selector dropdowns (Học kỳ, Môn học), User profile, Logout
│   │   └── ProtectedRoute.tsx        # Chặn truy cập trái phép khi chưa đăng nhập
│   └── common/
│       ├── Modal.tsx                 # Reusable Modal dialog
│       ├── Toast.tsx                 # Thông báo phản hồi trạng thái (Success / Error)
│       └── LoadingSpinner.tsx        # Hiệu ứng tải trang
└── features/
    ├── auth/                         # Đăng nhập & Đăng ký tài khoản sinh viên
    │   ├── pages/LoginPage.tsx
    │   └── pages/RegisterPage.tsx
    ├── notes/                        # Quản lý Ghi chú bài giảng
    │   ├── components/NoteCard.tsx
    │   ├── components/NoteModal.tsx
    │   └── pages/NotesListPage.tsx
    ├── tasks/                        # Quản lý Công việc & Trạng thái Kanban
    │   ├── components/TaskCard.tsx
    │   ├── components/TaskModal.tsx
    │   └── pages/TasksListPage.tsx
    ├── schedule/                     # Thời khóa biểu tuần & Lịch thi
    │   ├── components/EventModal.tsx
    │   └── pages/ScheduleWeekPage.tsx
    ├── semesters/                    # Quản lý Học kỳ & Môn học
    │   ├── components/SemesterModal.tsx
    │   ├── components/SubjectModal.tsx
    │   └── pages/SemesterOverviewPage.tsx
    ├── projects/                     # Quản lý Đồ án môn học
    │   ├── components/ProjectModal.tsx
    │   └── pages/ProjectsListPage.tsx
    ├── progress/                     # Bảng Tổng quan Tiến độ học tập
    │   └── pages/ProgressDashboardPage.tsx
    ├── settings/                     # Hồ sơ sinh viên & Xuất sao lưu JSON
    │   └── pages/SettingsPage.tsx
    └── status/                       # Giám sát trạng thái Backend & DB
        └── pages/SystemStatusPage.tsx
```

---

## 📋 3. LỘ TRÌNH THỰC THI BƯỚC 5 (EXECUTION MILESTONES)

1. **Giai đoạn 1 (Auth & Shared Client):**
   - Hoàn thiện `frontend/src/services/api.ts` hỗ trợ lưu/đọc token, xử lý refresh cookie.
   - Xây dựng `AuthContext` và các trang `LoginPage`, `RegisterPage`, `ProtectedRoute`.
2. **Giai đoạn 2 (Context Filter & Master Layout):**
   - Xây dựng `AppFilterContext` (quản lý `selectedSemesterId`, `selectedSubjectId`).
   - Nâng cấp `Sidebar.tsx` và `Topbar.tsx` với bộ chọn Context động.
3. **Giai đoạn 3 (Semesters & Subjects Management):**
   - Xây dựng CRUD Học kỳ và Môn học (tín chỉ, giảng viên, mã màu).
4. **Giai đoạn 4 (Notes Feature V1):**
   - Xây dựng danh sách ghi chú, tìm kiếm, lọc theo loại bài giảng, gắn thẻ tags, modal tạo/sửa note có preview markdown.
5. **Giai đoạn 5 (Tasks & Kanban Feature V1):**
   - Xây dựng bảng công việc Kanban 3 cột (Cần làm, Đang làm, Đã xong), cập nhật status, deadline, độ ưu tiên.
6. **Giai đoạn 6 (Schedule Timetable Feature V1):**
   - Xây dựng thời khóa biểu 7 ngày trong tuần, hiển thị lịch học/thi/deadline, modal thêm sự kiện.
7. **Giai đoạn 7 (Projects & Progress Dashboard):**
   - Quản lý đồ án, bảng dashboard thống kê số notes, tỷ lệ hoàn thành tasks, số tín chỉ đang học.
8. **Giai đoạn 8 (Settings & Backup Export):**
   - Thông tin sinh viên, nút 1-click Download Backup JSON kèm SHA-256 Checksum.
9. **Giai đoạn 9 (Build, Type-Check & Verification):**
   - Build toàn bộ Monorepo 0 lỗi, kiểm thử luồng người dùng hoàn chỉnh.
