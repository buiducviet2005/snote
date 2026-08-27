# KHO TRI THỨC AI: KẾ HOẠCH & CHIẾN LƯỢC KỸ THUẬT BƯỚC 5 (FRONTEND V1 & UX)

- **Mã tài liệu:** `DOCS/ai_chat_docs/08_STEP_5_EXECUTION_PLAN.md`
- **Phiên bản:** `v1.0.0`
- **Dự án:** **SNOTE**
- **Trạng thái:** `ACTIVE / EXECUTION`
- **Nguyên tắc quản lý:** `APPEND-ONLY (BẤT BIẾN - KHÔNG SỬA ĐỔI LỊCH SỬ)`

---

## 1. MỤC TIÊU KIẾN TRÚC FRONTEND V1
Xây dựng lớp giao diện người dùng (Frontend SPA) cho dự án SNOTE, kết nối hoàn hảo với 8 Domain APIs Backend đã triển khai ở Bước 4.

### 4 Trục Trải nghiệm Cốt lõi:
1. **Context-Aware Workspace:** Mọi dữ liệu (Notes, Tasks, Schedule) đều có thể được lọc theo Ngữ cảnh Học kỳ & Môn học mà sinh viên đang chọn.
2. **Anti-Junk Guard at UI:** Giao diện bắt buộc người dùng chọn Môn học hoặc Đồ án khi tạo ghi chú/công việc.
3. **Session & Security:** Token JWT được quản lý tập trung trong `AuthContext`, tự động truyền vào API header, xử lý chuyển hướng bảo mật với `ProtectedRoute`.
4. **Agile Productivity:** Bảng Kanban 3 trạng thái cho công việc, Thời khóa biểu 7 ngày cho lịch học, Markdown preview cho ghi chú, và 1-click JSON backup.

---

## 2. DANH MỤC CÁC PHÂN HỆ & ROUTING V1

- `/login`: Đăng nhập tài khoản sinh viên.
- `/register`: Đăng ký tài khoản mới.
- `/`: Trang danh sách Ghi chú (mặc định sau khi login).
- `/notes`: Quản lý ghi chú bài giảng, gắn tag, lọc theo loại ghi chú.
- `/tasks`: Bảng Kanban công việc, độ ưu tiên và deadline.
- `/schedule`: Thời khóa biểu tuần 7 ngày & lịch thi.
- `/semesters`: Quản lý danh sách học kỳ và môn học.
- `/projects`: Quản lý đồ án môn học.
- `/progress`: Bảng tổng quan tiến độ học tập & số tín chỉ.
- `/settings`: Cài đặt hồ sơ & Xuất dữ liệu sao lưu JSON.
- `/status`: Giám sát sức khỏe kết nối Backend & Database.
