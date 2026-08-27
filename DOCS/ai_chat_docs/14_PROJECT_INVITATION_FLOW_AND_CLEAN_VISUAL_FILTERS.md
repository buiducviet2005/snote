# BÁO CÁO CẢI TIẾN: QUY TRÌNH DUYỆT THAM GIA ĐỒ ÁN (INVITATIONS FLOW), SỬA LỖI TẠO TASK & THIẾT KẾ BỘ LỌC GHI CHÚ TRỰC QUAN

## 1. Vấn đề Ban đầu
1. **Lỗi khi tạo công việc cho đồ án:** Khi tạo task từ đồ án hoặc không chọn môn học, client gửi chuỗi rỗng `""` khiến Zod validation báo lỗi UUID không hợp lệ.
2. **Thiếu cơ chế phê duyệt tham gia đồ án:** Thành viên bị thêm thẳng vào đồ án mà không có quyền chủ động Chấp nhận hoặc Từ chối lời mời.
3. **Bộ lọc ghi chú gây nhiễu tầm nhìn:** Giao diện cũ kết hợp dropdown gom nhóm và loại bài phức tạp, thiếu phân định rõ ràng giữa các mục đang lọc khiến sinh viên bị rối mắt.

---

## 2. Các Giải pháp Triển khai Toàn diện

### 2.1. Khắc Phục Lỗi Tạo Task Cho Đồ Án
* Cập nhật Zod validation schema ([`tasks.schemas.ts`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/backend/src/modules/tasks/tasks.schemas.ts)) với tiền xử lý `optionalUuid`:
  ```ts
  const optionalUuid = z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().uuid().optional()
  );
  ```
* Cho phép tạo nhiệm vụ đồ án hoàn toàn trơn tru dù không có môn học liên kết hoặc chưa chỉ định người phụ trách.

---

### 2.2. Quy Trình Lời Mời & Chấp Nhận / Từ Chối Tham Gia Đồ Án (Project Invitation Flow)
1. **Database Schema:** Bổ sung `ProjectMemberStatus` (`PENDING`, `ACCEPTED`, `DECLINED`) vào `ProjectMember`.
2. **Quy trình Leader Mời:** Khi Trưởng nhóm mời thành viên, trạng thái khởi tạo là `PENDING`.
3. **Banner Lời Mời Trực Quan ([`ProjectsListPage.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/projects/pages/ProjectsListPage.tsx)):**
   * Thành viên khi nhận lời mời sẽ thấy Banner tím nổi bật: **"📩 Lời Mời Tham Gia Đồ Án Nhóm"** với tên đồ án, môn học và tên Trưởng nhóm.
   * Tích hợp 2 nút thao tác nhanh:
     * **"✅ Chấp Nhận"** (`POST /api/projects/:id/invitations/accept`): Kích hoạt pháo hoa 🎉 và đưa đồ án vào danh sách hoạt động chính thức.
     * **"❌ Từ Chối"** (`POST /api/projects/:id/invitations/decline`): Hủy bỏ lời mời an toàn.

---

### 2.3. Thiết Kế Lại Bộ Lọc Ghi Chú Trực Quan 2 Tầng & Hiệu Ứng Nền Hiện Đại
1. **Hệ Thống Lọc 2 Tầng (2-Tier Visual Filter Deck) ([`NotesListPage.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/notes/pages/NotesListPage.tsx)):**
   * **Tầng 1 (Nguồn / Thư mục)**: `📁 Tất cả (${count})` | `[CS101] Cấu trúc dữ liệu` | `📁 Đồ án NLP` | `📝 Ghi chú tự do`.
   * **Tầng 2 (Loại nội dung)**: `🎯 Tất cả` | `📖 Bài giảng` | `🧪 Thực hành` | `🎯 Ôn thi` | `🛠️ Đồ án` | `👥 Họp nhóm` | `📝 Ghi chú chung`.
   * **Banner Tóm Tắt Bộ Lọc**: Hiển thị rõ ràng tiêu chí đang chọn (`Đang lọc: [Môn học] • [Loại bài] • [Từ khóa]`) kèm nút xóa bộ lọc nhanh.
2. **Hiệu Ứng Nền Hiện Đại & Glassmorphism ([`global.css`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/assets/styles/global.css)):**
   * Ambient Dark Tech Mesh Background với 3 luồng gradient tĩnh và ma trận chấm hạt (Dot matrix pattern 28px).
   * Thẻ ghi chú Glassmorphism mờ 14px, viền sáng tinh tế và hiệu ứng Hover Lift bóng đổ màu tím indigo sang trọng.

---

## 3. Kết quả Kiểm thử Tự Động (E2E Integration Test)

```text
1. Leader created project: Đồ Án AI Vision & Edge Computing 2026 (ID: f4de5147-...)
2. Created Task for project without error: Thiết kế kiến trúc Pipeline YOLOv11 + TensorRT (Status: 200 OK)
3. Leader invited member: admin@snote.edu.vn (Pending Invitations: 1)
4. Member accepted invitation: Bạn đã chấp nhận tham gia đồ án thành công!
5. Đồ án hiển thị chính thức trong danh sách đồ án của Member: THÀNH CÔNG (YES)
```
