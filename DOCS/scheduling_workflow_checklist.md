# CHECKLIST TỐI ƯU HÓA QUY TRÌNH ĐẶT LỊCH HỌC TẬP (SNOTE)

| ID | Nhiệm vụ kỹ thuật | File liên quan | Trạng thái | Tiêu chí nghiệm thu |
| :---: | :--- | :--- | :---: | :--- |
| **S-01** | Tạo checklist thực thi và tài liệu nghiên cứu thói quen người dùng | `DOCS/scheduling_workflow_checklist.md` | [x] | Tuân thủ Điều 6 & Điều 7 RULES.md |
| **S-02** | Nâng cấp Backend hỗ trợ tạo sự kiện lặp lại học kỳ (`repeatWeeks`) | `backend/src/modules/schedule/` | [x] | Tạo hàng loạt $N$ tuần tự động khi bật `isRecurring` |
| **S-03** | Nâng cấp `EventModal.tsx` với 4 chế độ thông minh, Preset Ca học (Ca 1-5), Form động ngữ cảnh | `frontend/src/features/schedule/components/EventModal.tsx` | [x] | Preset 1-click Ca học + Form động theo loại sự kiện + Cấu hình lặp lại |
| **S-04** | Tích hợp Thao tác Đặt lịch 1-chạm khi click vào ô ngày trên Sơ đồ Gantt | `frontend/src/features/schedule/components/GanttTimelineView.tsx` | [x] | Nhấp vào ngày trên Gantt Timeline mở Modal điền sẵn ngày |
| **S-05** | Kiểm thử toàn diện hệ thống (TypeScript Strict Mode, Vite Production Build, Responsive) | Toàn hệ thống | [x] | `npm run type-check` và build Vite 0 lỗi (Pass 100%) |
| **S-06** | Cập nhật `PROJECT_STRUCTURE_AND_MAP.md` và tài liệu tri thức `41_SCHEDULING_WORKFLOW_COMPLETION.md` | `DOCS/` | [x] | Tuân thủ 100% Điều 4 & Điều 6 RULES.md |
