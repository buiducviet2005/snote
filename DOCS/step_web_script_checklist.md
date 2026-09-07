# CHECKLIST TRIỂN KHAI SNOTE WEB SCRIPT EDITION (GOOGLE APPS SCRIPT & GOOGLE SHEETS)

> **Mục tiêu:** Xây dựng hoàn chỉnh phiên bản **SNOTE Web Script Edition** hoạt động độc lập trên Google Apps Script Web App và Google Sheets Database, kế thừa và nâng cấp các tính năng từ `checklistcv_ggsheets`.
> **Quy chuẩn:** Tuân thủ [RULES.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/RULES.md) (Điều 1, 4, 5, 6, 7, 8).

---

## 📋 BẢNG TIẾN ĐỘ THỰC THI (CHECKLIST TABLE)

| STT | Mã Bước | Mô Tả Công Việc | Tệp Tin Liên Quan | Tiêu Chí Nghiệm Thu | Trạng Thái |
| :---: | :---: | :--- | :--- | :--- | :---: |
| 1 | **CHK-01** | Tạo hồ sơ tri thức chuyên biệt trong `DOCS/ai_chat_docs/` | `DOCS/ai_chat_docs/45_WEB_SCRIPT_EDITION_IMPLEMENTATION_PLAN.md` | Tuân thủ Rule 6 (Append-Only), đầy đủ kiến trúc và giải pháp kỹ thuật | [x] |
| 2 | **CHK-02** | Khởi tạo cấu hình Manifest cho Google Apps Script | `web_script/appsscript.json` | Cấu hình V8 runtime, timezone `Asia/Ho_Chi_Minh`, quyền truy cập Web App | [x] |
| 3 | **CHK-03** | Xây dựng Backend Controller & Database Layer | `web_script/Code.gs` | Đủ 25+ hàm backend: Auto-repair 7 Sheet, Auth PIN/Admin, Task CRUD + Đánh giá đúng hạn, Notes CRUD, Roadmap DFA, Backup JSON | [x] |
| 4 | **CHK-04** | Xây dựng Frontend SPA Độc lập Hoàn chỉnh | `web_script/Index.html` | Đủ Kanban kéo thả Optimistic UI, Gantt 21 ngày + vạch Hôm nay, Bảng 11 cột, Eisenhower Matrix, Thời khóa biểu, Ghi Chú & Đề Cương, Roadmap DFA Parser, Right-Sidebar | [x] |
| 5 | **CHK-05** | Xây dựng Môi trường Chạy thử Cục bộ (Local Preview Runner) | `web_script/test_local.html` | Mở trực tiếp bằng trình duyệt trên Windows mà không cần upload lên Drive, kiểm thử mượt mà UI/UX | [x] |
| 6 | **CHK-06** | Biên soạn Tài liệu Hướng dẫn Triển khai & Chuyển giao 3 phút | `web_script/README.md` | Hướng dẫn triển khai từng bước từ số 0, đặc tả 7 Sheet, tài khoản admin mặc định và checklist 10 tiêu chí nghiệm thu | [x] |
| 7 | **CHK-07** | Cập nhật Từ điển Mã nguồn & Ma trận Công nghệ (Rule 4) | `DOCS/PROJECT_STRUCTURE_AND_MAP.md` | Kê khai đầy đủ thư mục `web_script/`, các tệp tin và vai trò kiến trúc | [x] |
| 8 | **CHK-08** | Cập nhật Sổ tay Câu lệnh Điều khiển Dự án (Rule 5) | `DOCS/COMMANDS_PLAYBOOK.md` | Bổ sung hướng dẫn mở `test_local.html` và quy trình deploy Web App | [x] |
| 9 | **CHK-09** | Xác minh Toàn vẹn Hệ thống (Verification) | Toàn bộ dự án | `npm run type-check` đạt 0 lỗi, cú pháp JavaScript chuẩn, hoàn tất nghiệm thu | [x] |
