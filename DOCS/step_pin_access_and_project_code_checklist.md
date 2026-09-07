# CHECKLIST: NÂNG CẤP TRUY CẬP ĐỒ ÁN BẰNG MÃ & PIN, BẮT BUỘC TẠO/SINH MÃ, PHÂN LẬP CHÍNH XÁC

> **Mục tiêu:**
> 1. **Bỏ hoàn toàn cơ chế chọn đồ án qua dropdown** trên Cổng Đồ Án; thay thế bằng nhập trực tiếp **Mã Đồ Án** (Project Code/ID) và **Mã PIN 4 số**.
> 2. **Triển khai bộ nhập OTP 4 số hoàn chỉnh:** Tự động nhảy số khi gõ (auto-advance), phím Backspace tự lùi ô, dán mã tự động điền (paste handler), mắt ẩn/hiện PIN, thông báo lỗi sai mã PIN rõ ràng kèm hiệu ứng rung lắc (shake feedback).
> 3. **Cơ chế Bắt buộc Tạo Mã hoặc Sinh Mã khi Tạo Đồ Án Mới (`modal-project`):** Đưa Mã Đồ Án ra giao diện công khai kèm nút `🎲 Sinh Mã Tự Động`, Mã PIN kèm nút `🎲 Sinh PIN`, kiểm tra trùng lặp và tính toàn vẹn.
> 4. **Khắc phục triệt để lỗi hiển thị sai dự án truy cập:** Thành viên chỉ thấy đồ án đã xác thực thành công hoặc các đồ án đã truy cập của mình; bảo mật 100% mã PIN ở backend (không public PIN qua API).
> 5. **Kiểm thử tự động 100%**, cập nhật Bản đồ dự án & Sổ tay lệnh, đóng gói Git commit.

---

## 📋 DANH MỤC CÔNG VIỆC THỰC THI (MULTI-STEP CHECKLIST)

### Giai đoạn 1: Nâng Cấp Giao Diện Cổng Đồ Án & Bộ Nhập Mã PIN OTP Tự Nhảy Số
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| C1.1 | Thay thế dropdown chọn đồ án bằng ô nhập Mã Đồ Án (`landing-project-code`) | web_script/Index.html | Loại bỏ dropdown `<select>`, cho nhập mã trực tiếp, tự động viết hoa, kèm chip gợi ý đồ án đã truy cập gần đây | [x] |
| C1.2 | Lập trình tương tác OTP 4 số tự động nhảy số, lùi số, dán mã | web_script/Index.html | Gõ 1 số tự nhảy sang ô kế tiếp; Backspace tự lùi về ô trước; Paste điền đủ 4 ô; chỉ nhận số | [x] |
| C1.3 | Cải tiến mắt ẩn/hiện mã PIN & Thông báo lỗi sai mã PIN rõ ràng | web_script/Index.html | Bật/tắt xem mã PIN hoạt động cho cả 4 ô; thông báo lỗi sai mã nổi bật, có hiệu ứng rung lắc (shake) | [x] |

### Giai đoạn 2: Cơ Chế Bắt Buộc Tạo Mã Hoặc Sinh Mã Khi Tạo Đồ Án Mới
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| M2.1 | Đưa trường Mã Đồ Án ra giao diện công khai trong modal tạo đồ án | web_script/Index.html | Hiển thị ô `proj-id-field` rõ ràng, có nhãn bắt buộc `(*)`, kèm nút `🎲 Sinh Mã Tự Động` | [x] |
| M2.2 | Nâng cấp trường Mã PIN và nút `🎲 Sinh PIN` ngẫu nhiên | web_script/Index.html | Bắt buộc 4 chữ số, tự động sinh sẵn mã hợp lệ khi mở modal tạo mới | [x] |
| M2.3 | Kiểm tra tính hợp lệ & chống trùng lặp mã đồ án | web_script/Index.html | Báo lỗi khi để trống mã đồ án / mã PIN; ngăn chặn tạo mã trùng với đồ án đã tồn tại | [x] |

### Giai đoạn 3: Chuẩn Hóa Phân Lập Dự Án Truy Cập & Bảo Mật Backend
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| S3.1 | Phân lập chính xác đồ án thành viên trong `enterMemberPortal` | web_script/Index.html | Không gọi nạp tràn lan toàn bộ đồ án của nhóm khác; chỉ quản lý đồ án đã xác thực | [x] |
| S3.2 | Quản lý danh sách "Đồ án đã truy cập" an toàn trong Safe Storage | web_script/Index.html | Lưu lịch sử đồ án đã vào trên thiết bị; switcher hiển thị đúng các đồ án thực tế của người dùng | [x] |
| S3.3 | Thêm tính năng "+ Nhập Mã Đồ Án Khác" trong Topbar Switcher | web_script/Index.html | Cho phép sinh viên nhập mã đồ án khác để chuyển đổi mượt mà mà không phải logout | [x] |
| S3.4 | Bảo mật Backend `Code.gs` và tìm kiếm mã đồ án case-insensitive | web_script/Code.gs | Không trả `pinCode` trong danh sách công khai; hỗ trợ tìm mã đồ án không phân biệt hoa thường | [x] |
| S3.5 | Đồng bộ hóa Trình giả lập Cục bộ `test_local.html` | web_script/test_local.html | Cập nhật mock `accessProjectPortal`, tìm theo mã đồ án, kiểm tra PIN chuẩn xác | [x] |

### Giai đoạn 4: Tự Động Xác Minh, Cập Nhật Tài Liệu & Git Commit
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| V4.1 | Xây dựng bộ script kiểm thử tự động xác minh toàn diện | scratch/verify_pin_and_project_code.py | 100% test PASS: OTP jump, paste, project code input, validation, access isolation | [x] |
| V4.2 | Cập nhật Bản đồ dự án & Sổ tay lệnh | DOCS/PROJECT_STRUCTURE_AND_MAP.md, DOCS/COMMANDS_PLAYBOOK.md | Kê khai tính năng mới, cấu trúc dữ liệu và lệnh kiểm thử | [x] |
| V4.3 | Đóng gói Git commit chuẩn mực | Git Repository | Commit chuẩn Conventional phản ánh toàn bộ cải tiến | [x] |
