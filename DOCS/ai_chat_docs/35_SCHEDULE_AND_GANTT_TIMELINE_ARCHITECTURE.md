# 📊 NGHIÊN CỨU KIẾN TRÚC HIỂN THỊ LỊCH TRÌNH THEO THÓI QUEN NGƯỜI DÙNG & SƠ ĐỒ GANTT TIMELINE (SNOTE)

> **Phân hệ:** Quản lý Lịch trình & Dòng thời gian (`/schedule`)  
> **Tài liệu tham chiếu:** `DOCS/temp/image_128.png`  
> **Mục tiêu:** Tái thiết kế kiến trúc hiển thị lịch trình học tập, đồ án và công việc sinh viên dựa trên phân tích thói quen thực tế.

---

## 1. 🔍 Phân Tích Thói Quen Người Dùng (User Habit & Behavior Analysis)

### 1.1. Thói quen & Vấn đề thực tế của Sinh viên / Người học:
1. **Sự không đồng nhất giữa "Sự kiện thời điểm" và "Công việc có thời lượng":**
   * *Sự kiện thời điểm (Point Events):* Tiết học (7h - 9h), Lịch thi (13h30), Họp nhóm (20h).
   * *Công việc có thời lượng (Duration Tasks):* Đồ án môn học kéo dài 3 tuần (1/8 - 22/8), Bài tập lớn 10 ngày (5/8 - 15/8), Ôn thi cuối kỳ 2 tuần.
2. **Hạn chế của góc nhìn Lịch Tuần 7 ngày (Weekly Grid đơn thuần):**
   * Lưới tuần chỉ hiển thị tốt các tiết học trong ngày, nhưng **hoàn toàn thất bại** trong việc thể hiện "độ dài thời gian" (Duration) của các đồ án / nhiệm vụ kéo dài nhiều tuần.
   * Sinh viên không cảm nhận được:
     * Đồ án đã chạy được bao nhiêu % thời gian?
     * Hôm nay đang ở vị trí nào trong tổng thể chu kỳ đồ án?
     * Các đồ án có đang bị chồng lấn (Overlapping bottleneck) vào tuần thi cử hay không?
3. **Nhu cầu về Sơ đồ Dòng thời gian Gantt (Gantt Timeline View):**
   * Cho phép nhìn thấy toàn cảnh 30 - 60 ngày trên một trục thời gian thống nhất.
   * Nhìn thấy ngay thanh Bar biểu thị thời gian bắt đầu $\rightarrow$ kết thúc.
   * Vạch mốc **"Hôm nay" (Today Vertical Line)** giúp nhận thức tức thì về thời gian còn lại.
   * Xem nhanh người phụ trách (Assignee), trạng thái, và tiến độ công việc con (`1/2 subtasks`).

---

## 2. 🏛️ Thiết Kế Kiến Trúc Hiển Thị Đa Góc Nhìn (Multi-View Schedule Architecture)

Để giải quyết trọn vẹn cả hai nhu cầu: **Theo dõi tiết học theo tuần** VÀ **Theo dõi tiến độ đồ án dài hạn theo Gantt Timeline**, kiến trúc hiển thị lịch trình mới của SNOTE được thiết kế với **4 Chế Độ Xem Linh Hoạt (View Switcher)**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           SNOTE UNIFIED SCHEDULE HUB                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ [📅 Lịch Tuần (Week)]  [📊 Sơ Đồ Gantt (Timeline)]  [🗓️ Lịch Tháng]  [📋 Danh Sách/Agenda]│
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  1. GÓC NHÌN SƠ ĐỒ GANTT (Tham khảo image_128.png):                                     │
│     ├── Header: Status Tabs [Tất cả (16)] [Cần làm (4)] [Đang làm (3)] [Hoàn thành (6)] │
│     ├── Time Navigator: [Nút Hôm nay] [<] [>] [Tháng/Năm Picker]                       │
│     ├── Left Panel (Sticky Table):                                                      │
│     │   └── Công việc (Badge + Tên + Subtasks 1/2) | Phụ trách (Avatar) | Thời gian    │
│     └── Right Panel (Scrollable Gantt Timeline Canvas):                                 │
│         ├── Day Header: Ngày 1 -> 31 + Thứ (T2, T3, T4, T5, T6, T7, CN)                │
│         ├── Today Highlight: Cột ngày hôm nay phát sáng / vạch chỉ báo                  │
│         ├── Gantt Bars: Thanh bo góc bo tròn, màu sắc theo trạng thái/môn học           │
│         └── Interactive Hover Tooltip: Tên, Phụ trách, Hạn, Tiến độ %                  │
│                                                                                         │
│  2. GÓC NHÌN LỊCH TUẦN (Weekly 7-Day Grid):                                            │
│     └── 7 cột Ngày trong tuần, thẻ tiết học theo giờ, highlight ngày hôm nay.           │
│                                                                                         │
│  3. GÓC NHÌN LỊCH THÁNG (Monthly Matrix):                                               │
│     └── Lưới 35 ô ngày theo tháng, đếm mật độ sự kiện & chấm màu môn học.               │
│                                                                                         │
│  4. GÓC NHÌN DANH SÁCH (Agenda View):                                                   │
│     └── Nhóm sự kiện theo ngày theo thứ tự thời gian tuyến tính.                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 🎨 Đặc Tả Chi Tiết Giao Diện & Tương Tác Sơ Đồ Gantt (Theo image_128.png)

### 3.1. Thanh Điều Khiển & Bộ Lọc Nhanh (Top Control Bar):
* **Tab Lọc Trạng Thái Nhanh:**
  * `Tất cả (N)` | `Cần làm (N)` | `Đang làm (N)` | `Chờ duyệt/Đang chờ (N)` | `Hoàn thành (N)`
* **Bộ Điều Hướng Thời Gian:**
  * Nút `Hôm nay` (Icon Target/Calendar): 1-click cuộn/nhảy ngay về ngày hiện tại.
  * Nút `<` (Tháng trước) và `>` (Tháng sau).
  * Bộ chọn mốc bắt đầu: `Bắt đầu: DD/MM/YYYY`.
* **Bộ Lọc Phân Tầng (Filter Dropdowns):**
  * Lọc Môn học (`Tất cả môn học`).
  * Lọc Đồ án (`Tất cả đồ án`).
  * Lọc Người phụ trách (`Tất cả phụ trách`).

### 3.2. Cấu Trúc Bảng Gantt Chia Đôi (Split Table & Canvas Layout):

| Thành phần | Vị trí | Dữ liệu hiển thị | Tương tác |
| :--- | :--- | :--- | :--- |
| **Cột Thông Tin Trái** | Cố định (Sticky Left ~320px) | • Badge trạng thái (`Cần làm`, `Đang làm`...)<br>• Tên công việc + Icon tiến độ subtasks `[1/2]`<br>• Avatar / Tên người phụ trách<br>• Khoảng thời gian (`6/8 - 22/8`) | Click vào dòng $\rightarrow$ Mở `TaskModal` / `EventModal` xem chi tiết |
| **Lưới Thời Gian Phải** | Cuộn ngang (Scrollable Canvas) | • Dòng Header: Số ngày trong tháng (1 $\rightarrow$ 31) + Thứ trong tuần<br>• Cột Hôm Nay: Highlight màu Cyan/Teal nổi bật<br>• Các thanh Bar: Chiều dài từ `startDate` đến `dueDate`<br>• Tiến độ lồng trong thanh Bar | • Hover thanh Bar: Hiển thị Floating Tooltip đầy đủ thông tin<br>• Click thanh Bar: Mở modal tương ứng |

### 3.3. Bảng Màu Sắc Trạng Thái Gantt Bar (Chuẩn Dark Tech / Minimalist):
* 🟧 **Cần làm (TODO):** Màu Hổ phách / Amber (`#f59e0b` / `rgba(245, 158, 11, 0.9)`)
* 🟦 **Đang làm (IN_PROGRESS):** Màu Xanh Biển / Sky Blue (`#0ea5e9` / `rgba(14, 165, 233, 0.9)`)
* 🟪 **Chờ duyệt / Đang chờ (PENDING):** Màu Tím / Violet (`#8b5cf6` / `rgba(139, 92, 246, 0.9)`)
* 🟩 **Hoàn thành (DONE):** Màu Xanh Lục / Emerald Teal (`#10b981` / `rgba(16, 185, 129, 0.9)`)

---

## 4. 📐 Mô Hình Dữ Liệu & Thuật Toán Phân Bố Gantt Bar

### 4.1. Thuật toán tính toán Tọa độ X và Chiều rộng Width của thanh Bar:
Cho một tháng có $N$ ngày ($N \in \{28, 29, 30, 31\}$):
* Chiều rộng 1 ô ngày: `CELL_WIDTH = 38px`
* Ngày bắt đầu tháng: `monthStart`
* Vị trí bắt đầu ($StartCol$):
  $$StartCol = \max\left(0, \left\lfloor\frac{startDate - monthStart}{1\text{ ngày}}\right\rfloor\right)$$
* Vị trí kết thúc ($EndCol$):
  $$EndCol = \min\left(N - 1, \left\lfloor\frac{dueDate - monthStart}{1\text{ ngày}}\right\rfloor\right)$$
* Tọa độ Left: `left = StartCol * CELL_WIDTH`
* Chiều rộng Width: `width = max(CELL_WIDTH, (EndCol - StartCol + 1) * CELL_WIDTH - 6)`

### 4.2. Xử lý sự kiện kéo dài qua nhiều tháng:
* Nếu công việc bắt đầu từ tháng trước: Thanh Bar tràn từ viền trái ($StartCol = 0$) với mũi tên chỉ báo tiếp diễn `◀`.
* Nếu công việc kết thúc ở tháng sau: Thanh Bar tràn đến viền phải ($EndCol = N - 1$) với mũi tên chỉ báo `▶`.

---

## 5. 🗺️ Kế Hoạch Triển Khai Thực Thi

1. **Bước 1:** Xây dựng Component `GanttTimelineView.tsx` trong `frontend/src/features/schedule/components/`.
2. **Bước 2:** Bổ sung View Switcher trên `ScheduleWeekPage.tsx` (Chuyển đổi giữa `WEEK_GRID` và `GANTT_TIMELINE`).
3. **Bước 3:** Tích hợp bộ lọc trạng thái, bộ đếm số lượng, vạch hôm nay và Floating Tooltip.
4. **Bước 4:** Kiểm thử toàn diện TypeScript, tương thích responsive và nghiệm thu.
