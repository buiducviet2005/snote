# Bảng Checklist Nâng cấp Frontend & Trải nghiệm Người dùng (UX) SNOTE

Tài liệu này dùng để theo dõi, ghi nhận và nghiệm thu các hạng mục cải tiến giao diện (UI) và trải nghiệm người dùng (UX) theo bộ kỹ năng thiết kế cao cấp (`design-taste-frontend`, `high-end-visual-design`, `transitions-dev`, `minimalist-ui`) cho dự án **SNOTE**.

---

## 📊 BẢNG TIẾN ĐỘ THỰC THI

| ID | Giai đoạn / Hạng mục | File / Module liên quan | Tiêu chí đạt | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| `FE-01` | **Khởi tạo Checklist & Tài liệu Tri thức AI** | `DOCS/step_5_frontend_enhancement_checklist.md`<br>`DOCS/ai_chat_docs/09_FRONTEND_UX_ENHANCEMENT.md` | Bản đặc tả chi tiết kế hoạch nâng cấp giao diện, design system, theme tokens và UX flow. | [x] |
| `FE-02` | **Nâng cấp Hệ thống CSS, Theme Tokens & Font chữ** | `frontend/index.html`<br>`frontend/src/assets/styles/global.css`<br>`frontend/src/contexts/ThemeContext.tsx` | Nhúng font Plus Jakarta Sans / Inter / JetBrains Mono, hệ thống CSS variables Dark/Light theme, glassmorphism, keyframe animations. | [x] |
| `FE-03` | **Nâng cấp Master Layout, Sidebar & Topbar** | `frontend/src/components/layout/AppLayout.tsx`<br>`frontend/src/components/layout/Sidebar.tsx`<br>`frontend/src/components/layout/Topbar.tsx`<br>`frontend/src/components/common/QuickActionModal.tsx` | Sidebar với biểu tượng Lucide đồng bộ, thanh điều hướng ghim, Topbar context switch, nút đổi theme Dark/Light, modal tạo nhanh (Quick Action). | [x] |
| `FE-04` | **Nâng cấp Authentication UX (Login & Register)** | `frontend/src/features/auth/pages/LoginPage.tsx`<br>`frontend/src/features/auth/pages/RegisterPage.tsx` | Giao diện đăng nhập/đăng ký hiện đại, nút ẩn/hiện mật khẩu, nút tài khoản mẫu thử nghiệm 1-click, banner chào đón sinh viên. | [x] |
| `FE-05` | **Nâng cấp Phân hệ Ghi chú (Notes & Markdown Editor)** | `frontend/src/features/notes/pages/NotesListPage.tsx`<br>`frontend/src/features/notes/components/NoteCard.tsx`<br>`frontend/src/features/notes/components/NoteModal.tsx`<br>`frontend/src/components/common/MarkdownViewer.tsx` | Hiển thị Markdown chuẩn GitHub (`react-markdown` + `remark-gfm`), thanh công cụ định dạng soạn thảo, chế độ xem Lưới/Danh sách, ghim, thời gian đọc ước tính. | [x] |
| `FE-06` | **Nâng cấp Phân hệ Công việc (Kanban & Confetti Celebration)** | `frontend/src/features/tasks/pages/TasksListPage.tsx`<br>`frontend/src/features/tasks/components/TaskCard.tsx`<br>`frontend/src/features/tasks/components/TaskModal.tsx` | Kanban 3 cột trực quan, nút chuyển trạng thái 1-click, badge mức độ khẩn cấp (Urgent pulse), hiệu ứng pháo hoa Confetti khi hoàn thành bài tập. | [x] |
| `FE-07` | **Nâng cấp Thời khóa biểu & Lịch tuần (Schedule & Timetable)** | `frontend/src/features/schedule/pages/ScheduleWeekPage.tsx`<br>`frontend/src/features/schedule/components/EventModal.tsx` | Thời khóa biểu tuần trực quan, thanh điều hướng tuần thông minh, đếm số sự kiện mỗi ngày, phân loại màu sắc lớp học / thi / deadline. | [x] |
| `FE-08` | **Nâng cấp Quản lý Học kỳ, Môn học & Đồ án** | `frontend/src/features/semesters/`<br>`frontend/src/features/projects/` | Thẻ môn học với bộ chọn màu sắc trực quan, thanh tiến độ tín chỉ, danh sách đồ án với thanh tiến độ hoàn thành. | [x] |
| `FE-09` | **Nâng cấp Dashboard Tiến độ & Cài đặt / Sao lưu** | `frontend/src/features/progress/pages/ProgressDashboardPage.tsx`<br>`frontend/src/features/settings/pages/SettingsPage.tsx`<br>`frontend/src/features/status/pages/SystemStatusPage.tsx` | Thẻ Bento số liệu thống kê học tập, phân tích % theo môn, xuất sao lưu JSON kèm SHA-256 Checksum, giám sát độ trễ server real-time. | [x] |
| `FE-10` | **Build & Kiểm thử Toàn diện Monorepo** | `npm run build`<br>`npm run type-check` | Toàn bộ Monorepo build 100% 0 lỗi, giao diện mượt mà và nhất quán. | [x] |

---

## 📝 NHẬT KÝ NGHIỆM THU

- **2026-08-27 14:01**: Đã hoàn thành 100% tất cả 10 hạng mục nâng cấp Frontend UX theo kỹ năng `design-taste-frontend`, `high-end-visual-design`, `transitions-dev` và `minimalist-ui`.
- Đã cài đặt và tích hợp `lucide-react`, `react-markdown`, `remark-gfm`, `canvas-confetti`.
- Toàn bộ Monorepo (Backend + Frontend) biên dịch thành công 0 lỗi với Rollup Code Splitting tối ưu.
