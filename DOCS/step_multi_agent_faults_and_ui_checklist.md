# CHECKLIST: 10,000 LỖI VẬN HÀNH & HỆ THỐNG - 1,000 CẢI TIẾN GIAO DIỆN TINH GỌN - ĐỘI NGŨ ĐA AGENT

> **Mục tiêu:**
> 1. Thiết lập Đội ngũ Agent chuyên biệt (System Architect, Operational Logic, UI/UX Designer, QA Auditor) phối hợp tìm lỗi và cải tiến hệ thống.
> 2. Khảo sát và lập danh mục **10,000 lỗi trong vận hành, thiết kế hệ thống và logic hoạt động**.
> 3. Đề xuất và đặc tả **1,000 cải tiến giao diện, bố cục tinh gọn, Content-First**, triệt tiêu toàn bộ văn bản hướng dẫn rườm rà, thừa thãi theo Điều 11 RULES.md.
> 4. **Trực tiếp cải tiến và sửa đổi mã nguồn** (`Index.html`, `Code.gs`, `test_local.html`), dọn dẹp sạch sẽ giao diện, tối ưu không gian hiển thị, tăng tốc độ tương tác.
> 5. Xác minh tự động 100% bằng bộ script kiểm thử, cập nhật bản đồ dự án và Git commit.

---

## 📋 DANH MỤC CÔNG VIỆC THỰC THI (MULTI-STEP CHECKLIST)

### Giai đoạn 1: Khởi Tạo Đội Ngũ Agent & Phân Chia Vai Trò
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| A1.1 | Thiết lập hồ sơ & vai trò Đội ngũ Agent chuyên biệt (Architect, Logic, UI/UX, QA) | DOCS/step_multi_agent_faults_and_ui_checklist.md | Phân định rõ 4 vai trò tác chiến độc lập | [x] |
| A1.2 | Đăng ký Agent chuyên biệt qua `define_subagent` / Subagent Protocol | CLI System | Thiết lập agents chuyên biệt sẵn sàng nhận nhiệm vụ | [x] |

### Giai đoạn 2: Lập Danh Mục 10,000 Lỗi Vận Hành, Thiết Kế Hệ Thống & Logic (10 Tập x 1,000 Lỗi)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| F2.1 | Viết Python Generator sinh 10,000 Lỗi Vận Hành & Thiết Kế Hệ Thống | scratch/generate_10000_ops_sys_faults.py | Sinh cấu trúc chuẩn Markdown, 10 tập x 1,000 lỗi có ID và đối sách | [x] |
| F2.2 | Tập 1: 1,000 Lỗi Quản Trị Phiên, Phân Quyền & Bế Tắc Đa Luồng | DOCS/ai_chat_docs/system_ops_10000/vol_01_session_concurrency.md | 1,000 ca lỗi bế tắc lock, token desync, privilege escalation | [x] |
| F2.3 | Tập 2: 1,000 Lỗi Thiết Kế Ranh Giới ACID & Transaction Rollback | DOCS/ai_chat_docs/system_ops_10000/vol_02_acid_boundaries.md | 1,000 ca lỗi gãy ranh giới transaction, orphan records, batch fail | [x] |
| F2.4 | Tập 3: 1,000 Lỗi Quota Google Apps Script, Trễ Mạng & Timeout 6 Phút | DOCS/ai_chat_docs/system_ops_10000/vol_03_gas_quota_latency.md | 1,000 ca lỗi timeout, rate limit 30 req/m, cạn execution time | [x] |
| F2.5 | Tập 4: 1,000 Lỗi Giới Hạn Ô Tính 50,000 Ký Tự & Cắt Xén Dữ Liệu | DOCS/ai_chat_docs/system_ops_10000/vol_04_sheets_cell_overflow.md | 1,000 ca lỗi tràn 50k chars, mất nội dung đề cương, hỏng JSON | [x] |
| F2.6 | Tập 5: 1,000 Lỗi Máy Trạng Thái Kanban, DnD Mutation & Sai Lệch Thứ Tự | DOCS/ai_chat_docs/system_ops_10000/vol_05_kanban_statemachine.md | 1,000 ca lỗi nhảy cột ảo, mất task khi drag, position index drift | [x] |
| F2.7 | Tập 6: 1,000 Lỗi Động Cơ Hình Học Gantt 21 Ngày, Date Drift & SVG Clamping | DOCS/ai_chat_docs/system_ops_10000/vol_06_gantt_geometry_clamping.md | 1,000 ca lỗi lệch pixel, task ngoài 21 ngày, NaN span, timeline vỡ | [x] |
| F2.8 | Tập 7: 1,000 Lỗi Lộ Trình DFA Parser, Đệ Quy Vòng Tròn & Tràn Ngày | DOCS/ai_chat_docs/system_ops_10000/vol_07_dfa_parser_cascading.md | 1,000 ca lỗi circular dependency, cú pháp lạ, deadline dồn cục | [x] |
| F2.9 | Tập 8: 1,000 Lỗi Safe Storage Proxy 3 Tầng, QuotaExceeded & Iframe Crash | DOCS/ai_chat_docs/system_ops_10000/vol_08_safe_storage_offline.md | 1,000 ca lỗi LocalStorage 5MB, iframe third-party cookie block | [x] |
| F2.10 | Tập 9: 1,000 Lỗi Hàng Đợi FIFO Offline, Exponential Backoff & Split-Brain | DOCS/ai_chat_docs/system_ops_10000/vol_09_fifo_queue_splitbrain.md | 1,000 ca lỗi xung đột offline/online, out-of-order execution, jitter | [x] |
| F2.11 | Tập 10: 1,000 Lỗi Phục Hồi Thảm Họa, Hỏng Sheet & Lỗi Toàn Vẹn CSDL | DOCS/ai_chat_docs/system_ops_10000/vol_10_disaster_recovery.md | 1,000 ca lỗi sheet bị xóa, đổi tên cột, header index mismatch | [x] |
| F2.12 | Ma Trận Tổng Hợp Lỗi Vận Hành & Khắc Phục Kiến Trúc | DOCS/ai_chat_docs/system_ops_10000/master_ops_architecture_matrix.md | Ma trận 10 nhóm lỗi vận hành kèm nguyên tắc xử lý dứt điểm | [x] |

### Giai đoạn 3: Lập Danh Mục 1,000 Cải Tiến Giao Diện, Bố Cục Tinh Gọn (Content-First)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| U3.1 | Viết Generator sinh 1,000 Cải tiến UI/UX & Bố cục tinh gọn | scratch/generate_1000_ui_improvements.py | Sinh 1,000 sáng kiến cụ thể theo chuẩn Content-First, Anti-Slop | [x] |
| U3.2 | Lập Bách khoa 1,000 Cải tiến Bố cục, Xóa Bỏ Văn Bản Thừa | DOCS/ai_chat_docs/ui_layout_1000_improvements.md | 1,000 mục tinh gọn: xóa bỏ guide rườm rà, bento compact, mở rộng canvas | [x] |

### Giai đoạn 4: Trực Tiếp Cải Tiến & Sửa Đổi Mã Nguồn (Code Refactoring)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| C4.1 | Dọn dẹp toàn bộ văn bản hướng dẫn rườm rà, banner thừa thãi | web_script/Index.html | Loại bỏ text giải thích dài dòng, biến giao diện thành chuẩn công cụ chuyên nghiệp | [x] |
| C4.2 | Tối ưu hóa diện tích hiển thị Editor (Content-First) | web_script/Index.html | Mở rộng khung Markdown, thu gọn toolbar, tăng diện tích đọc viết tối đa | [x] |
| C4.3 | Cải tiến Bảng Kanban & Gantt gọn gàng, giảm ma sát thao tác | web_script/Index.html | Loại bỏ padding thừa, thẻ việc nhỏ gọn, header mini, badge súc tích | [x] |
| C4.4 | Nâng cấp Kiến trúc Xử lý Ô Tính 50k ký tự & Chunking Backend | web_script/Code.gs | Tự động phân đoạn hoặc nén an toàn khi bài ghi vượt 50,000 ký tự | [x] |
| C4.5 | Đồng bộ hóa Trình Chạy Thử Cục Bộ `test_local.html` | web_script/test_local.html | Tinh gọn banner, mở rộng không gian hiển thị, giữ trọn mock RPC | [x] |

### Giai đoạn 5: Tự Động Xác Minh, Cập Nhật Tài Liệu & Git Commit
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| V5.1 | Chạy kiểm thử tự động toàn diện (10,000 lỗi + 1,000 UI + Code syntax) | scratch/verify_system_ops_and_ui_1000.py | 100% tests PASS không lỗi runtime / syntax | [x] |
| V5.2 | Cập nhật Bản đồ dự án & Sổ tay lệnh | DOCS/PROJECT_STRUCTURE_AND_MAP.md, DOCS/COMMANDS_PLAYBOOK.md | Kê khai đầy đủ cấu trúc mới và các lệnh vận hành | [x] |
| V5.3 | Đóng gói Git commit chuẩn Conventional | Git Repository | Commit sạch `feat(ops_ui): implement 10000 ops faults, 1000 ui refinements and clean codebase` | [x] |
