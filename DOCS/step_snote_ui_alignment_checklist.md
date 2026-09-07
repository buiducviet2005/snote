# CHECKLIST TÁI CẤU TRÚC UI/UX SNOTE WEB SCRIPT THEO CHUẨN SNOTE

> **Mục tiêu:** Tái cấu trúc toàn bộ giao diện, bố cục layout và vị trí elements của SNOTE Web Script Edition khớp 100% với phiên bản SNOTE React SPA (Left Sidebar, Topbar Context Selectors, QuickTaskBar, View Switcher).
> **Quy chuẩn:** Tuân thủ [RULES.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/RULES.md) (Điều 1, 4, 5, 6, 7, 8).

---

## 📋 BẢNG TIẾN ĐỘ THỰC THI (CHECKLIST TABLE)

| STT | Mã Bước | Mô Tả Công Việc | Tệp Tin Liên Quan | Tiêu Chí Nghiệm Thu | Trạng Thái |
| :---: | :---: | :--- | :--- | :--- | :---: |
| 1 | **CHK-UI-01** | Tạo tài liệu tri thức kỹ thuật tái cấu trúc UI/UX | `DOCS/ai_chat_docs/46_SNOTE_UI_ALIGNMENT_EXECUTION.md` | Tuân thủ Rule 6 (Append-Only), mô tả kiến trúc layout mới | [x] |
| 2 | **CHK-UI-02** | Tái cấu trúc toàn diện `web_script/Index.html` theo chuẩn SNOTE | `web_script/Index.html` | Left Sidebar (68px $\rightarrow$ 264px), Topbar Context Selectors, Quick Action (+), Phân hệ Notes, Tasks, Schedule, Semesters, Projects, Progress, Settings | [x] |
| 3 | **CHK-UI-03** | Cập nhật môi trường kiểm thử trực tiếp `web_script/test_local.html` | `web_script/test_local.html` | Cập nhật đầy đủ mock data học kỳ, môn học, thời khóa biểu và kiểm thử mượt mà UI | [x] |
| 4 | **CHK-UI-04** | Cập nhật tài liệu hướng dẫn và đặc tả chuyển giao | `web_script/README.md` | Bổ sung hướng dẫn sử dụng layout SNOTE chuẩn và phím tắt | [x] |
| 5 | **CHK-UI-05** | Xác minh toàn vẹn hệ thống monorepo | Monorepo Root | `npm run type-check` đạt 0 lỗi, hoàn tất 100% nghiệm thu | [x] |
