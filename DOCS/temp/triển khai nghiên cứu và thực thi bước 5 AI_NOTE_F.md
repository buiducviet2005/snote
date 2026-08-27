<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# triển khai nghiên cứu và thực thi bước 5 AI_NOTE_FLOW_V1

5\. Triển khai frontend \& UX cho sinh viên
Nhiệm vụ nhỏ trong bước này:[^1_4][^1_1]
Thiết kế layout chính xoay quanh 3 màn hình: Ghi chú, Công việc, Lịch.
Thiết kế màn hình quản lý môn học/học kỳ/dự án (danh sách, lọc, chọn context hiện tại).
Thiết kế giao diện tạo/xem/sửa/xóa ghi chú, gắn môn học, tag, loại nội dung (bài giảng/bài tập/ôn thi).
Thiết kế giao diện danh sách công việc với deadline, priority, status, bộ lọc đơn giản.
Thiết kế giao diện lịch tuần/tháng hiển thị tasks liên quan theo môn/học kỳ.
Thiết kế giao diện tổng quan tiến độ (số lượng tasks đã xong/chưa xong theo môn/học kỳ/dự án).
Thiết kế giao diện chia sẻ/cộng tác cơ bản (chia collection/board cho nhóm đồ án).
Kết nối frontend với các API backend (auth, notes, tasks, schedule, backup).

Dựa trên tài liệu dự án SNOTE đã có, tôi sẽ triển khai kế hoạch thực thi **Bước 5 – Frontend \& UX cho sinh viên** với đầy đủ các màn hình và tính năng theo yêu cầu.

## Tổng quan Bước 5

Bước 5 tập trung xây dựng giao diện người dùng hoàn chỉnh cho sinh viên, xoay quanh 3 trục chính: **Ghi chú**, **Công việc**, và **Lịch**, với các tính năng quản lý môn học/học kỳ, tiến độ, và chia sẻ cộng tác.[^1_4][^1_1]

______________________________________________________________________

## 1. Thiết kế Layout chính \& Navigation

### 1.1. Cấu trúc layout tổng thể

Layout chính gồm 3 vùng:

- **Sidebar trái (Navigation)**: Chứa menu điều hướng chính và bộ chọn context (Môn học/Học kỳ/Dự án).
- **Khu vực nội dung chính (Main content)**: Hiển thị màn hình hiện tại (Notes/Tasks/Schedule/Progress).
- **Top bar (Optional)**: Hiển thị thông tin user, nút tạo nhanh, tìm kiếm toàn cục.


### 1.2. Menu điều hướng chính

Sidebar chứa các mục:

- 📚 **Ghi chú** (Notes)
- ✅ **Công việc** (Tasks)
- 📅 **Lịch** (Schedule)
- 📊 **Tiến độ** (Progress)
- 📁 **Môn học \& Học kỳ** (Semesters \& Subjects)
- 🛠️ **Dự án/Đồ án** (Projects)
- ⚙️ **Cài đặt** (Settings)


### 1.3. Bộ chọn Context (Môn học/Học kỳ/Dự án)

Vị trí: Đầu sidebar hoặc top bar.

Chức năng:

- Dropdown chọn **Học kỳ** (ví dụ: "Học kỳ 1 – 2025/2026").
- Dropdown chọn **Môn học** (ví dụ: "Cơ sở dữ liệu", "Lập trình Web").
- Dropdown chọn **Dự án** (ví dụ: "Đồ án môn Web", "Robot 6 bậc tự do").
- Nút **"Tất cả"** để xem nội dung không lọc theo context.

Mục đích: Khi sinh viên chọn context, toàn bộ Notes/Tasks/Schedule sẽ tự động lọc theo môn/dự án đã chọn, giúp tập trung vào một môn tại một thời điểm.

______________________________________________________________________

## 2. Màn hình quản lý Môn học / Học kỳ / Dự án

### 2.1. Màn hình Học kỳ (Semesters)

**Danh sách học kỳ:**

- Card hoặc table hiển thị: Tên học kỳ, năm học, trạng thái (Đang học / Đã xong / Sắp tới), số môn, số tasks đã hoàn thành.
- Nút **"Tạo học kỳ mới"**.

**Chi tiết học kỳ:**

- Tab **Môn học**: Danh sách môn trong học kỳ (tên, mã môn, số tín chỉ, giảng viên).
- Tab **Tiến độ**: Tổng quan tasks đã xong/chưa xong trong học kỳ.
- Tab **Lịch**: Lịch học các môn trong học kỳ (nếu có dữ liệu schedule).


### 2.2. Màn hình Môn học (Subjects)

**Danh sách môn học:**

- Lọc theo học kỳ.
- Card môn học: Tên môn, mã môn, số tín chỉ, số notes, số tasks, deadline sắp tới.

**Chi tiết môn học:**

- Tab **Ghi chú**: Danh sách notes thuộc môn (lọc theo loại: bài giảng, bài tập, ôn thi).
- Tab **Công việc**: Danh sách tasks thuộc môn (lọc theo status, priority).
- Tab **Lịch học**: Các buổi học cố định trong tuần (nếu có).
- Tab **Tài liệu**: (Tương lai) Upload file PDF, slide bài giảng.


### 2.3. Màn hình Dự án/Đồ án (Projects)

**Danh sách dự án:**

- Card dự án: Tên dự án, môn liên quan (nếu có), thành viên (nếu chia sẻ), deadline, tiến độ (% tasks hoàn thành).

**Chi tiết dự án:**

- Tab **Ghi chú**: Notes liên quan đến dự án (ý tưởng, biên bản họp, tài liệu tham khảo).
- Tab **Công việc**: Tasks của dự án (phân công theo thành viên nếu có tính năng cộng tác).
- Tab **Tiến độ**: Biểu đồ hoặc thống kê tasks đã xong/chưa xong.
- Tab **Chia sẻ**: Quản lý quyền truy cập cho thành viên nhóm (xem/sửa).

______________________________________________________________________

## 3. Giao diện Ghi chú (Notes)

### 3.1. Danh sách ghi chú

**Bộ lọc:**

- Theo môn học (dropdown).
- Theo loại nội dung: Bài giảng / Bài tập / Ôn thi / Ý tưởng / Tài liệu.
- Theo tag (checkbox hoặc input tìm tag).
- Theo trạng thái (tất cả / đã xóa).

**Danh sách:**

- Card hoặc table: Tiêu đề, môn học, loại nội dung, tag, ngày cập nhật, preview nội dung (50–100 ký tự).
- Nút **"Tạo ghi chú mới"** nổi bật.


### 3.2. Tạo/Xem/Sửa/Xóa ghi chú

**Form tạo/sửa ghi chú:**

- **Tiêu đề** (bắt buộc).
- **Môn học** (dropdown, bắt buộc – chống note rác).
- **Dự án** (dropdown, optional – nếu ghi chú thuộc đồ án).
- **Loại nội dung** (dropdown: Bài giảng / Bài tập / Ôn thi / Ý tưởng / Tài liệu).
- **Tag** (input multi-tag, gợi ý tag đã dùng).
- **Nội dung** (rich text editor hoặc Markdown editor).
- **Metadata** (optional): Nguồn tài liệu, link tham khảo, chương/mục.

**Xem ghi chú:**

- Hiển thị đầy đủ nội dung, metadata, tag.
- Nút **Sửa**, **Xóa**, **Nhân bản** (duplicate).
- Nút **Chia sẻ** (nếu tính năng cộng tác đã triển khai).

**Xóa ghi chú:**

- Soft delete (đánh dấu `deletedAt`), có thể khôi phục trong thùng rác.

______________________________________________________________________

## 4. Giao diện Công việc (Tasks)

### 4.1. Danh sách công việc

**Bộ lọc:**

- Theo môn học / dự án.
- Theo trạng thái: Chưa bắt đầu / Đang làm / Đã xong.
- Theo mức độ ưu tiên: Thấp / Trung bình / Cao.
- Theo khoảng thời gian: Hôm nay / Tuần này / Tháng này / Quá hạn.

**Danh sách:**

- Card hoặc table: Tiêu đề, môn/dự án, deadline, priority badge, status badge, progress (nếu có subtasks).
- Nút **"Tạo công việc mới"**.


### 4.2. Tạo/Xem/Sửa/Xóa công việc

**Form tạo/sửa task:**

- **Tiêu đề** (bắt buộc).
- **Môn học** hoặc **Dự án** (bắt buộc – chống task rác).
- **Mô tả** (optional, rich text).
- **Deadline** (date picker, có thể chọn giờ).
- **Ưu tiên** (dropdown: Thấp / Trung bình / Cao).
- **Trạng thái** (dropdown: Chưa bắt đầu / Đang làm / Đã xong).
- **Tag** (optional, ví dụ: "Đọc chương 3", "Làm bài tập lớn").
- **Subtasks** (optional, danh sách các việc nhỏ trong task).

**Xem task:**

- Hiển thị đầy đủ thông tin, subtasks (nếu có).
- Nút **Sửa**, **Xóa**, **Đánh dấu hoàn thành**.

______________________________________________________________________

## 5. Giao diện Lịch (Schedule)

### 5.1. Lịch tuần

- Hiển thị 7 ngày trong tuần (Thứ 2 – Chủ Nhật).
- Mỗi ngày: Danh sách tasks có deadline trong ngày, buổi học cố định (nếu có).
- Click vào ngày để xem chi tiết hoặc tạo task nhanh.


### 5.2. Lịch tháng

- Calendar view truyền thống (ô ngày trong tháng).
- Dấu chấm hoặc badge trên ngày có deadline.
- Click vào ngày để lọc tasks theo ngày đó.


### 5.3. Bộ lọc lịch

- Lọc theo môn học / dự án.
- Lọc theo loại: Tasks / Buổi học / Sự kiện (thi, nộp bài).

______________________________________________________________________

## 6. Giao diện Tiến độ (Progress)

### 6.1. Tổng quan tiến độ

- **Theo học kỳ**: Biểu đồ tròn hoặc bar chart hiển thị số tasks đã xong / chưa xong trong học kỳ.
- **Theo môn học**: Danh sách môn với % tasks hoàn thành, số notes đã tạo.
- **Theo dự án**: Tiến độ % hoàn thành dự án dựa trên tasks.


### 6.2. Thống kê cá nhân

- Tổng số notes đã tạo trong học kỳ.
- Tổng số tasks đã hoàn thành.
- Số ngày liên tiếp có hoạt động (streak).

______________________________________________________________________

## 7. Giao diện Chia sẻ \& Cộng tác (Cơ bản)

### 7.1. Chia sẻ Collection/Board

- Trên màn hình chi tiết Môn học / Dự án, có nút **"Chia sẻ"**.
- Nhập email hoặc username của bạn cùng nhóm.
- Chọn quyền: **Xem** (read-only) hoặc **Sửa** (can edit).
- Gửi lời mời (qua email hoặc notification trong app).


### 7.2. Quản lý quyền truy cập

- Danh sách thành viên đã được chia sẻ.
- Thay đổi quyền hoặc gỡ quyền truy cập.

______________________________________________________________________

## 8. Kết nối Frontend với Backend API

### 8.1. API endpoints cần tích hợp

Dựa trên kiến trúc backend đã triển khai ở Bước 4, frontend cần gọi các API sau:

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- **Semesters**: `GET/POST/PUT/DELETE /api/semesters`, `GET /api/semesters/:id`.
- **Subjects**: `GET/POST/PUT/DELETE /api/subjects`, `GET /api/subjects/:id`.
- **Projects**: `GET/POST/PUT/DELETE /api/projects`, `GET /api/projects/:id`.
- **Notes**: `GET/POST/PUT/DELETE /api/notes`, `GET /api/notes/:id`.
- **Tasks**: `GET/POST/PUT/DELETE /api/tasks`, `GET /api/tasks/:id`.
- **Schedule**: `GET/POST/PUT/DELETE /api/schedule/events`.
- **Backup**: `POST /api/backup/export`, `POST /api/backup/import`.


### 8.2. Tầng API Service (Frontend)

Toàn bộ việc gọi API phải đi qua file `src/services/api.ts` hoặc các feature services, không gọi `fetch()` trực tiếp trong component.[^1_4]

Ví dụ:

```typescript
// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  async post<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  // ... put, delete, patch
};
```


### 8.3. Quản lý state \& caching

- Sử dụng **React Query** (TanStack Query) để quản lý state server, caching, refetch khi cần.
- Mỗi feature (notes, tasks, schedule) có hooks riêng: `useNotes()`, `useTasks()`, `useSchedule()`.

______________________________________________________________________

## 9. Checklist triển khai chi tiết

### 9.1. Tuần 1–2: Layout \& Navigation

- [ ] Tạo layout chính (Sidebar, Main, Top bar).
- [ ] Implement bộ chọn Context (Semester/Subject/Project).
- [ ] Routing cơ bản: `/notes`, `/tasks`, `/schedule`, `/progress`, `/semesters`, `/projects`.


### 9.2. Tuần 3–4: Module Notes

- [ ] Màn hình danh sách notes (với filter).
- [ ] Form tạo/sửa note (với validation bắt buộc môn học).
- [ ] Xem chi tiết note, xóa (soft delete).
- [ ] Kết nối API notes CRUD.


### 9.3. Tuần 5–6: Module Tasks

- [ ] Màn hình danh sách tasks (với filter theo status, priority, deadline).
- [ ] Form tạo/sửa task.
- [ ] Xem chi tiết task, đánh dấu hoàn thành.
- [ ] Kết nối API tasks CRUD.


### 9.4. Tuần 7: Module Schedule

- [ ] Lịch tuần (7 ngày).
- [ ] Lịch tháng (calendar view).
- [ ] Bộ lọc theo môn/dự án.
- [ ] Kết nối API schedule events.


### 9.5. Tuần 8: Module Progress \& Thống kê

- [ ] Dashboard tiến độ theo học kỳ/môn/dự án.
- [ ] Biểu đồ tasks đã xong/chưa xong.
- [ ] Thống kê cá nhân (tổng notes, tasks, streak).


### 9.6. Tuần 9: Module Semesters/Subjects/Projects

- [ ] CRUD học kỳ, môn học, dự án.
- [ ] Chi tiết môn/dự án với tabs (Notes, Tasks, Progress).
- [ ] Kết nối API semesters/subjects/projects.


### 9.7. Tuần 10: Chia sẻ \& Hoàn thiện

- [ ] Tính năng chia sẻ collection/board cho nhóm.
- [ ] Responsive mobile (kiểm tra trên điện thoại).
- [ ] Dark mode (toggle).
- [ ] Kiểm thử tích hợp toàn bộ flow.
- [ ] Viết tài liệu hướng dẫn sử dụng cho sinh viên.

______________________________________________________________________

## 10. Nguyên tắc thiết kế UX cần tuân thủ

- **Nhất quán**: Màu sắc, font, icon, spacing đồng bộ trong toàn app.
- **Responsive**: Tối ưu cho mobile web (sinh viên tra cứu nhanh trên điện thoại).[^1_4]
- **Dark mode**: Toggle sáng/tối, lưu preference vào localStorage.
- **Performance**: Lazy load components, virtualize danh sách dài (notes/tasks).
- **Accessibility**: Keyboard navigation, contrast màu đủ, label rõ ràng.

______________________________________________________________________

Bạn có muốn tôi tạo file Markdown chi tiết cho từng màn hình (ví dụ: `DOCS/step_5_notes_ui.md`, `DOCS/step_5_tasks_ui.md`) với wireframe mô tả bằng text và danh sách component React cần viết không?

<span style="display:none">[^1_2][^1_3]</span>

<div align="center">⁂</div>

[^1_1]: đánh dấu các bước/ai_chat_docs/01_PROJECT_ACHIEVEMENTS.md

[^1_2]: đánh dấu các bước/ai_chat_docs/04_RESEARCH_GUARDRAILS_AND_LAWS.md

[^1_3]: đánh dấu các bước/ai_chat_docs/06_STEP_3_HANDOVER_AND_COMPLETION.md

