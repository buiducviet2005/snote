# BÁO CÁO CẢI TIẾN: PHÂN CÔNG NHIỀU THÀNH VIÊN (MULTI-ASSIGNEE), THÊM NHANH TASK ĐỒ ÁN & PHÂN QUYỀN HOÀN THÀNH CHẶT CHẼ

## 1. Vấn đề Ban đầu
1. **Giao diện thêm công việc trong đồ án bị giới hạn kích thước:** Modal lồng modal khiến thao tác chật chội, khó quan sát.
2. **Một công việc chỉ gán được 1 người:** Trong thực tế đồ án, một nhiệm vụ lớn (ví dụ: Huấn luyện mô hình, Viết báo cáo) cần nhiều thành viên cùng tham gia phối hợp.
3. **Chưa giới hạn quyền hoàn thành công việc:** Bất kỳ ai trong đồ án cũng có thể bấm hoàn thành task của người khác.

---

## 2. Các Giải pháp Triển khai Toàn diện

### 2.1. Phân Công Nhiều Thành Viên Cùng Thực Hiện (Multi-Assignee Support)
1. **Database Model (`TaskAssignee`):**
   * Bổ sung bảng liên kết nhiều-nhiều `TaskAssignee` kết nối `Task` và `User`.
   * Hỗ trợ lưu trữ danh sách `assigneeIds: string[]`.
2. **Giao diện Chọn Thành Viên Linh Hoạt ([`TaskModal.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/tasks/components/TaskModal.tsx)):**
   * Modal mở rộng lên `680px`, thoáng đãng và có nhãn đồ án rõ ràng.
   * Lưới chọn thành viên tương tác cao: Cho phép click chọn/bỏ chọn bất kỳ số lượng thành viên nào trong nhóm.
3. **Hiển Thị Huy Hiệu Người Tham Gia ([`TaskCard.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/tasks/components/TaskCard.tsx)):**
   * Chip hiển thị thông minh: `👥 Bạn + 2 người` hoặc `👥 3 người làm` kèm tooltip danh sách đầy đủ tên thành viên.

---

### 2.2. Kiểm Soát Quyền Hoàn Thành & Chỉnh Sửa Công Việc (Permission Guard)
1. **Backend Enforcement (`backend/src/modules/tasks/tasks.service.ts`):**
   * Chỉ những người sau mới có quyền chuyển trạng thái `status` (`DONE` / `TODO` / `IN_PROGRESS`):
     * Thành viên được phân công trong nhiệm vụ đó (`isAssignee`).
     * Người tạo ra nhiệm vụ (`isCreator`).
     * Trưởng nhóm đồ án (`isOwner`).
   * Bất kỳ thành viên nào khác cố tình thay đổi trạng thái sẽ bị chặn lại với mã lỗi **HTTP 403 Forbidden**.
2. **Frontend UX Guard ([`TaskCard.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/tasks/components/TaskCard.tsx)):**
   * Đối với người không có quyền: Checkbox chuyển thành biểu tượng ổ khóa 🔒 mờ và vô hiệu hóa click kèm thông báo: *"🔒 Chỉ thành viên được phân công hoặc Trưởng nhóm mới có quyền hoàn thành task này"*.

---

### 2.3. Trình Tạo Nhanh Nhiệm Vụ Trong Không Gian Đồ Án ([`ProjectWorkspaceModal.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/projects/components/ProjectWorkspaceModal.tsx))
* Modal Không gian đồ án mở rộng `960px`.
* Tích hợp thanh **Quick Inline Task Form** ngay đầu tab Nhiệm vụ:
  * Nhập tiêu đề $\rightarrow$ Chọn thành viên phụ trách $\rightarrow$ Bấm `+ Thêm Nhanh` (hoặc bấm `Form Chi Tiết` khi cần thêm tags/deadline).
  * Giúp tăng tốc độ giao việc và quản lý tiến độ nhóm lên gấp nhiều lần.

---

## 3. Kết quả Kiểm thử Tự Động (E2E Integration Test)

```text
1. Created Multi-Assignee Task: "Tối ưu hóa mô hình YOLOv11 trên Jetson Orin Nano"
   - Total Assignees: 2
     -> Nguyễn Văn Sinh (sinhvien@snote.edu.vn)
     -> Quản Trị Viên (admin@snote.edu.vn)

2. Assigned Member updated status: DONE (HTTP 200 OK - THÀNH CÔNG)

3. Created Leader-Only Task: "Viết báo cáo tài chính đồ án"
   - Blocked unauthorized member update: (403) Forbidden (CHẶN THÀNH CÔNG NHƯ KỲ VỌNG)
```
