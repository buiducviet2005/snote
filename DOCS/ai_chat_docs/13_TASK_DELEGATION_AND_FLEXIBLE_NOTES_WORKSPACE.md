# BÁO CÁO CẢI TIẾN: PHÂN CẤP GIAO VIỆC ĐỒ ÁN (TASK DELEGATION) & GIAO DIỆN GHI CHÚ ĐA DẠNG LINH HOẠT

## 1. Vấn đề Ban đầu
1. **Công việc đồ án chưa đồng bộ giữa các thành viên:** Khi một thành viên tạo task trong đồ án, các thành viên khác không xem được do câu lệnh truy vấn chỉ lọc theo `userId` người tạo thay vì các thành viên của đồ án.
2. **Chưa có cơ chế phân quyền Leader / Member để giao việc:** Trưởng nhóm không thể chọn thành viên phụ trách (Assignee) khi tạo hoặc giao nhiệm vụ trong đồ án.
3. **Giao diện ghi chú còn đơn điệu về kích thước:** Chỉ có dạng lưới to cố định, không có các chế độ xem thu nhỏ, dạng bảng danh sách hoặc chia đôi màn hình để đọc tài liệu nhanh, thiếu phân chia theo các mục môn học / đồ án.

---

## 2. Các Giải pháp Triển khai Toàn diện

### 2.1. Đồng bộ Task Đồ Án & Cơ Chế Giao Việc (Leader $\rightarrow$ Member Delegation)
1. **Backend Database Query (`backend/src/modules/tasks/tasks.repository.ts`):**
   * Mở rộng điều kiện truy vấn: Người dùng xem được task cá nhân của mình **CỘNG VỚI** toàn bộ task của tất cả đồ án mà mình là thành viên (`{ OR: [{ userId }, { project: { members: { some: { userId } } } }] }`).
   * Hỗ trợ lưu trữ `assigneeId` khi tạo và chỉnh sửa task.
2. **Modal Phân Công Nhiệm Vụ ([`TaskModal.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/tasks/components/TaskModal.tsx)):**
   * Khi chọn một Đồ án, hệ thống tự động nạp danh sách toàn bộ thành viên trong nhóm.
   * Cung cấp menu **"👤 Phân công người phụ trách (Giao việc cho thành viên)"** để Trưởng nhóm (`OWNER`) hoặc thành viên giao task cho bất kỳ ai.
3. **Hiển thị Thẻ Task ([`TaskCard.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/tasks/components/TaskCard.tsx)):**
   * Thêm huy hiệu người phụ trách: `👤 [Tên Thành Viên]` hoặc `Bạn` (nếu giao cho chính mình).
   * Thành viên được giao có thể chuyển đổi trạng thái `TODO` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `DONE` trực tiếp.

---

### 2.2. Giao Diện Ghi Chú Linh Hoạt (4 Chế Độ Kích Thước & Phân Chia Mục) ([`NotesListPage.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/notes/pages/NotesListPage.tsx))

1. **4 Chế độ hiển thị kích thước (View Density Modes):**
   * 🍱 **`GRID` (Thẻ Chi Tiết)**: Lưới 2-3 cột với Markdown Preview đầy đủ, số từ, thời gian đọc.
   * 🗂️ **`COMPACT` (Thẻ Thu Nhỏ)**: Lưới 4-5 cột hiển thị dày đặc, giúp xem nhanh 20-30 ghi chú trên một màn hình mà không cần cuộn nhiều.
   * 📑 **`LIST` (Danh Sách Bảng Rộng)**: Dạng hàng bảng chuyên nghiệp với tiêu đề, phân loại, môn học/đồ án, ngày tạo và thao tác nhanh.
   * 🌓 **`SPLIT` (Khung Chia Đôi Workspace)**: Cột trái là danh sách cây bài ghi, cột phải là màn hình đọc Full Markdown Preview tức thì không cần mở modal.

2. **Phân chia theo Thư Mục / Accordion Sections:**
   * 📁 **Gom nhóm theo Môn học & Đồ án (`BY_SUBJECT`)**: Tự động gom các bài ghi vào từng thư mục môn học, đồ án và mục Ghi chú tự do với thanh Accordion mở rộng/thu gọn mượt mà.
   * 🏷️ **Gom nhóm theo Phân loại bài (`BY_TYPE`)**: Bài giảng lý thuyết, Báo cáo thực hành, Đề cương ôn thi, Nhật ký đồ án, Biên bản họp.
   * 🗃️ **Không gom nhóm (`NONE`)**: Hiển thị phẳng toàn bộ bài ghi.

3. **Motion Tokens Scale (Transitions Polish):**
   * Tích hợp thang đo Motion Tokens: `--duration-quick` (150ms), `--duration-fast` (250ms), `--ease-smooth-out`, `--ease-bounce`.
   * Hiệu ứng chuyển động mượt mà khi đóng/mở thư mục, hover thẻ và chuyển đổi chế độ xem.

---

## 3. Kết quả Kiểm thử Tự Động (E2E Integration Test)

```text
1. Leader created project: Đồ Án Microservices & Kafka 2026
2. Leader added member: admin@snote.edu.vn (Role: MEMBER)
3. Leader delegated task to Member: "Triển khai Kafka Producer & Consumer Service" (Assignee: Quản Trị Viên)

=== KIỂM THỬ ĐỒNG BỘ PHÍA THÀNH VIÊN ===
Số lượng task thành viên nhìn thấy trong đồ án: 1
 -> Task: Triển khai Kafka Producer & Consumer Service | Trạng thái: TODO | Phụ trách: Quản Trị Viên
4. Member updated task status: DONE (HTTP 200 OK)
```
