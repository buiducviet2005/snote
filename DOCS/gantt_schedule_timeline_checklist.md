# CHECKLIST TRIỂN KHAI SƠ ĐỒ GANTT TIMELINE & LỊCH TRÌNH THỜI GIAN THỰC (SNOTE)

| ID | Nhiệm vụ kỹ thuật | File liên quan | Trạng thái | Tiêu chí nghiệm thu |
| :---: | :--- | :--- | :---: | :--- |
| **G-01** | Tạo checklist thực thi và chuẩn bị môi trường phát triển | `DOCS/gantt_schedule_timeline_checklist.md` | [x] | Khởi tạo checklist theo Điều 7 RULES.md |
| **G-02** | Khảo sát & tối ưu hóa Dữ liệu Lịch trình hợp nhất (Unified Schedule Dto) hỗ trợ Gantt Timeline | `backend/src/modules/schedule/` & `frontend/src/` | [x] | Trả về đầy đủ `startTime`, `endTime`, `dueDate`, `createdAt`, `status`, `assignees`, `description` |
| **G-03** | Xây dựng Component `GanttTimelineView.tsx` chuẩn UX/UI theo mẫu `image_128.png` | `frontend/src/features/schedule/components/GanttTimelineView.tsx` | [x] | Sticky left table + Scrollable Gantt canvas + Today column + Interactive Hover Tooltip + Status Tabs |
| **G-04** | Tích hợp View Switcher (Lịch Tuần 7 ngày $\leftrightarrow$ Sơ đồ Gantt Timeline) vào `ScheduleWeekPage.tsx` | `frontend/src/features/schedule/pages/ScheduleWeekPage.tsx` | [x] | Chuyển đổi mượt mà 2 chế độ xem, lưu `localStorage` ghi nhớ thói quen người dùng |
| **G-05** | Kiểm thử toàn diện hệ thống (TypeScript Strict Mode, Vite Production Build, Responsive) | Toàn hệ thống | [x] | `npm run type-check` và build Vite 0 lỗi (Pass 100%) |
| **G-06** | Cập nhật tài liệu kiến trúc `PROJECT_STRUCTURE_AND_MAP.md` và tạo tài liệu tri thức `36_GANTT_TIMELINE_IMPLEMENTATION.md` | `DOCS/` | [x] | Tuân thủ 100% Điều 4 & Điều 6 RULES.md |
