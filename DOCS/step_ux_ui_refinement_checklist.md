# CHECKLIST: PHÂN TÍCH & CẢI TIẾN GIAO DIỆN TỪ GÓC NHÌN NGƯỜI DÙNG THỰC TẾ (USER-CENTRIC UX/UI REFINEMENT)

> **Mục tiêu:** Đứng ở góc nhìn của người dùng thực tế (Sinh viên, Nhóm trưởng, Giảng viên), phân tích cọ xát (frictions), loại bỏ các điểm thừa thãi và nâng cấp trải nghiệm giao diện người dùng đạt chuẩn cao cấp: Zero-friction, Content-First, Tự động hóa thao tác và Trực quan tối đa.  
> **Quy chuẩn:** Tuân thủ `RULES.md` (Checklist-first workflow, Điều 11: Nghiên cứu thói quen người dùng & Chống ý tưởng thừa thãi).

---

## 📋 DANH MỤC CÔNG VIỆC VÀ TIÊU CHÍ NGHIỆM THU CHI TIẾT

### Giai đoạn 1: Khảo Sát & Phân Tích Cảm Nhận Người Dùng
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **U1.1** | Phân tích cọ xát cổng đăng nhập (Landing OTP, nút demo) | `web_script/Index.html` | Phát hiện: Thiếu Enter/Auto-submit tại ô PIN 4, nút demo cồng kềnh, thiếu demo đồ án 2 | [x] |
| **U1.2** | Phân tích bối rối điều hướng Topbar (Đổi đồ án vs Đăng xuất) | `web_script/Index.html` | Phát hiện: Trùng lặp thuật ngữ "Chuyển Đồ Án" (trái) và "Đổi Đồ Án" (phải) | [x] |
| **U1.3** | Phân tích bảng Kanban (Thẻ quá hạn & thao tác không cần kéo) | `web_script/Index.html` | Phát hiện: Task đang làm bị trễ hạn không có cảnh báo đỏ trực quan, thiếu nút chuyển nhanh 1-click | [x] |
| **U1.4** | Phân tích không gian soạn thảo Ghi chú (Notes Split vs Full) | `web_script/Index.html` | Phát hiện: Bị chia 4 cột chật nẹp trên màn hình 13", thiếu chế độ Full Editor / Full Preview, thiếu Markdown Toolbar | [x] |

### Giai đoạn 2: Cải Tiến Cổng Đăng Nhập (Landing Page Ergonomics)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **U2.1** | Tự động submit khi nhập đủ 4 số PIN hoặc bấm phím Enter | `web_script/Index.html` | Nhập số thứ 4 tự đăng nhập hoặc bấm Enter ở bất kỳ ô PIN nào đều đăng nhập ngay | [x] |
| **U2.2** | Nâng cấp nút thử nghiệm đồ án thành 2 chip chuyên nghiệp | `web_script/Index.html` | Cung cấp 2 chip: `Đồ án 1 (PRJ-101)` và `Đồ án 2 (PRJ-102)` kiểm thử phân lập tức thì | [x] |

### Giai đoạn 3: Cải Tiến Topbar & Phím Tắt Toàn Cục
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **U3.1** | Chuẩn hóa nút "Đăng Xuất" góc phải Topbar | `web_script/Index.html` | Đổi nhãn từ "Đổi Đồ Án" thành "Đăng Xuất" với icon thoát tinh tế, xóa bỏ nhầm lẫn | [x] |
| **U3.2** | Bổ sung nút 1-click "📋 Sao Chép Mã Đồ Án" trên Topbar | `web_script/Index.html` | Bấm 1 click copy mã đồ án vào clipboard gửi Zalo nhóm, hiển thị toast thông báo | [x] |
| **U3.3** | Bổ sung phím tắt toàn cục `Ctrl + N` và `Esc` | `web_script/Index.html` | `Ctrl + N` mở modal tạo việc nhanh, `Esc` đóng sạch các modal/popover đang mở | [x] |

### Giai đoạn 4: Cải Tiến Bảng Công Việc & Thẻ Kanban (Tasks & Kanban Flow)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **U4.1** | Huy hiệu cảnh báo quá hạn thời gian thực (Overdue Warning Badge) | `web_script/Index.html` | Task chưa xong có `dueDate < today` hiển thị viền đỏ + badge đỏ `⚠️ Quá hạn` nổi bật | [x] |
| **U4.2** | Nút chuyển nhanh trạng thái 1-click (`▶`) trên thẻ Kanban | `web_script/Index.html` | Bấm nút `▶` đẩy task sang cột tiếp theo mà không cần thao tác kéo thả chuột | [x] |

### Giai đoạn 5: Nâng Cấp Không Gian Ghi Chú Đề Cương (Pro Markdown Workspace)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **U5.1** | Bộ 3 chế độ xem Editor: `Chia Đôi` | `Chỉ Viết` | `Chỉ Đọc` | `web_script/Index.html` | Cho phép sinh viên bung rộng 100% editor khi gõ bài hoặc 100% preview khi ôn thi | [x] |
| **U5.2** | Thanh công cụ định dạng Markdown nhanh (Markdown Quick Toolbar) | `web_script/Index.html` | Các nút bấm `B`, `I`, `H1`, `H2`, `List`, `Task`, `Code`, `Quote` chèn cú pháp tức thì | [x] |
| **U5.3** | Bộ đếm từ và ký tự thời gian thực (Word & Char Counter) | `web_script/Index.html` | Hiển thị số từ và ký tự tự động cập nhật khi gõ bài | [x] |
| **U5.4** | Bắt phím tắt `Ctrl + S` lưu nhanh trong Editor | `web_script/Index.html` | Chặn popup Save Webpage mặc định, tự động lưu bài ghi chú và hiển thị Toast | [x] |

### Giai đoạn 6: Kiểm Thử Tự Động & Đóng Gói
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **U6.1** | Kiểm tra cú pháp V8 JavaScript & HTML | `web_script/Index.html` | 0 syntax error, 100% valid script | [x] |
| **U6.2** | Chạy kiểm thử tự động toàn bộ test suites | `scratch/` | Đạt 100% PASS trên tất cả các kịch bản kiểm thử | [x] |
| **U6.3** | Cập nhật Checklist, Command Playbook & Git commit | Toàn bộ dự án | Commit rõ ràng, cập nhật tài liệu đầy đủ | [x] |
