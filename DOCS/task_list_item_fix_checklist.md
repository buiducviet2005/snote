# CHECKLIST KHẮC PHỤC TRIỆT ĐỂ LỖI TASK-LIST-ITEM CHECKBOX (SNOTE)

| ID | Nhiệm vụ kỹ thuật | File liên quan | Trạng thái | Tiêu chí nghiệm thu |
| :---: | :--- | :--- | :---: | :--- |
| **T-01** | Nâng cấp đồng bộ thuật toán `smartNoteParser.ts` (Track Code Blocks, Universal Checkbox Regex `[ ]`, `[x]`, `[X]`, `[v]`, `[✓]`, `[✔]`, `[  ]`, blockquote `> - [ ]`) | `frontend/src/features/notes/utils/smartNoteParser.ts` | [x] | Đảm bảo 100% khớp chỉ mục giữa chuỗi thô và chuỗi render, không bao giờ lệch index |
| **T-02** | Nâng cấp `MarkdownViewer.tsx` xử lý tương tác toàn diện trên thẻ `<li>` và `<input>` (Click cả dòng hoặc ô checkbox đều toggle, chặn propagation lên Card) | `frontend/src/components/common/MarkdownViewer.tsx` | [x] | Nhấp vào checkbox hoặc văn bản dòng checklist đều toggle mượt mà, không kích hoạt mở Modal NoteCard |
| **T-03** | Tích hợp `onToggleTodo` vào `TaskModal.tsx` để hỗ trợ tích chọn checklist trong mô tả công việc (Task Description Sub-tasks) | `frontend/src/features/tasks/components/TaskModal.tsx` | [x] | Cho phép tích chọn checklist ngay trong màn hình xem chi tiết công việc và lưu tự động vào DB |
| **T-04** | Cập nhật CSS hiển thị và tương tác cho `.markdown-body li.task-list-item` trong `global.css` | `frontend/src/assets/styles/global.css` | [x] | Hiển thị con trỏ pointer, hiệu ứng hover tinh tế, gạch ngang mượt mà khi hoàn thành |
| **T-05** | Kiểm thử toàn diện tính năng tích chọn trên tất cả chế độ xem (NoteCard Grid, Split View, NoteModal, TaskModal) | Toàn hệ thống | [x] | `npm run type-check` và build Vite 0 lỗi, tương tác 100% chính xác |
| **T-06** | Cập nhật tài liệu kiến trúc `PROJECT_STRUCTURE_AND_MAP.md` và tạo tài liệu tri thức `DOCS/ai_chat_docs/33_TASK_LIST_ITEM_UNIVERSAL_INTERACTION_FIX.md` | `DOCS/` | [x] | Tuân thủ 100% Điều 4 & Điều 6 RULES.md |
