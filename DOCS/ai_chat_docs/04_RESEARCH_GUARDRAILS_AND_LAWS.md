# 04 – RANH GIỚI NGHIÊN CỨU & CÁC LUẬT BẤT BIẾN (SNOTE GUARDRAILS)

Tài liệu này là **bản quy tắc ranh giới bất biến (Guardrails & Constraints)** dành cho AI Agent và Chat AI trong quá trình nghiên cứu, tư vấn và triển khai tính năng để **tuyệt đối không làm dự án đi lệch khỏi quỹ đạo cốt lõi**.

---

## 🚫 1. NGUYÊN TẮC BẢO TOÀN TRANSACTION & CƠ SỞ DỮ LIỆU

* 🛑 **CẤM MICROSERVICES SỚM (NO PREMATURE MICROSERVICES):**
  * Toàn bộ hệ thống Backend SNOTE phải duy trì mô hình **Modular Monolith** trên **1 Database PostgreSQL duy nhất**.
  * Không chia nhỏ Database thành nhiều database phân tán ở giai đoạn này để tránh tình trạng phân tán dữ liệu và mất tính toàn vẹn ACID.
* 🛑 **CẤM TẠO NOTE RÁC (ANTI-JUNK NOTES CONSTRAINT):**
  * Mọi ghi chú (`notes`) và công việc (`tasks`) **bắt buộc phải gắn với ít nhất một Môn học (`subject_id`) hoặc một Đồ án (`project_id`)**.
  * Ràng buộc này được thực thi ở cả 3 tầng: **Frontend UI validation**, **Backend Zod Schema** và **PostgreSQL CHECK constraint / Trigger**.

---

## 🔒 2. NGUYÊN TẮC BẢO MẬT & QUYỀN SỞ HỮU (ANTI-IDOR LAWS)

* 🛑 **CẤM TIN TƯỞNG PARAM `userId` TỪ CLIENT:**
  * Client **không bao giờ** được gửi `userId` trong Request Body hoặc URL Query để thao tác dữ liệu.
  * `userId` **bắt buộc phải được giải mã từ JWT Payload** bởi `authGuard` và gán vào `req.user.id`.
* 🛑 **CẤM TRUY VẤN THIẾU FILTER `userId`:**
  * Mọi câu lệnh `SELECT`, `UPDATE`, `DELETE` trong Service/Repository của sinh viên **bắt buộc phải có điều kiện `where: { userId, deletedAt: null }`**.

---

## 💻 3. NGUYÊN TẮC KIẾN TRÚC FRONTEND & TRẢI NGHIỆM NGƯỜI DÙNG

* 🛑 **CẤM TRỘN LẪN LOGIC API VÀO COMPONENT TRỰC TIẾP:**
  * Toàn bộ việc gọi HTTP API phải đi qua tầng Service (`src/services/api.ts` hoặc feature services), không viết hàm `fetch()` trực tiếp rải rác bên trong JSX Component.
* 🛑 **CẤM BỎ QUÊN RESPONSIVE & DARK MODE CHO SINH VIÊN:**
  * Giao diện phải được tối ưu cho cả Laptop và Màn hình Điện thoại di động (Mobile Web) để sinh viên tiện tra cứu lịch học và ghi chú nhanh.

---

## 📝 4. NGUYÊN TẮC TÀI LIỆU VÀ QUẢN LÝ TRI THỨC

* 🛑 **CẤM SỬA / XÓA LỊCH SỬ TRI THỨC (APPEND-ONLY RULE):**
  * Trong thư mục `DOCS/ai_chat_docs/`, khi có kiến thức mới, AI Agent **phải tạo file mới** với số thứ tự tăng dần, **tuyệt đối không chỉnh sửa hoặc xóa các file tài liệu đã có**.
