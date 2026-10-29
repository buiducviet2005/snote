# HƯỚNG DẪN DÀNH CHO: VŨ (TEAM LEAD & SOLUTION ARCHITECT - PHÂN HỆ 2)
> **Tài liệu nhiệm vụ, quyền điều phối & Giới hạn kỹ thuật của Trưởng nhóm**  
> **Nhánh Git phụ trách**: `feature/lead-classes-projects`

---

## 1. PHẠM VI 3 MODULES BẠN TRỰC TIẾP ĐẢM NHẬN
Bạn nắm giữ **"Linh hồn nghiệp vụ"** của hệ thống SNOTE:
1. **Module 5: Course Classes & Member Roster (Lớp học & Danh sách thành viên)**: Quản lý lớp học của Giảng viên, ghi danh sinh viên qua mã code, phân quyền `CLASS_ADMIN` và `STUDENT`.
2. **Module 6: Study Groups & Peer Teaming Engine (Nhóm học tập & Đội nhóm)**: Cơ chế phân nhóm trong lớp, bổ nhiệm Trưởng nhóm (`Group Leader`), quản lý danh sách thành viên nhóm, bàn giao quyền trưởng nhóm.
3. **Module 7: Projects & Progress Reports (Quản lý Đồ án & Đánh giá Tiến độ)**:
   - Vòng đời đồ án môn học, phân công thành viên (`ProjectMember`).
   - Quy trình nộp báo cáo định kỳ (`ProgressReport`: % tiến độ, tóm tắt, khó khăn blockers).
   - Quy trình Giảng viên chấm điểm phản biện (`reviewScore`: 0-100) và nhận xét (`reviewComment`).
   - Dashboard ma trận tiến độ toàn bộ đồ án trong lớp dành cho Giảng viên.

👉 **Đọc chi tiết đặc tả kỹ thuật, Data Model và API tại**: [SPEC_VA_KIEN_TRUC.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/members/vu/SPEC_VA_KIEN_TRUC.md).

---

## 2. GIỚI HẠN TỆP TIN ĐƯỢC PHÉP CHỈNH SỬA (ALLOWED BOUNDARIES)

### Backend:
- `backend/src/modules/classes/**`
- `backend/src/modules/projects/**`

### Frontend:
- `frontend/src/features/classes/**`
- `frontend/src/features/projects/**`
- `frontend/src/features/progress/**`

### Cơ sở dữ liệu (`backend/prisma/schema.prisma`):
- Các bảng thuộc quyền sở hữu của bạn: `CourseClass`, `ClassMember`, `StudyGroup`, `StudyGroupMember`, `Project`, `ProjectMember`, `ProgressReport`.

### Đặc quyền riêng của Team Lead:
- Quản lý và duyệt Pull Request từ nhánh của Nghi (`feature/nghi-personal-academic`) và Việt (`feature/viet-platform-schedule`) vào nhánh `main`.
- Duy nhất bạn có quyền chỉnh sửa cấu hình hạ tầng chung khi cần: `backend/src/server.ts`, `docker-compose.yml`, `package.json`, `.env.example`.

---

## 3. NGUYÊN TẮC GIỮ AN TOÀN CHO BẢN THÂN

1. **Không sửa chéo code của Nghi và Việt**:
   - Để Nghi và Việt tự chủ sửa `backend/src/modules/notes/**`, `tasks/**`, `workspaces/**`, `schedule/**`.
   - Nếu bạn cần hiển thị Task hay Note trong màn hình Đồ án, chỉ gọi qua API Contract hoặc query lọc theo `projectId` (chuỗi UUID), không import trực tiếp repository/service của người khác.
2. **Kiểm tra Soft Reference khi Review PR**:
   - Khi Nghi hoặc Việt gửi PR, kiểm tra xem họ có vô tình tạo `@relation` cứng trỏ sang bảng `Project` hay `CourseClass` của bạn không. Nếu có, bắt buộc sửa thành `UUID` soft reference.
3. **Kịch bản Demo của bạn khi thuyết trình**:
   - Bạn là người demo luồng thực tế (Thầy tạo lớp -> Thầy tạo đồ án lớp & gán thành viên -> Trò vào lớp/nhóm -> Trò nộp báo cáo tiến độ -> Thầy chấm điểm ngay trên màn chiếu). Chuẩn bị sẵn 2 tài khoản (1 Giảng viên, 1 Sinh viên) để đổi tab trình duyệt trình diễn mượt mà.
