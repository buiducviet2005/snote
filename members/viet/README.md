# HƯỚNG DẪN DÀNH CHO: VIỆT (PHÂN HỆ 3 - HẠ TẦNG WORKSPACE, LỊCH & CHIA SẺ)
> **Tài liệu bàn giao nhiệm vụ & Giới hạn chỉnh sửa mã nguồn**  
> **Nhánh Git phụ trách**: `feature/viet-platform-schedule`

---

## 1. PHẠM VI 3 MODULES BẠN ĐẢM NHẬN
Bạn chịu trách nhiệm về toàn bộ hạ tầng không gian làm việc, lập lịch và tiện ích nền tảng:
1. **Module 8: Multi-tenant Workspaces Engine**: Quản lý không gian làm việc (`PERSONAL`, `SUBJECT`, `PROJECT`, `GROUP`), phân quyền thành viên (`workspaces.policy.ts`).
2. **Module 9: Unified Calendar & Schedule Engine**: Quản lý lịch thời gian thực (lịch học, lịch thi, deadline, họp nhóm, lặp sự kiện theo chuẩn RRULE).
3. **Module 10: Resource Sharing, Backup & Platform Utilities**:
   - Chia sẻ tài nguyên đa hình qua token bảo mật (`ResourceShare`).
   - Sao lưu dữ liệu JSON, xuất Markdown và kiểm tra tính toàn vẹn mã hóa SHA-256 Checksum (`backup.service.ts`).
   - Công cụ tìm kiếm toàn cục (`search`).

👉 **Đọc chi tiết đặc tả kỹ thuật, Data Model và API tại**: [SPEC_VA_KIEN_TRUC.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/members/viet/SPEC_VA_KIEN_TRUC.md).

---

## 2. GIỚI HẠN TỆP TIN ĐƯỢC PHÉP CHỈNH SỬA (ALLOWED BOUNDARIES)

Bạn **CHỈ ĐƯỢC PHÉP** tạo mới, chỉnh sửa trong phạm vi các thư mục sau:

### Backend:
- `backend/src/modules/workspaces/**`
- `backend/src/modules/schedule/**`
- `backend/src/modules/shares/**`
- `backend/src/modules/backup/**`
- `backend/src/modules/search/**`

### Frontend:
- `frontend/src/workspaces/**`
- `frontend/src/features/schedule/**`
- `frontend/src/features/shares/**`
- `frontend/src/features/settings/**` (các trang sao lưu dữ liệu)

### Cơ sở dữ liệu (`backend/prisma/schema.prisma`):
- Chỉ được thêm/sửa các bảng nội bộ: `Workspace`, `WorkspaceMember`, `ScheduleEvent`, `ResourceShare`, `BackupRecord`.

---

## 3. VÙNG TUYỆT ĐỐI CẤM ĐỤNG (FORBIDDEN AREAS)

Để không làm hỏng code của Nghi và Team Lead:
1. ❌ **CẤM sửa các module ngoài phạm vi**:
   - Không đụng vào `backend/src/modules/classes/**`, `projects/**` (của Team Lead).
   - Không đụng vào `backend/src/modules/auth/**`, `notes/**`, `tasks/**`, `semesters/**` (của Nghi).
2. ❌ **CẤM tạo quan hệ Foreign Key cứng (`@relation`)** từ bảng `Workspace`, `ScheduleEvent` hay `ResourceShare` trỏ sang các bảng `Note`, `Task`, `Project` của người khác.
   - Luôn sử dụng **Soft Reference** (lưu `UUID` có thể null hoặc chuỗi ID) để tránh làm gãy migration của nhau.
3. ❌ **CẤM sửa các file cấu hình hạ tầng chung**:
   - `backend/src/server.ts`, `docker-compose.yml`, `package.json`, `.env.example` nếu chưa trao đổi với Team Lead.

---

## 4. QUY TRÌNH LÀM VIỆC & KIỂM THỬ

1. **Khởi tạo nhánh**:
   ```bash
   git checkout -b feature/viet-platform-schedule
   ```
2. **Kiểm tra cú pháp và build trước khi commit**:
   ```bash
   npm run type-check
   npm run build
   ```
3. **Commit & Tạo Pull Request**:
   - Đặt tên commit rõ ràng: `feat(schedule): support weekly recurring events` hoặc `feat(shares): add public share link generator`.
   - Tạo Pull Request vào nhánh `main` để Team Lead review.
