# Bảng Checklist Thực thi Bước 5: Triển khai Frontend V1 & UX Hoàn chỉnh (SNOTE)

Tài liệu này dùng để quản lý tiến độ, ghi nhận nhật ký và nghiệm thu từng tác vụ trong **Bước 5 lớn: Triển khai Frontend V1 & UX cho sinh viên** của dự án **SNOTE**.

---

## 📊 BẢNG TIẾN ĐỘ THỰC THI BƯỚC 5

| ID | Giai đoạn / Cụm công việc | File / Lệnh liên quan | Tiêu chí đạt | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| `B5-01` | **Tạo tài liệu kế hoạch kỹ thuật & tri thức AI** | `DOCS/step_5_plan.md`<br>`DOCS/ai_chat_docs/08_STEP_5_EXECUTION_PLAN.md` | Bản đặc tả chi tiết 9 giai đoạn, data flow và giao diện người dùng sinh viên. | [x] |
| `B5-02` | **Nâng cấp API Client & Authentication Layer** | `frontend/src/services/api.ts`<br>`frontend/src/contexts/AuthContext.tsx`<br>`frontend/src/features/auth/` | Lưu token `snote_token`, tự động gắn Bearer header, đăng nhập, đăng ký, đăng xuất, bảo vệ routes qua `ProtectedRoute`. | [x] |
| `B5-03` | **Xây dựng Global Filter Context & Reusable Components** | `frontend/src/contexts/AppFilterContext.tsx`<br>`frontend/src/components/common/` | Context quản lý học kỳ/môn học đang chọn; Modal, Toast, Badge, EmptyState dùng chung. | [x] |
| `B5-04` | **Nâng cấp Master Layout & Navigation** | `frontend/src/components/layout/AppLayout.tsx`<br>`frontend/src/components/layout/Sidebar.tsx`<br>`frontend/src/components/layout/Topbar.tsx` | Menu điều hướng 8 mục, topbar có bộ chọn học kỳ/môn học động và avatar sinh viên. | [x] |
| `B5-05` | **Triển khai Module Semesters & Subjects V1** | `frontend/src/features/semesters/` | Danh sách học kỳ (`isCurrent`), danh sách môn học theo học kỳ, modal tạo/sửa môn học (tín chỉ, giảng viên, màu). | [x] |
| `B5-06` | **Triển khai Module Notes V1 (Rich Notes & Filters)** | `frontend/src/features/notes/` | Danh sách note dạng lưới/card, lọc theo môn, tìm kiếm, tab ghim (pinned), modal tạo/sửa note có preview markdown. | [x] |
| `B5-07` | **Triển khai Module Tasks V1 (Kanban Board & Priority)** | `frontend/src/features/tasks/` | Bảng Kanban 3 cột (TODO / IN_PROGRESS / DONE), chuyển trạng thái tức thì, badge mức độ ưu tiên, deadline, modal tạo task. | [x] |
| `B5-08` | **Triển khai Module Schedule V1 (Weekly Timetable)** | `frontend/src/features/schedule/` | Thời khóa biểu tuần 7 ngày, phân loại lớp học / lịch thi / deadline, modal thêm sự kiện lịch. | [x] |
| `B5-09` | **Triển khai Module Projects & Progress Dashboard V1** | `frontend/src/features/projects/`<br>`frontend/src/features/progress/` | Quản lý đồ án; Dashboard tổng kết số notes, tỷ lệ hoàn thành tasks, số tín chỉ tích lũy. | [x] |
| `B5-10` | **Triển khai Module Settings & Backup Export** | `frontend/src/features/settings/` | Hồ sơ sinh viên, nút 1-click Xuất toàn bộ dữ liệu ra file JSON đính kèm SHA-256 Checksum. | [x] |
| `B5-11` | **Tối ưu Hóa Giao diện, Build & Kiểm thử Toàn diện** | `npm run build`<br>`npm run type-check` | Toàn bộ Monorepo build 100% 0 lỗi, kiểm thử luồng người dùng hoàn tất. | [x] |

---

## 📝 NHẬT KÝ THỰC THI (EXECUTION LOGS)

- **2026-08-27 08:16**: Khởi tạo kế hoạch kỹ thuật `DOCS/step_5_plan.md`, `DOCS/ai_chat_docs/08_STEP_5_EXECUTION_PLAN.md` và `DOCS/step_5_checklist.md`.
- **2026-08-27 08:17**: Triển khai `api.ts` hỗ trợ Bearer Auth, HTTP credentials và blob download; triển khai `AuthContext`, `ProtectedRoute`, `LoginPage`, `RegisterPage`.
- **2026-08-27 08:18**: Xây dựng `AppFilterContext` (quản lý học kỳ / môn học active), `ToastContext` và `Modal` tái sử dụng; hoàn thiện `Sidebar` 8 menu và `Topbar` ngữ cảnh động.
- **2026-08-27 08:19**: Hoàn tất 6 phân hệ lớn:
  1. `features/semesters`: Quản lý học kỳ & môn học (tín chỉ, giảng viên, mã màu).
  2. `features/notes`: Danh sách ghi chú, tìm kiếm, lọc theo môn/loại, ghim (pinned), lưu trữ (archived), modal tạo/sửa note markdown preview.
  3. `features/tasks`: Bảng Kanban 3 cột (TODO, IN_PROGRESS, DONE), lọc ưu tiên, deadline, checkbox chuyển status tức thì.
  4. `features/schedule`: Thời khóa biểu 7 ngày trong tuần, phân loại sự kiện (CLASS, EXAM, DEADLINE, GROUP, PERSONAL).
  5. `features/projects` & `features/progress`: Quản lý đồ án & Dashboard thống kê số note, % hoàn thành bài tập, tín chỉ theo môn.
  6. `features/settings`: Hồ sơ sinh viên & 1-click tải xuống file sao lưu JSON kèm SHA-256 Checksum.
- **2026-08-27 08:21**: Kiểm tra TypeScript type-check (`npm run type-check`) và build production (`npm run build`) thành công 100% không cảnh báo/lỗi.
