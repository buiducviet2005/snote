# CHECKLIST: PHỤC HỒI NGUYÊN LÝ HOẠT ĐỘNG GỐC & NÂNG CẤP GIAO DIỆN SNOTE
> Tạo ngày: 07/09/2026 | Phiên bản: SNOTE Web Script Edition

- [x] **Bước 1: Lập kế hoạch chi tiết & Duyệt kế hoạch**
  - [x] Khảo sát kỹ bộ hồ sơ bàn giao checklistcv_ggsheets/project_handover/
  - [x] Lập artifact kế hoạch snote_restoration_and_ui_enhancement_plan.md
  - [x] Được người dùng phê duyệt tiến hành

- [x] **Bước 2: Tài liệu hóa kiến trúc**
  - [x] Tạo DOCS/ai_chat_docs/47_RESTORATION_OF_CORE_PRINCIPLES_PLAN.md
  - [x] Cập nhật nhật ký kỹ thuật theo Rule 6 & 7

- [x] **Bước 3: Tái cấu trúc hoàn chỉnh web_script/Index.html**
  - [x] Luồng xác thực 2 cổng Landing Gateway (Mã PIN 4 số sinh viên & Email/Password Admin)
  - [x] Bộ nhớ an toàn Safe Storage Fallback chống lỗi chặn iframe
  - [x] Left Sidebar SNOTE (68px <-> 264px) có logo Mũ cử nhân GraduationCap
  - [x] Sticky Topbar kính mờ 68px có thông tin Đồ án, mã PIN, chuông, Ctrl+K, +, Profile
  - [x] Quản lý Task 13 trường dữ liệu, tự động đánh giá Đúng hạn / Trễ hạn
  - [x] Bảng Kanban 4 cột HTML5 Drag & Drop Optimistic UI
  - [x] Bảng chi tiết 11 cột có tab trạng thái số đếm, phân trang 10 việc, lọc đa chiều
  - [x] Ma trận Eisenhower 4 góc phần tư
  - [x] QuickTaskBar thêm nhanh nhiệm vụ có tag hạn chót
  - [x] Modal Checklist việc con (≡ X/Y) cập nhật thanh tiến độ %
  - [x] Sơ đồ Gantt Timeline 21 ngày trượt có nút điều hướng và Vạch Hôm Nay nét đứt
  - [x] Thời khóa biểu tuần 7 ngày x 5 ca học
  - [x] Ghi Chú & Đề Cương Markdown 2 cột Live Preview + Ghim + Chuyển Task
  - [x] Roadmap Hub DFA Parser 3 cấp + Chuyển đổi hàng loạt sang Tasks
  - [x] Bento Progress Dashboard thống kê tiến độ
  - [x] Admin Suite: Quản lý danh mục Đồ Án, Đổi PIN, Sao lưu JSON, Dọn sạch CSDL
  - [x] Chuông thông báo hạn chót quét deadline
  - [x] Modal tìm kiếm toàn năng Ctrl+K
  - [x] Dark / Light mode toggle

- [x] **Bước 4: Cập nhật bộ giả lập web_script/test_local.html**
  - [x] Bổ sung mock RPC handleAdminLogin, accessProjectPortal, getPublicProjectsList, saveProject, deleteProject, updateTaskChecklist, batchConvertRoadmapToTasks
  - [x] Hỗ trợ đầy đủ dữ liệu mẫu 2 đồ án, mã PIN 1234 và 5678

- [x] **Bước 5: Kiểm tra chất lượng & Nghiệm thu**
  - [x] Kiểm tra tính toàn vẹn cú pháp HTML/JS của Index.html
  - [x] Chạy npm run type-check (0 lỗi)
  - [x] Cập nhật tài liệu Walkthrough
