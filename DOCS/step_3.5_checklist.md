# Bảng Checklist Thực thi Bước 3.5: Cấu trúc Repo & Tổ chức Mã nguồn (SNOTE)

Tài liệu này dùng để theo dõi, quản lý và xác thực từng tác vụ trong **Bước nhỏ 3.5: Chốt cấu trúc repo & tổ chức mã nguồn toàn project** thuộc **Bước 3 lớn (Thiết kế Kiến trúc & Nền tảng)** của dự án **SNOTE**.

---

## 📊 BẢNG TIẾN ĐỘ THỰC THI BƯỚC 3.5

| ID | Hạng mục công việc | File / Lệnh liên quan | Tiêu chí đạt | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| `STR-01` | **Tạo tài liệu đặc tả chuẩn hóa Bước 3.5** | `DOCS/step_3_repo_structure.md` | Tài liệu phân tích rõ cấu trúc Mono-repo 2 apps độc lập + shared packages tương lai, lệnh dev song song. | ✅ **[x] Đạt** |
| `STR-02` | **Khởi tạo Root `package.json` & Dev Orchestration Scripts** | `package.json` (tại root) | Cấu hình scripts root: `npm run dev` (chạy song song BE+FE), `npm run build`, `npm run dev:backend`, `npm run dev:frontend`. | ✅ **[x] Đạt** |
| `STR-03` | **Tạo module Shared Types & Contracts** | `packages/shared/` | Chứa Enums (`TaskStatus`, `TaskPriority`, `NoteType`), DTO types (`CreateNoteDto`), ApiResponse contract dùng chung. Đã build sinh `.d.ts`. | ✅ **[x] Đạt** |
| `STR-04` | **Tạo file `README.md` chuẩn mực tại root** | `README.md` (tại root) | Hướng dẫn toàn diện: Giới thiệu SNOTE, kiến trúc, yêu cầu môi trường, hướng dẫn chạy 1 lệnh, danh mục tài liệu. | ✅ **[x] Đạt** |
| `STR-05` | **Kiểm thử Scripts Root & Build Pipeline** | `npm run build`<br>`npm run type-check` | Scripts root chạy mượt mà, build cả backend và frontend không phát sinh lỗi. | ✅ **[x] Đạt** |
| `STR-06` | **Cập nhật Từ điển & Bản đồ Mã nguồn Dự án** | `DOCS/PROJECT_STRUCTURE_AND_MAP.md` | Cập nhật đầy đủ các file mới vào cây thư mục và danh mục tra cứu. | ✅ **[x] Đạt** |

---

## 📝 NHẬT KÝ THỰC THI THỰC TẾ (EXECUTION LOGS)

1. **Tạo tài liệu đặc tả Bước 3.5:** Hoàn thành file [DOCS/step_3_repo_structure.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/DOCS/step_3_repo_structure.md) đặc tả cấu trúc Monorepo nhẹ 2 apps (`backend/`, `frontend/`) và 1 shared library (`packages/shared/`).
2. **Khởi tạo Root Package & Concurrently:** Tạo [package.json](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/package.json) tại root với các script tiện ích `dev`, `build`, `type-check`.
3. **Xây dựng Thư viện Dùng chung:** Khởi tạo [packages/shared/](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/packages/shared) chứa toàn bộ Enums chuẩn (`NoteType`, `TaskStatus`, `TaskPriority`, `SemesterStatus`, `ScheduleEventType`) và DTO Contracts (`CreateNoteDto`, `TaskResponseDto`, `ApiResponse<T>`).
4. **Tạo Master README:** Tạo file [README.md](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/README.md) đầy đủ hướng dẫn khởi chạy chỉ với 1 lệnh `npm run dev`.
5. **Kiểm thử Pipeline Build & Type-check:** Chạy lệnh `npm run build` và `npm run type-check` từ thư mục gốc $\rightarrow$ **0 lỗi, hoàn thành trong 1.49s**.
