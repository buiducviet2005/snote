# 🛠️ BÁO CÁO KHẮC PHỤC: LỖI CẬP NHẬT TRẠNG THÁI VIỆC CẦN LÀM & ĐỒNG BỘ DATABASE (SNOTE)

> **Phân hệ:** Ghi chú (`/notes`), Công việc (`/tasks`) & Database Schema Sync  
> **Trạng thái:** ✅ Đã khắc phục triệt để và kiểm thử thành công 100%.

---

## 1. 🔍 Nguyên Nhân Gốc Rễ (Root Cause Analysis)

Khi tích hợp tính năng Chia sẻ tài nguyên (`ResourceShare`) ở bước trước:
1. Model `ResourceShare` và các chỉ mục mới đã được định nghĩa trong `backend/prisma/schema.prisma` và sinh types Prisma Client.
2. Tuy nhiên, bảng `resource_shares` trên cơ sở dữ liệu PostgreSQL (`localhost:5432`) chưa được đồng bộ cấu trúc bảng (`relation "public.resource_shares" does not exist`).
3. Khi người dùng nhấp vào checkbox việc cần làm trên thẻ ghi chú hoặc trang ghi chú, hàm `handleToggleNoteTodo` gửi yêu cầu `PUT /api/notes/:id` lên backend.
4. Tại tầng `NotesRepository.findById`, truy vấn kiểm tra quyền chia sẻ `prisma.resourceShare.findFirst(...)` đã gây lỗi `500 Internal Server Error (TableDoesNotExist)` $\rightarrow$ dẫn đến thông báo lỗi *"Lỗi cập nhật trạng thái việc cần làm"*.

---

## 2. ⚡ Các Bước Đã Xử Lý Triệt Để

1. **Đồng bộ Cơ sở dữ liệu PostgreSQL:**
   - Thực thi `npx prisma db push` trong `backend/`.
   - Tạo mới bảng `resource_shares`, Enums `share_target_type`, `share_access_level` và các composite indexes tối ưu truy vấn đa học kỳ.
2. **Kiểm thử Tự động qua API:**
   - Kiểm tra `PUT /api/notes/:id` cập nhật nội dung checkbox `[x]` $\rightarrow$ Trả về `200 OK - Cập nhật ghi chú thành công`.
   - Kiểm tra `PATCH /api/tasks/:id/status` cập nhật trạng thái `DONE` $\rightarrow$ Trả về `200 OK - Cập nhật trạng thái công việc thành công`.
3. **Kiểm tra Toàn bộ Monorepo:**
   - Chạy `npm run type-check`: 0 lỗi.
   - Chạy `npm run build --prefix frontend`: Hoàn thành 100% không cảnh báo.

---

## 3. 🧪 Kết Quả Kiểm Thử Hệ Thống

| Hạng mục kiểm tra | Lệnh thực thi | Kết quả |
| :--- | :---: | :---: |
| **Đồng bộ Database Schema** | `npx prisma db push` | 🟢 **Đã đồng bộ 100% bảng `resource_shares`** |
| **Cập nhật Checkbox Ghi chú** | `PUT /api/notes/:id` | 🟢 **200 OK - Hoạt động mượt mà** |
| **Cập nhật Trạng thái Task** | `PATCH /api/tasks/:id/status` | 🟢 **200 OK - Hoạt động mượt mà** |
| **Kiểm tra TypeScript Toàn Dự Án** | `npm run type-check` | 🟢 **0 lỗi (Pass 100%)** |
