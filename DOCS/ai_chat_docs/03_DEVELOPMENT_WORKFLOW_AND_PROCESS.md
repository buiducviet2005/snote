# 03 – QUY TRÌNH PHÁT TRIỂN & CHUẨN MỰC KỸ THUẬT (SNOTE)

Tài liệu này định nghĩa **quy trình làm việc chuẩn mực, các bước thực thi tác vụ và nguyên tắc kỹ thuật bắt buộc** của dự án **SNOTE**.

---

## 🔄 1. QUY TRÌNH THỰC THI QUA CHECKLIST (CHECKLIST-FIRST WORKFLOW)

Mọi tác vụ phức tạp hoặc đa bước (Multi-step Tasks) đều phải tuân thủ nghiêm ngặt 3 bước sau:

```mermaid
flowchart LR
    A[1. Đọc RULES.md] --> B[2. Tạo File Checklist<br>DOCS/step_X_checklist.md]
    B --> C[3. Thực thi Tuần tự<br>Từng bước nhỏ]
    C --> D[4. Đánh dấu [x]<br>Cập nhật Tiến độ]
    D --> E[5. Cập nhật Map & Commit Git]
```

1. **Bước 1 (Đọc Rules):** Đọc lại [RULES.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/RULES.md) trước khi chạy bất kỳ tool nào.
2. **Bước 2 (Checklist First):** Bắt buộc tạo file `DOCS/step_X_checklist.md` chứa bảng các tác vụ có mã ID, mô tả, file liên quan và tiêu chí đạt.
3. **Bước 3 (Thực thi & Cập nhật trạng thái):** Hoàn thành bước nào là cập nhật ngay `[x]` bước đó.
4. **Bước 4 (Cập nhật Map):** Cập nhật ngay [PROJECT_STRUCTURE_AND_MAP.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/PROJECT_STRUCTURE_AND_MAP.md).
5. **Bước 5 (Commit Git):** Tạo commit chuẩn Conventional (`feat:`, `docs:`, `fix:`).

---

## 🏛️ 2. CHUẨN MỰC THIẾT KẾ PHÂN TẦNG BACKEND (DDD LAYERED ARCHITECTURE)

Mọi module nghiệp vụ trong `backend/src/modules/<module_name>/` đều phải gồm đúng 7 file phân tầng rõ ràng:

1. **`<module>.types.ts`**: Định nghĩa Domain Entities, DTOs, Filters và Service Interface.
2. **`<module>.schemas.ts`**: Định nghĩa Zod validation schema (Validate dữ liệu đầu vào và các ràng buộc nghiệp vụ).
3. **`<module>.repository.ts`**: Tầng giao tiếp cơ sở dữ liệu duy nhất (Sử dụng PrismaClient hoặc Raw SQL parameterized).
4. **`<module>.service.ts`**: Tầng chứa 100% nghiệp vụ logic, kiểm tra quyền sở hữu, gọi Repository, ném `AppError`.
5. **`<module>.controller.ts`**: Tầng nhận HTTP Request, bóc tách params/body, gọi Service, trả response JSON. **Tuyệt đối không truy vấn DB tại đây**.
6. **`<module>.routes.ts`**: Đăng ký Express Router, áp dụng `authGuard`, bọc handlers bằng `asyncBoundary`.
7. **`index.ts`**: Public API duy nhất export Router hoặc Service để các module khác giao tiếp (Encapsulation).

---

## 🛡️ 3. QUY TRÌNH XỬ LÝ LỖI & QUAN SÁT (ERROR & LOGGING STANDARDS)

1. **Ném lỗi đúng lớp:**
   * Lỗi dữ liệu người dùng $\rightarrow$ `throw new ValidationError(...)` (400).
   * Lỗi chưa đăng nhập $\rightarrow$ `throw new AuthError(...)` (401).
   * Lỗi không có quyền $\rightarrow$ `throw new ForbiddenError(...)` (403).
   * Lỗi không tìm thấy dữ liệu $\rightarrow$ `throw new NotFoundError(...)` (404).
   * Lỗi xung đột dữ liệu $\rightarrow$ `throw new ConflictError(...)` (409).
2. **Không nuốt lỗi (No Silent Catch):** Tuyệt đối không viết `catch(err) {}` rỗng. Luôn chuyển tiếp qua `next(err)` hoặc ném ra `AppError`.
3. **Pino Redaction:** Mọi dữ liệu nhạy cảm (`authorization`, `cookie`, `password`, `token`) đều được cấu hình che giấu tự động trước khi log.
