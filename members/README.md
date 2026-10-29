# SNOTE: TỔNG QUAN PHÂN BỔ NHIỆM VỤ & QUY CHẾ PHỐI HỢP NHÓM (3 THÀNH VIÊN)
> **Dự án**: SNOTE - Student Study & Academic Collaboration Platform  
> **Kiến trúc**: Modular Monolith (Express/TypeScript, React/Vite, PostgreSQL/Prisma).

---

## 1. BẢNG PHÂN BỔ VAI TRÒ & PHÂN HỆ

| Thành viên | Vai trò dự án | Phân hệ đảm nhận | Số Module | Thư mục hướng dẫn riêng |
| :--- | :--- | :--- | :---: | :--- |
| **VŨ (Team Lead)** | **System Architect & Demo Lead** | **Phần 2: Quản trị Lớp học, Nhóm & Đồ án môn học** | 3 | [members/vu/README.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/members/vu/README.md) |
| **NGHI** | **Core Academic & Productivity Dev** | **Phần 1: Định danh & Học tập cá nhân** | 4 | [members/nghi/README.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/members/nghi/README.md) |
| **VIỆT** | **Platform & Scheduling Dev** | **Phần 3: Không gian làm việc, Lịch & Chia sẻ** | 3 | [members/viet/README.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/members/viet/README.md) |

---

## 2. NGUYÊN TẮC "BẤT KHẢ XÂM PHẠM" ĐỂ TRÁNH CONFLICT CODE

Để 3 thành viên cùng code và nộp bài mà **không bao giờ bị xung đột merge code, không làm sập chức năng của nhau**:

1. **Quy tắc phân vùng tệp tin (Strict File Ownership)**:
   - Nghi chỉ được phép sửa mã nguồn trong phạm vi thư mục của mình.
   - Việt chỉ được phép sửa mã nguồn trong phạm vi thư mục của mình.
   - Tuyệt đối **KHÔNG SỬA CHÉO** mã nguồn của người khác khi chưa được Team Lead phê duyệt qua Pull Request.
2. **Quy tắc Soft Reference (Không Khóa Ngoại Ràng Buộc Cứng)**:
   - Khi bảng của Nghi (ví dụ `Note`, `Task`) cần liên kết tới Đồ án (`Project`) của Team Lead hoặc `Workspace` của Việt: **Chỉ lưu trường `UUID` có thể null**.
   - Tuyệt đối **không tạo `@relation` ràng buộc khóa ngoại cứng** trong Prisma schema làm gãy migration khi người khác chưa tạo bảng.
3. **Quy tắc Git Branching**:
   - Nhánh chính `main` được bảo vệ (Protected).
   - Nghi làm trên nhánh: `feature/nghi-personal-academic`
   - Việt làm trên nhánh: `feature/viet-platform-schedule`
   - Team Lead làm trên nhánh: `feature/lead-classes-projects`
   - Mỗi người kiểm tra chạy pass `npm run type-check` và `npm run build` trên nhánh của mình trước khi gửi PR.
