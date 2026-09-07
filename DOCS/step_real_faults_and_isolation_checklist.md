# CHECKLIST: KHẮC PHỤC TRIỆT ĐỂ LỖI NGUYÊN LÝ THỰC TẾ & TÁI THIẾT 10,000 CÂU HỎI BẮT LỖI CỐT LÕI

> **Mục tiêu:** Bắt và sửa tận gốc toàn bộ các lỗi phân lập dữ liệu thực tế (Ghi chú dùng chung giữa các đồ án, Roadmap lấy `roadmaps[0]`, thiếu nút xóa Note, Bento đếm sai số lượng, thiếu phân quyền cá nhân/nhóm), đồng thời tái thiết toàn diện 10,000 câu hỏi bắt lỗi nguyên lý thực chiến dựa trên đúng mã nguồn của SNOTE.  
> **Quy chuẩn:** Tuân thủ RULES.md (Checklist First, Pure Vanilla ES6+, No external libraries).

---

## 📋 DANH MỤC CÔNG VIỆC CHI TIẾT

### Giai đoạn 1: Lập Kế Hoạch & Ma Trận Lỗi Thực Tế Đã Khảo Sát
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| P1.1 | Khảo sát 8 lỗi logic & phân lập thực tế trong Index.html | web_script/Index.html | Bóc tách chính xác: Notes không lọc, Roadmaps[0], Bento sai count, thiếu deleteNote, Global Search lệch project | [x] |
| P1.2 | Xây dựng Master Plan Artifact có RequestFeedback | artifact/real_faults_and_isolation_remediation_plan.md | Trình bản kế hoạch chi tiết, nêu rõ nguyên nhân và giải pháp sửa code | [x] |

### Giai đoạn 2: Tái Thiết 10,000 Câu Hỏi Bắt Lỗi Nguyên Lý Thực Chiến (10 Tập x 1,000 Câu)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| Q2.1 | Viết lại Python Generator Engine tập trung vào lỗi thực tế | scratch/generate_10000_real_code_faults.py | Sinh 10,000 câu hỏi bám sát logic hàm, biến STATE, và các ca rò rỉ ngữ cảnh thực tế | [x] |
| Q2.2 | Tập 1: Bắt lỗi Thực Tế Cổng Xác Thực & Phiên | DOCS/ai_chat_docs/fault_finding_10000/vol_01_auth_session_faults.md | 1,000 câu hỏi thực tế về PIN lockout, session refresh, role desync | [x] |
| Q2.3 | Tập 2: Bắt lỗi Thực Tế Phân Lập Dự Án & Ngữ Cảnh Chéo | DOCS/ai_chat_docs/fault_finding_10000/vol_02_project_isolation_faults.md | 1,000 câu hỏi thực tế về rò rỉ dữ liệu giữa các đồ án, cascade delete | [x] |
| Q2.4 | Tập 3: Bắt lỗi Thực Tế Động Cơ Tasks & Phân Trang Table | DOCS/ai_chat_docs/fault_finding_10000/vol_03_tasks_state_faults.md | 1,000 câu hỏi thực tế về kẹt trang trắng pagination, Kanban DnD | [x] |
| Q2.5 | Tập 4: Bắt lỗi Thực Tế Checklists & Tiến Độ Cây | DOCS/ai_chat_docs/fault_finding_10000/vol_04_checklist_hierarchy_faults.md | 1,000 câu hỏi thực tế về mảng rỗng, ID sinh trùng, tiến độ NaN | [x] |
| Q2.6 | Tập 5: Bắt lỗi Thực Tế Biểu Đồ Gantt & Date Clamping | DOCS/ai_chat_docs/fault_finding_10000/vol_05_gantt_coordinate_faults.md | 1,000 câu hỏi thực tế về vỡ tọa độ pixel, task kéo lệch biên | [x] |
| Q2.7 | Tập 6: Bắt lỗi Thực Tế Kho Ghi Chú & Phân Quyền Cá Nhân/Nhóm | DOCS/ai_chat_docs/fault_finding_10000/vol_06_notes_markdown_faults.md | 1,000 câu hỏi thực tế về lỗi dùng chung ghi chú, thiếu nút xóa, ReDoS | [x] |
| Q2.8 | Tập 7: Bắt lỗi Thực Tế Lộ Trình Roadmaps DFA | DOCS/ai_chat_docs/fault_finding_10000/vol_07_dfa_statemachine_faults.md | 1,000 câu hỏi thực tế về lỗi roadmaps[0], đệ quy chu trình, duplicate task | [x] |
| Q2.9 | Tập 8: Bắt lỗi Thực Tế Hàng Đợi Đồng Bộ & Retry Jitter | DOCS/ai_chat_docs/fault_finding_10000/vol_08_sync_offline_faults.md | 1,000 câu hỏi thực tế về nghẽn mạng, rollback lạc quan, batch merge | [x] |
| Q2.10 | Tập 9: Bắt lỗi Thực Tế Vòng Đời DOM & Tìm Kiếm Toàn Cục | DOCS/ai_chat_docs/fault_finding_10000/vol_09_dom_memory_lifecycle_faults.md | 1,000 câu hỏi thực tế về search lệch project, rò rỉ listener, focus trap | [x] |
| Q2.11 | Tập 10: Bắt lỗi Thực Tế Quota Apps Script & Thảm Họa Dữ Liệu | DOCS/ai_chat_docs/fault_finding_10000/vol_10_gas_quota_recovery_faults.md | 1,000 câu hỏi thực tế về timeout 6 phút, ô tính 50k ký tự, backup | [x] |
| Q2.12 | Cập nhật Ma Trận Tổng Hợp Lỗi & Giải Pháp Sửa Mã Nguồn | DOCS/ai_chat_docs/fault_finding_10000/master_fault_remediation_matrix.md | Bản đồ quy chuẩn kỹ thuật xử lý triệt để 10 nhóm lỗi | [x] |

### Giai đoạn 3: Khắc Phục Triệt Để Mã Nguồn Hiện Có
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| C3.1 | Phân lập Kho Ghi Chú theo Đồ án (`getFilteredNotes`) | web_script/Index.html | Mỗi đồ án chỉ thấy ghi chú của mình, không rò rỉ sang đồ án khác | [x] |
| C3.2 | Tự động Reset & Chọn Note khi chuyển đổi Đồ án | web_script/Index.html | Chuyển đồ án tự động chọn note đầu hoặc dọn sạch editor nếu rỗng | [x] |
| C3.3 | Bổ sung Chức năng Xóa Ghi Chú (`deleteNoteHandler`) | web_script/Index.html | Thêm nút 🗑️ Xóa Note trên thanh công cụ, đồng bộ backend an toàn | [x] |
| C3.4 | Phân loại Quyền Riêng Tư: Ghi chú Nhóm vs Cá nhân | web_script/Index.html, web_script/Code.gs | Hỗ trợ trường `scope: 'TEAM' / 'PRIVATE'`, tabs lọc trực quan | [x] |
| C3.5 | Phân lập Lộ Trình Roadmaps DFA theo Đồ án | web_script/Index.html | Loại bỏ `roadmaps[0]`, lấy đúng roadmap theo `currentProject.projectId` | [x] |
| C3.6 | Sửa đếm số lượng Ghi chú trong Bento Dashboard | web_script/Index.html | Bento `elNotesCount` đếm theo ghi chú của đồ án hiện tại | [x] |
| C3.7 | Sửa Tìm kiếm Toàn cục đồng bộ ngữ cảnh Đồ án | web_script/Index.html | Click item từ search tự động switch đúng project trước khi mở view | [x] |
| C3.8 | Đồng bộ Trình Giả Lập Local Browser Runner (`test_local.html`) | web_script/test_local.html | Bổ sung mock `deleteNote`, `deleteTask`, `deleteRoadmap`, `executeBatchSync`, đa dự án phân lập | [x] |

### Giai đoạn 4: Kiểm Thử Tự Động & Nghiệm Thu
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| V4.1 | Xây dựng bộ kiểm thử xác minh phân lập & 10,000 câu hỏi | scratch/verify_real_faults_and_isolation.py | Kiểm tra phân lập project, syntax JS và 10,000 câu hỏi pass 100% | [x] |
| V4.2 | Cập nhật tài liệu dự án và Walkthrough báo cáo người dùng | DOCS/, walkthrough.md | Cập nhật PROJECT_STRUCTURE_AND_MAP.md và walkthrough chi tiết | [x] |
