# CHECKLIST KIỂM TRA TÍNH NĂNG, 10,000 CÂU HỎI BẮT LỖI NGUYÊN LÝ HOẠT ĐỘNG & TÁI CẤU TRÚC HỆ THỐNG SNOTE

> **Mục tiêu:** Rà soát toàn bộ tính năng hiện có, sinh 10,000 câu hỏi bắt lỗi nguyên lý hoạt động chuyên sâu (10 tập x 1,000 câu), tổng hợp giải pháp kỹ thuật triệt để và thực thi tái cấu trúc kiến trúc (Modular Namespace & Event-Driven Architecture) cho `Index.html` & `Code.gs`.  
> **Quy chuẩn:** Tuân thủ RULES.md (Checklist-first, Autonomous Task Execution, No external libraries, Pure Vanilla ES6+).

---

## 📋 DANH MỤC CÁC GIAI ĐOẠN THỰC THI

### Giai đoạn 1: Kế Hoạch & Ma Trận Kiểm Tra Tính Năng Hiện Có
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt (Acceptance Criteria) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| P1.1 | Rà soát toàn diện 10 cụm tính năng hiện có của SNOTE Web Script | web_script/Index.html, web_script/Code.gs | Bóc tách toàn bộ 107 hàm frontend và 48 hàm backend | [x] |
| P1.2 | Xây dựng Master Implementation Plan Artifact có RequestFeedback | artifact/feature_fault_finding_10000_and_structural_refactor_plan.md | Bản kế hoạch chi tiết, rõ ràng, sẵn sàng trình người dùng | [x] |

### Giai đoạn 2: Tạo Động Cơ Sinh 10,000 Câu Hỏi Bắt Lỗi Nguyên Lý Hoạt Động
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| Q2.1 | Thiết kế Python Generator Engine cho 10,000 câu hỏi bắt lỗi | scratch/generate_10000_fault_finding_questions.py | Động cơ sinh 10 tập chuyên sâu với ID, Câu hỏi bắt lỗi, Lỗ hổng nguyên lý, Giải pháp khắc phục | [x] |
| Q2.2 | Tập 1: Bắt lỗi Cổng Xác Thực, PIN & Quản Lý Phiên (1,000 câu) | DOCS/ai_chat_docs/fault_finding_10000/vol_01_auth_session_faults.md | Q00001 - Q01000: Race conditions, session replay, token leakage | [x] |
| Q2.3 | Tập 2: Bắt lỗi Không Gian Dự Án, Phân Lập & Xóa Tầng (1,000 câu) | DOCS/ai_chat_docs/fault_finding_10000/vol_02_project_isolation_faults.md | Q01001 - Q02000: Multi-tenant boundary leak, cascade delete dangling records | [x] |
| Q2.4 | Tập 3: Bắt lỗi Động Cơ Công Việc & Chuyển Trạng Thái (1,000 câu) | DOCS/ai_chat_docs/fault_finding_10000/vol_03_tasks_state_faults.md | Q02001 - Q03000: Kanban DnD mutations, Eisenhower logic mismatch, sorting glitches | [x] |
| Q2.5 | Tập 4: Bắt lỗi Cấu Trúc Danh Sách Con & Checklist Lồng (1,000 câu) | DOCS/ai_chat_docs/fault_finding_10000/vol_04_checklist_hierarchy_faults.md | Q03001 - Q04000: JSON schema divergence, recursive progress calculation bugs | [x] |
| Q2.6 | Tập 5: Bắt lỗi Biểu Đồ Tiến Độ Gantt & Toán Tọa Độ (1,000 câu) | DOCS/ai_chat_docs/fault_finding_10000/vol_05_gantt_coordinate_faults.md | Q04001 - Q05000: Date clamping, timezone drift, SVG layout wrap, pixel overflow | [x] |
| Q2.7 | Tập 6: Bắt lỗi Trình Soạn Thảo Ghi Chú, Markdown & LaTeX (1,000 câu) | DOCS/ai_chat_docs/fault_finding_10000/vol_06_notes_markdown_faults.md | Q05001 - Q06000: ReDoS in regex, inline checklist desync, MathJax/KaTeX fallbacks | [x] |
| Q2.8 | Tập 7: Bắt lỗi Máy Trạng Thái DFA & Lập Lịch Tự Động (1,000 câu) | DOCS/ai_chat_docs/fault_finding_10000/vol_07_dfa_statemachine_faults.md | Q06001 - Q07000: Syntax parser recursion, cyclic dependency deadlocks, batch atomicity | [x] |
| Q2.9 | Tập 8: Bắt lỗi Bộ Đồng Bộ Hóa, Hàng Đợi & Ngoại Tuyến (1,000 câu) | DOCS/ai_chat_docs/fault_finding_10000/vol_08_sync_offline_faults.md | Q07001 - Q08000: Stale payload overwriting, backoff overflow, queue duplicate executions | [x] |
| Q2.10 | Tập 9: Bắt lỗi DOM, Bộ Nhớ, Vòng Đời & Sự Kiện (1,000 câu) | DOCS/ai_chat_docs/fault_finding_10000/vol_09_dom_memory_lifecycle_faults.md | Q08001 - Q09000: Global pollution, detached DOM memory leaks, event listener stack | [x] |
| Q2.11 | Tập 10: Bắt lỗi An Toàn Nền Tảng, Quota Apps Script & Phục Hồi (1,000 câu) | DOCS/ai_chat_docs/fault_finding_10000/vol_10_gas_quota_recovery_faults.md | Q09001 - Q10000: Apps Script quota exhaustion, lock timeouts, backup corruption | [x] |
| Q2.12 | Biên soạn Ma trận Tổng hợp Lỗi Nguyên Lý & Giải Pháp Khắc Phục | DOCS/ai_chat_docs/fault_finding_10000/master_fault_remediation_matrix.md | Bản đồ toàn diện 10 cụm lỗi nguyên lý & kiến trúc chuẩn hóa | [x] |

### Giai đoạn 3: Tái Cấu Trúc Hệ Thống (Structural Architecture Refactoring)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| R3.1 | Tái cấu trúc Backend Code.gs: Envelope chuẩn, Error Boundary & Lock Guards | web_script/Code.gs | Chuẩn hóa Envelope phản hồi `{ success, data, error, meta }`, xử lý Lock timeout | [x] |
| R3.2 | Tái cấu trúc Frontend Index.html: Module Hóa Namespace (`SNOTE.Store`, `SNOTE.EventBus`) | web_script/Index.html | Chuyển đổi kiến trúc từ biến toàn cục sang Central Store có Subscriber & Pub/Sub EventBus | [x] |
| R3.3 | Chuẩn hóa Hệ Thống Subtask/Checklist & Gantt Geometry Engine | web_script/Index.html | Chuẩn hóa schema mảng `[{id, text, completed}]`, chặn triệt để NaN/Undefined trong Gantt math | [x] |
| R3.4 | Đóng gói Module Tính Năng (Projects, Tasks, Notes, DFA, Sync, UI) | web_script/Index.html | Module hóa mạch lạc, giữ nguyên 100% chức năng và giao diện hiện tại | [x] |

### Giai đoạn 4: Kiểm Thử Tự Động & Bàn Giao
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| V4.1 | Xây dựng bộ kiểm thử xác minh 10,000 câu hỏi & kiến trúc refactor | scratch/verify_faults_and_refactor.py | Kiểm tra tính toàn vẹn 10,000 câu hỏi và cú pháp JS pass 100% | [x] |
| V4.2 | Cập nhật Bản đồ Cấu trúc Dự án & Sổ tay Lệnh | DOCS/PROJECT_STRUCTURE_AND_MAP.md, DOCS/COMMANDS_PLAYBOOK.md | Cập nhật đầy đủ kiến trúc mới | [x] |
| V4.3 | Biên soạn Walkthrough nghiệm thu chi tiết | walkthrough.md | Báo cáo hoàn tất gửi người dùng | [x] |
