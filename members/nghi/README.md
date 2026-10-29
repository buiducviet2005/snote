# HƯỚNG DẪN DÀNH CHO: NGHI (PHÂN HỆ 1 - ĐỊNH DANH & HỌC TẬP CÁ NHÂN)
> **Tài liệu bàn giao nhiệm vụ & Giới hạn chỉnh sửa mã nguồn**  
> **Nhánh Git phụ trách**: `feature/nghi-personal-academic`

---

## 1. PHẠM VI 4 MODULES BẠN ĐẢM NHẬN
Bạn chịu trách nhiệm toàn bộ về trải nghiệm tự học cá nhân của sinh viên:
1. **Module 1: Authentication & User Profile**: Đăng ký, đăng nhập mật khẩu/Google, cấp phát và làm mới JWT token, hồ sơ cá nhân.
2. **Module 2: Semesters & Academic Subjects**: Quản lý học kỳ, môn học cá nhân, số tín chỉ, giảng viên.
3. **Module 3: Notes & Knowledge Management**: Soạn thảo ghi chú bài giảng, gắn nhãn (`Tag`), ghim, lưu trữ.
4. **Module 4: Personal Tasks & Todo Engine**: Bảng công việc cá nhân, trạng thái Todo/In-Progress/Done, phân loại độ ưu tiên, hạn chót.

👉 **Đọc chi tiết đặc tả kỹ thuật, Data Model và API tại**: [SPEC_VA_KIEN_TRUC.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/members/nghi/SPEC_VA_KIEN_TRUC.md).

---

## 2. GIỚI HẠN TỆP TIN ĐƯỢC PHÉP CHỈNH SỬA (ALLOWED BOUNDARIES)

Bạn **CHỈ ĐƯỢC PHÉP** tạo mới, chỉnh sửa trong phạm vi các thư mục sau:

### Backend:
- `backend/src/modules/auth/**`
- `backend/src/modules/semesters/**`
- `backend/src/modules/subjects/**`
- `backend/src/modules/notes/**`
- `backend/src/modules/tasks/**`

### Frontend:
- `frontend/src/features/auth/**`
- `frontend/src/features/notes/**`
- `frontend/src/features/tasks/**`

### Cơ sở dữ liệu (`backend/prisma/schema.prisma`):
- Chỉ được thêm/sửa các bảng nội bộ: `User`, `RefreshToken`, `Semester`, `Subject`, `Note`, `Tag`, `NoteTag`, `Task`, `TaskTag`, `TaskAssignee`, `TaskNoteLink`.

---

## 3. VÙNG TUYỆT ĐỐI CẤM ĐỤNG (FORBIDDEN AREAS)

Để không làm hỏng code của Việt và Team Lead:
1. ❌ **CẤM sửa các module ngoài phạm vi**:
   - Không đụng vào `backend/src/modules/classes/**`, `projects/**` (của Team Lead).
   - Không đụng vào `backend/src/modules/workspaces/**`, `schedule/**`, `shares/**`, `backup/**` (của Việt).
2. ❌ **CẤM xóa hoặc đổi kiểu của 2 trường**:
   - `projectId` và `workspaceId` trong bảng `Note` và `Task`. Đây là 2 trường Soft Reference (chuỗi UUID) dùng để liên kết với phân hệ của người khác.
3. ❌ **CẤM tạo quan hệ Foreign Key cứng (`@relation`)** từ bảng của bạn trỏ sang bảng `Project`, `Workspace` hay `CourseClass`.
4. ❌ **CẤM sửa các file cấu hình hạ tầng chung**:
   - `backend/src/server.ts`, `docker-compose.yml`, `package.json`, `.env.example` nếu chưa trao đổi với Team Lead.

---

## 4. QUY TRÌNH LÀM VIỆC & KIỂM THỬ

1. **Khởi tạo nhánh**:
   ```bash
   git checkout -b feature/nghi-personal-academic
   ```
2. **Kiểm tra cú pháp và build trước khi commit**:
   ```bash
   npm run type-check
   npm run build
   ```
3. **Commit & Tạo Pull Request**:
   - Đặt tên commit rõ ràng: `feat(notes): add markdown rich editor` hoặc `fix(tasks): update task priority sorting`.
   - Tạo Pull Request vào nhánh `main` để Team Lead review.
