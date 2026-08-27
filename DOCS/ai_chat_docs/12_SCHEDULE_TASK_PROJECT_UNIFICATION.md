# BÁO CÁO CẢI TIẾN: HỢP NHẤT ĐỒNG BỘ CÔNG VIỆC, ĐỒ ÁN VÀ THỜI KHÓA BIỂU (SCHEDULE UNIFICATION)

## 1. Vấn đề Ban đầu
* **Công việc & Đồ án bị rời rạc:** Modal tạo công việc (`TaskModal.tsx`) chưa có trường chọn Đồ án liên kết, các nhiệm vụ tạo từ đồ án chưa đồng bộ về danh sách công việc chung.
* **Lịch trình bị thiếu sót:** Trang Thời khóa biểu (`ScheduleWeekPage.tsx`) chỉ nạp các sự kiện `ScheduleEvent` (tiết học, ca thi), hoàn toàn không hiển thị hạn chót nộp bài tập (`Task Due Dates`) hay hạn nộp đồ án (`Project Due Dates`).

---

## 2. Các Giải pháp Triển khai Toàn diện

### 2.1. Liên kết 2 chiều giữa Công Việc (Tasks) và Đồ Án (Projects)
1. **Modal Công Việc (`TaskModal.tsx`):**
   * Bổ sung trường chọn **"Đồ án / Dự án nhóm liên kết"** (`projectId`).
   * Hỗ trợ nhận prop `defaultProjectId` và `defaultSubjectId` để khi tạo task bên trong Không gian Đồ án (`ProjectWorkspaceModal`), hệ thống tự động gán thẳng vào đồ án tương ứng.
2. **Trang Danh Sách Công Việc (`TasksListPage.tsx`):**
   * Bổ sung Bộ lọc đồ án: `Tất cả đồ án & việc` / `📁 [Tên đồ án]`.
   * Thẻ công việc ([`TaskCard.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/tasks/components/TaskCard.tsx)) hiển thị chip tím `📁 [Tên đồ án]` để phân biệt rõ ràng giữa việc cá nhân và nhiệm vụ nhóm.

### 2.2. Thời Khóa Biểu & Lịch Tuần Hợp Nhất ([`ScheduleWeekPage.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/schedule/pages/ScheduleWeekPage.tsx))
Khi nạp lịch theo tuần (`GET /api/schedule?startDate=...&endDate=...`), Backend tự động tổng hợp 3 luồng dữ liệu:
* 🎓 **Tiết học / Lịch thi (Schedule Events):** Hiển thị ca học, phòng học và thời gian bắt đầu - kết thúc.
* 📋 **Hạn chót công việc & bài tập (Tasks):**
  * Tích hợp **Checkbox trực tiếp** trên lịch trình để đánh dấu Hoàn thành / Mở lại task ngay trên cột ngày.
  * Hiển thị mức độ ưu tiên (`URGENT`, `HIGH`, `MEDIUM`) và tên đồ án liên kết.
* 📁 **Hạn chót đồ án & dự án (Projects):**
  * Hiển thị thẻ màu tím `[Hạn Đồ Án]` báo trước deadline nộp đồ án môn học.

---

## 3. Kết quả Kiểm thử Tự Động (E2E Integration Test)

```text
1. Created Project: Đồ Án Xử Lý Ngôn Ngữ Tự Nhiên (NLP) (Due: 2026-08-29)
2. Created Task linked to Project: Huấn luyện mô hình Transformer & Tokenizer (Priority: URGENT, Due: 2026-08-28)
3. Created Schedule Event: Tiết học Chuyên đề Trí tuệ nhân tạo (Date: 2026-08-28)

=== KẾT QUẢ ĐỒNG BỘ LỊCH TRÌNH (UNIFIED SCHEDULE) ===
Tổng số mục trên lịch: 6
 -> [EVENT] Tiết học Chuyên đề Trí tuệ nhân tạo | Bắt đầu: 2026-08-28T15:08:11.000Z
 -> [TASK] Huấn luyện mô hình Transformer & Tokenizer | Bắt đầu: 2026-08-28T15:08:11.000Z | Đồ án: Đồ Án Xử Lý Ngôn Ngữ Tự Nhiên (NLP)
 -> [PROJECT] [Hạn Đồ Án] Đồ Án Xử Lý Ngôn Ngữ Tự Nhiên (NLP) | Bắt đầu: 2026-08-29T00:00:00.000Z | Đồ án: Đồ Án Xử Lý Ngôn Ngữ Tự Nhiên (NLP)
```
