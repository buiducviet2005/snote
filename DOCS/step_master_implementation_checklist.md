# BẢNG CHECKLIST TRIỂN KHAI TOÀN DIỆN CÁC PHÂN HỆ SNOTE (MASTER IMPLEMENTATION CHECKLIST)

> **Mục tiêu:** Thực thi và hoàn thiện 100% các tính năng của SNOTE theo Kế hoạch triển khai tổng thể và 10 Nguyên tắc Vàng bảo vệ bất biến.  
> **Quy chuẩn:** Tuân thủ Điều 7 & Điều 8 của RULES.md (Checklist-First & Autonomous Execution Protocol).

---

## 📋 DANH MỤC CÔNG VIỆC TRIỂN KHAI (6 GIAI ĐOẠN)

### Giai đoạn 1: Nền Tảng Dữ Liệu Hợp Nhất & Backend Google Apps Script V8
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt (Acceptance Criteria) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| P1.1 | Triển khai etchAllInitialData() đọc 5 sheet đồng thời | web_script/Code.gs | Trả về JSON hợp nhất (projects, tasks, notes, roadmaps, config) trong 1 RPC | [x] |
| P1.2 | Triển khai executeBatchSync(batchPayload) | web_script/Code.gs | Xử lý đa thao tác tạo/sửa/xóa trên nhiều bảng trong 1 transaction duy nhất | [x] |
| P1.3 | Phòng chống Formula Injection (') trên mọi ô Sheets | web_script/Code.gs | Tự động thêm dấu ' ở đầu chuỗi nếu bắt đầu bằng =, +, -, @ | [x] |
| P1.4 | Tích hợp khóa lạc quan ersion & kiểm tra xung đột | web_script/Code.gs | Ngăn chặn ghi đè dữ liệu cũ khi phiên bản backend lớn hơn client | [x] |
| P1.5 | Nâng cấp SafeStorageProxy và Hàng đợi ngoại tuyến FIFO | web_script/Index.html | Giáng cấp 3 tầng (LocalStorage -> SessionStorage -> RAM) và lưu offlineQueue | [x] |
| P1.6 | Bộ điều phối Transaction Batch Sync Engine trên Client | web_script/Index.html | Gom các tác vụ trong 1000ms debounce gửi 1 lần duy nhất | [x] |

---

### Giai đoạn 2: Phân Hệ Quản Lý Công Việc Toàn Diện (Tasks Engine)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt (Acceptance Criteria) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| P2.1 | Bảng Kanban 4 Cột với HTML5 Native Drag & Drop chuẩn | web_script/Index.html | Kéo thả giữa TODO, IN_PROGRESS, REVIEW, DONE mượt mà 0ms | [x] |
| P2.2 | Tự động đánh giá Đúng hạn / Trễ hạn khi hoàn thành | web_script/Index.html | Tự gán completedAt và so sánh dueDate tính evaluation chuẩn xác | [x] |
| P2.3 | Bảng chi tiết 11 cột: Sort, Tìm kiếm & Phân trang | web_script/Index.html | Lọc đa tiêu chí < 2ms trên RAM, phân trang và sắp xếp nhiều cột | [x] |
| P2.4 | Ma trận Eisenhower 4 góc phần tư tương tác | web_script/Index.html | Phân loại Q1-Q4 tự động và kéo thả đổi mức độ ưu tiên tức thì | [x] |
| P2.5 | Thanh QuickTaskBar & Form Modal 13 cột hoàn chỉnh | web_script/Index.html | Tạo việc bằng Enter 0ms, modal form quản lý subtasks checklist con | [x] |

---

### Giai đoạn 3: Phân Hệ Tiến Độ Dòng Thời Gian Gantt (Schedule/Timeline)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt (Acceptance Criteria) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| P3.1 | Lưới 21 ngày trượt neo theo Hôm nay | web_script/Index.html | Cột mốc Hôm nay phát sáng, hiển thị thứ/ngày/tháng rõ ràng | [x] |
| P3.2 | Thanh tiến độ Gantt tương tác kéo dời và kéo giãn | web_script/Index.html | Kéo di chuyển thay đổi ngày bắt đầu/kết thúc; kéo mép phải thay đổi thời lượng | [x] |
| P3.3 | Đồng bộ 2 chiều tức thì giữa Tasks và Gantt | web_script/Index.html | Dời ngày trên Gantt đổi ngay hạn trên Kanban; đổi status đổi ngay màu thanh Gantt | [x] |
| P3.4 | Dải tiến độ nội vi (Inner Progress Fill) theo checklist con | web_script/Index.html | Thanh tiến độ con bên trong thanh Gantt phản ánh % checklist hoàn thành | [x] |

---

### Giai đoạn 4: Phân Hệ Ghi Chú & Đề Cương Môn Học (Notes & Outlines)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt (Acceptance Criteria) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| P4.1 | Giao diện Split View: Soạn thảo & Xem trước trực tiếp | web_script/Index.html | Thanh trượt co dãn tỷ lệ 2 khung hình, cuộn đồng bộ | [x] |
| P4.2 | Trình phân tích Markdown thuần zero-dependency | web_script/Index.html | Hỗ trợ Heading, in đậm, nghiêng, trích dẫn, code block, bảng, checklist | [x] |
| P4.3 | Tích hợp công thức toán LaTeX KaTeX inline & block | web_script/Index.html | Hiển thị sắc nét công thức toán học không lỗi font | [x] |
| P4.4 | Tính năng 1-Click Chuyển Note thành Task & Backlink | web_script/Index.html | Trích xuất - [x] thành subtasks, gắn sourceNoteId và tạo liên kết 2 chiều | [x] |
| P4.5 | Đồng bộ checkbox 2 chiều giữa Note preview và Task | web_script/Index.html | Tích chọn - [x] cập nhật subtask và ngược lại | [x] |

---

### Giai đoạn 5: Phân Hệ Lộ Trình & Bộ Phân Giải DFA (Roadmaps & Parser)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt (Acceptance Criteria) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| P5.1 | Bộ phân tích cú pháp DFA tuyến tính O(N) chống ReDoS | web_script/Index.html | Phân tích states, transitions, durations, bắt lỗi chỉ rõ dòng/cột | [x] |
| P5.2 | Không gian vẽ đồ thị tương tác bằng HTML5 Canvas thuần | web_script/Index.html | Kéo di chuyển đỉnh, vẽ cung có hướng, zoom/pan mượt mà 60fps | [x] |
| P5.3 | Chức năng Batch Convert Lộ trình sang Công việc | web_script/Index.html | Duyệt topo DFA, sinh tasks với hạn chót gối đầu (start_i = due_{i-1}+1) | [x] |
| P5.4 | Phản hồi trạng thái hoàn thành ngược về sơ đồ DFA | web_script/Index.html | Task hoàn thành -> Nút DFA chuyển sang màu xanh ngọc lục bảo phát sáng | [x] |

---

### Giai đoạn 6: Tích Hợp Đa Phân Hệ, Trải Nghiệm Ngoại Tuyến & Kiểm Thử
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt (Acceptance Criteria) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| P6.1 | Project Switcher 0ms đồng bộ lọc toàn bộ 5 phân hệ | web_script/Index.html | Chuyển đồ án lọc Tasks, Gantt, Notes, Roadmaps trong < 12ms | [x] |
| P6.2 | Đèn chỉ báo đồng bộ toàn cục 4 trạng thái & Xả hàng đợi ngoại tuyến | web_script/Index.html | 🟢 Synced, 🟡 Saving/Offline, 🔴 Error, 🔵 Loading; tự flush khi có mạng | [x] |
| P6.3 | Hệ thống phím tắt toàn cục (Ctrl+K, Ctrl+N, Shift+G) | web_script/Index.html | Điều khiển nhanh không cần chuột | [x] |
| P6.4 | Kiểm thử toàn diện & Cập nhật tài liệu dự án | DOCS/, web_script/ | Chạy test, cập nhật PROJECT_STRUCTURE_AND_MAP.md và COMMANDS_PLAYBOOK.md | [x] |
