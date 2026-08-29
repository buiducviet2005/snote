# 📋 NGHIÊN CỨU KIẾN TRÚC PHÂN HỆ CÔNG VIỆC (TASKS) THEO THÓI QUEN NGƯỜI DÙNG (SNOTE)

> **Phân hệ:** Quản lý Công việc & Nhiệm vụ (`/tasks`)  
> **Mục tiêu:** Nâng cấp toàn diện trải nghiệm quản lý công việc cho sinh viên dựa trên tâm lý học hành vi và thói quen giải quyết bài tập / đồ án.

---

## 1. 🔍 Phân Tích Thói Quen Người Dùng (User Habits & Behavioral Patterns)

### 1.1. Hành vi thực tế của Sinh viên khi quản lý bài tập & đồ án:
1. **Tâm lý "Nước đến chân mới nhảy" & Nhu cầu Nhận diện Khẩn cấp (Deadline Urgency):**
   * Sinh viên thường ưu tiên công việc dựa trên **khoảng cách đến hạn chót (Time-to-deadline)** hơn là trạng thái Kanban thông thường.
   * Cần phân nhóm rõ rệt:
     * 🚨 **Quá hạn (Overdue):** Cần xử lý khẩn cấp ngay lập tức.
     * ⏰ **Hôm nay (Due Today):** Nhiệm vụ của ngày hiện tại.
     * 📅 **Tuần này & Sắp tới (This Week / Upcoming):** Kế hoạch tương lai.
     * ✅ **Đã hoàn thành (Completed):** Tự động thu gọn để giảm tải thị giác.
2. **Nhu cầu Thêm việc Nhanh (Quick Capture / 1-Second Add):**
   * Khi đang nghe giảng hoặc trong nhóm chat, sinh viên muốn ghi nhanh một đầu việc (`"Nộp báo cáo lab 3"`) trong vòng 1 giây mà không phải bấm mở Modal to phức tạp.
3. **Sự bối rối khi có quá nhiều việc (Decision Fatigue & Eisenhower Matrix):**
   * Khi đối mặt với 15-20 bài tập cùng lúc, sinh viên bị bối rối không biết nên bắt đầu từ đâu $\rightarrow$ **Ma trận Eisenhower 2x2** (Khẩn cấp vs Quan trọng) giúp phân bổ năng lượng học tập hiệu quả nhất.
4. **Nhu cầu Chuyển đổi Góc nhìn Linh hoạt (Multi-View Preferences):**
   * **Bảng Kanban:** Xem luồng xử lý 3 bước (Cần làm $\rightarrow$ Đang làm $\rightarrow$ Hoàn thành).
   * **Danh sách Nhóm theo Hạn chót (Grouped List):** Xem tiến độ từng ngày nhanh chóng.
   * **Ma trận Eisenhower (Priority Matrix):** Phân loại ưu tiên chiến lược.

---

## 2. 🏛️ Thiết Kế Kiến Trúc Phân Hệ Công Việc Đa Góc Nhìn (Multi-View Tasks Hub)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              SNOTE UNIFIED TASKS HUB                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  [📋 Bảng Kanban]       [📑 Danh Sách Phân Nhóm Hạn Chót]      [🎯 Ma Trận Eisenhower] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  1. THANH TẠO NHANH (Quick Task Capture Bar):                                          │
│     [ + Thêm nhanh công việc mới... (Nhấn Enter để lưu) ]  [📅 Hạn]  [📚 Môn]  [🔴 Gấp] │
│                                                                                        │
│  2. GÓC NHÌN 1: BẢNG KANBAN 3 CỘT (Kanban Board):                                     │
│     ├── Cột CẦN LÀM (TODO)          [Count + Thanh tiến độ]                            │
│     ├── Cột ĐANG THỰC HIỆN (IN_PROGRESS)                                               │
│     └── Cột ĐÃ HOÀN THÀNH (DONE)   [Confetti ăn mừng]                                  │
│                                                                                        │
│  3. GÓC NHÌN 2: DANH SÁCH NHÓM THEO HẠN CHÓT (Grouped Timeline List):                 │
│     ├── 🚨 Quá hạn (Overdue Tasks) - Highlight viền đỏ, đếm số ngày trễ               │
│     ├── ⏰ Hôm nay (Due Today) - Thẻ sáng, nút tick 1-click                            │
│     ├── 📅 Tuần này & Sắp tới (Upcoming Tasks) - Sắp xếp theo ngày tăng dần           │
│     └── ✅ Đã hoàn thành (Done) - Danh sách thu gọn                                    │
│                                                                                        │
│  4. GÓC NHÌN 3: MA TRẬN EISENHOWER 2x2 (Priority Matrix):                              │
│     ├── Q1: Khẩn cấp & Quan trọng (LÀM NGAY)                                           │
│     ├── Q2: Không khẩn cấp & Quan trọng (LÊN KẾ HOẠCH)                                 │
│     ├── Q3: Khẩn cấp & Không quan trọng (LÀM NHANH)                                    │
│     └── Q4: Không khẩn cấp & Không quan trọng (XEM XÉT SAU)                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 🎨 Đặc Tả Chi Tiết Giao Diện & Tương Tác Nâng Cao

### 3.1. Thanh Thêm Nhanh Đầu Trang (Quick Capture Bar):
* Input chiếm toàn bộ chiều rộng với phím tắt gợi ý (`Enter để tạo`).
* Tích hợp bộ chọn nhanh Môn học, Ngày hạn chót và Mức ưu tiên ngay trên cùng một hàng.
* Khi nhấn Enter $\rightarrow$ Gọi API ngầm tạo việc tức thì, kích hoạt hiệu ứng thêm mới mà không làm gián đoạn luồng làm việc.

### 3.2. Chế Độ Xem Danh Sách Nhóm Theo Hạn Chót (Grouped List View):
* Gom nhóm công việc thành 4 nhóm thời gian:
  * **Quá hạn:** Cảnh báo viền đỏ, badge số ngày quá hạn (VD: `Trễ 2 ngày`).
  * **Hôm nay:** Badge màu vàng nổi bật.
  * **Sắp tới:** Badge ngày tháng rõ ràng.
  * **Đã hoàn thành:** Chữ gạch ngang, mờ nhẹ, có thể thu gọn/mở rộng.
* Mỗi dòng hiển thị: Nút checkbox hoàn thành, Tiêu đề, Môn học, Đồ án, Thành viên phụ trách, Tiến độ subtasks `(1/3)` và các nút chuyển trạng thái nhanh.

### 3.3. Chế Độ Xem Ma Trận Eisenhower 2x2 (Eisenhower Matrix):
* Chia màn hình thành lưới 4 góc phần tư:
  * 🔴 **Góc I (Khẩn cấp & Cao):** Ô đỏ nổi bật.
  * 🟠 **Góc II (Không khẩn cấp & Cao):** Ô cam chiến lược.
  * 🟡 **Góc III (Khẩn cấp & Trung bình/Thấp):** Ô vàng giải quyết nhanh.
  * 🟢 **Góc IV (Không khẩn cấp & Thấp):** Ô xám/xanh xem xét sau.

---

## 4. 🗺️ Kế Hoạch Triển Khai Thực Thi

1. **Bước 1:** Tạo checklist thực thi `DOCS/tasks_overhaul_checklist.md`.
2. **Bước 2:** Xây dựng component `QuickTaskBar.tsx` hỗ trợ tạo việc tức thì trong 1 giây.
3. **Bước 3:** Xây dựng component `TasksListView.tsx` (Danh sách phân nhóm Hạn chót: Quá hạn, Hôm nay, Sắp tới, Đã xong).
4. **Bước 4:** Xây dựng component `TasksEisenhowerView.tsx` (Ma trận 4 ô Eisenhower).
5. **Bước 5:** Tích hợp View Switcher 3 chế độ (`KANBAN`, `LIST`, `EISENHOWER`) vào `TasksListPage.tsx` và lưu `localStorage`.
6. **Bước 6:** Kiểm thử TypeScript Strict Mode, Build Vite và bàn giao tài liệu.
