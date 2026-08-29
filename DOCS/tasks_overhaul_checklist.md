# CHECKLIST TÁI THIẾT KẾ PHÂN HỆ CÔNG VIỆC (TASKS) THEO THÓI QUEN NGƯỜI DÙNG (SNOTE)

| ID | Nhiệm vụ kỹ thuật | File liên quan | Trạng thái | Tiêu chí nghiệm thu |
| :---: | :--- | :--- | :---: | :--- |
| **T-01** | Khởi tạo checklist và tài liệu nghiên cứu thói quen người dùng | `DOCS/tasks_overhaul_checklist.md` | [x] | Tuân thủ Điều 6 & Điều 7 RULES.md |
| **T-02** | Xây dựng Component `QuickTaskBar.tsx` (Thanh tạo việc nhanh 1-Click đầu trang) | `frontend/src/features/tasks/components/QuickTaskBar.tsx` | [x] | Input nhanh + Chọn môn học + Hạn chót + Mức ưu tiên + Phím tắt Enter |
| **T-03** | Xây dựng Component `TasksListView.tsx` (Góc nhìn Danh sách phân nhóm Hạn chót) | `frontend/src/features/tasks/components/TasksListView.tsx` | [x] | Nhóm thông minh: Quá hạn (Overdue), Hôm nay (Today), Sắp tới (Upcoming), Đã hoàn thành (Done) |
| **T-04** | Xây dựng Component `TasksEisenhowerView.tsx` (Ma trận Eisenhower 2x2) | `frontend/src/features/tasks/components/TasksEisenhowerView.tsx` | [x] | 4 Góc phần tư (Làm ngay, Lên lịch, Làm nhanh, Xem xét sau) |
| **T-05** | Tích hợp View Switcher 3 chế độ (`KANBAN`, `LIST`, `EISENHOWER`) vào `TasksListPage.tsx` | `frontend/src/features/tasks/pages/TasksListPage.tsx` | [x] | Chuyển đổi mượt mà 3 góc nhìn, lưu `localStorage` ghi nhớ thói quen |
| **T-06** | Kiểm thử toàn diện hệ thống (TypeScript Strict Mode, Vite Production Build, Responsive) | Toàn hệ thống | [x] | `npm run type-check` và build Vite 0 lỗi (Pass 100%) |
| **T-07** | Cập nhật tài liệu kiến trúc `PROJECT_STRUCTURE_AND_MAP.md` và tài liệu tri thức `38_TASKS_OVERHAUL_COMPLETION.md` | `DOCS/` | [x] | Tuân thủ 100% Điều 4 & Điều 6 RULES.md |
