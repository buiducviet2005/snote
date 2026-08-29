# ⏱️ NGHIÊN CỨU THÓI QUEN NGƯỜI DÙNG & TỐI ƯU HÓA QUY TRÌNH ĐẶT LỊCH HỌC TẬP (SNOTE)

> **Phân hệ:** Quản lý Lịch trình & Đặt lịch học (`/schedule` & `EventModal`)  
> **Mục tiêu:** Tái thiết kế quy trình đặt lịch học tập, ca học đại học, lịch thi và lịch họp nhóm đồ án dựa trên tâm lý học hành vi và thói quen sinh viên.

---

## 1. 🔍 Phân Tích Thói Quen & Nỗi Đau (Pain Points) Của Người Dùng

### 1.1. Những bất cập trong quy trình đặt lịch truyền thống:
1. **Mất thời gian khi chọn giờ (Time-picker Friction):**
   * Sinh viên Việt Nam học theo **Ca / Tiết học cố định** (VD: Ca sáng 07:00 - 09:25 hoặc 09:35 - 12:00).
   * Bắt sinh viên phải cuộn từng phút để chọn `07:00` rồi lại cuộn tiếp `09:25` là thao tác thừa thãi gây ức chế.
2. **Gánh nặng tạo lịch lặp lại (Recurring Timetable Burden):**
   * Một môn học diễn ra vào mỗi sáng Thứ 3 trong suốt 15 tuần của học kỳ.
   * Nếu không có tính năng **Lặp lại $N$ tuần**, sinh viên phải tạo thủ công 15 lần $\rightarrow$ 95% sinh viên sẽ bỏ cuộc và không dùng tính năng lịch.
3. **Sự khác biệt rõ rệt giữa các loại sự kiện (Context Divergence):**
   * **Tiết học (Class):** Cần Phòng học, Tên môn, Giảng viên, Ca học.
   * **Lịch thi (Exam):** Cần Phòng thi, Hình thức thi (Tự luận / Trắc nghiệm / Vấn đáp), Ghi chú tài liệu (Được đem tài liệu không).
   * **Họp nhóm (Meeting):** Cần chọn Đồ án liên quan, Link Google Meet / Zoom, Phòng tự học thư viện.
   * **Việc cá nhân (Personal):** Đơn giản, tự do.

---

## 2. 🏛️ Thiết Kế Quy Trình Đặt Lịch Mới: 4 Chế Độ Tùy Biến Thông Minh

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        QUY TRÌNH ĐẶT LỊCH HỌC TẬP THÔNG MINH                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [📖 TIẾT HỌC]      [🎯 LỊCH THI]      [👥 HỌP NHÓM ĐỒ ÁN]      [👤 VIỆC CÁ NHÂN]      │
│                                                                                        │
│  1. CHỌN NHANH CA HỌC CHUẨN ĐẠI HỌC (1-Click Preset Slots):                           │
│     [Ca 1: 07:00 - 09:25]  [Ca 2: 09:35 - 12:00]  [Ca 3: 12:30 - 14:55]                │
│     [Ca 4: 15:05 - 17:30]  [Ca 5: 18:00 - 20:30]  [Tùy chỉnh giờ]                      │
│                                                                                        │
│  2. THÔNG TIN THEO NGỮ CẢNH (Contextual Fields):                                       │
│     ├── Tiết học:   [Môn học]  [Phòng học / Giảng đường]                              │
│     ├── Lịch thi:   [Môn thi]  [Phòng thi / SBD]  [Hình thức thi: Trắc nghiệm/Tự luận]│
│     └── Họp nhóm:   [Đồ án liên quan]  [Link họp Google Meet/Zoom]                     │
│                                                                                        │
│  3. LẶP LẠI THEO HỌC KỲ (Recurring Semester Generator):                                │
│     [✓] Lặp lại hàng tuần vào [Thứ này] trong [ 15 ] tuần của Học kỳ                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 🛠️ Kế Hoạch Triển Khai Thực Thi

1. **Bước 1:** Tạo checklist thực thi `DOCS/scheduling_workflow_checklist.md`.
2. **Bước 2:** Nâng cấp backend `schedule.service.ts` và `schedule.repository.ts` hỗ trợ tạo hàng loạt sự kiện lặp lại khi `isRecurring: true` với số tuần `repeatWeeks`.
3. **Bước 3:** Nâng cấp component `EventModal.tsx` với:
   * Thanh chọn 4 Tab loại sự kiện (`CLASS`, `EXAM`, `GROUP_MEETING`, `PERSONAL`).
   * Các nút Preset Ca học chuẩn Đại học (Ca 1 $\rightarrow$ Ca 5) và thời lượng nhanh.
   * Form động theo ngữ cảnh (Hình thức thi, Phòng học, Link họp).
   * Khối cấu hình lặp lại hàng tuần ($N$ tuần học kỳ).
4. **Bước 4:** Tích hợp tính năng click vào ô ngày trên Sơ đồ Gantt (`GanttTimelineView.tsx`) để mở ngay modal tạo lịch tại ngày đó.
5. **Bước 5:** Kiểm thử TypeScript Strict Mode, Build Vite và nghiệm thu.
