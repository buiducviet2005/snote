# CHECKLIST THỰC THI 10,000 KỊCH BẢN BẢO MẬT & VẬN HÀNH VÀ CẢI TIẾN SNOTE

> **Mục tiêu:** Sinh 10,000 kịch bản chi tiết qua 10 tập chuyên khảo, tổng hợp rủi ro và tiến hành cải tiến mã nguồn Code.gs & Index.html.  
> **Quy chuẩn:** Tuân thủ RULES.md (Checklist First & Autonomous Task Execution Protocol).

---

## 📋 DANH MỤC THỰC THI

### Giai đoạn 1: Thiết lập Động Cơ Sinh Ma Trận 10,000 Kịch Bản (Matrix Generator Engine)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt (Acceptance Criteria) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| S1.1 | Xây dựng Python Generator Engine | scratch/generate_10000_scenarios.py | Sinh cấu trúc 10 tập x 1,000 trường hợp có ID, Risk, Root Cause, Solution | [x] |

### Giai đoạn 2: Tạo Trọn Vẹn 10 Tập Bách Khoa Toàn Thư (10,000 Kịch Bản)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| S2.1 | Tập 1: Bảo mật Ứng dụng & Phòng thủ Mã độc (1,000 TH) | DOCS/ai_chat_docs/10000_scenarios/vol_01_app_security.md | 1,000 kịch bản XSS, Formula Injection, CSRF, ReDoS, v.v. | [x] |
| S2.2 | Tập 2: Xác thực, Phân quyền & Quản lý Phiên (1,000 TH) | DOCS/ai_chat_docs/10000_scenarios/vol_02_auth_session.md | 1,000 kịch bản Brute-force PIN, IDOR, Session Hijack, RBAC | [x] |
| S2.3 | Tập 3: Đồng bộ Dữ liệu, Xung đột & Khóa Lạc quan (1,000 TH) | DOCS/ai_chat_docs/10000_scenarios/vol_03_sync_concurrency.md | 1,000 kịch bản Version conflict, Two-way deadlocks, Split-brain | [x] |
| S2.4 | Tập 4: Khả năng Chịu lỗi Ngoại tuyến & Bộ Nhớ Đệm (1,000 TH) | DOCS/ai_chat_docs/10000_scenarios/vol_04_offline_cache.md | 1,000 kịch bản SafeStorage limits, FIFO queue, Flapping network | [x] |
| S2.5 | Tập 5: Giới hạn Nền tảng Google Apps Script & Sheets (1,000 TH) | DOCS/ai_chat_docs/10000_scenarios/vol_05_gas_limits.md | 1,000 kịch bản 6-min timeout, 30 concurrent quota, 50k char limit | [x] |
| S2.6 | Tập 6: Hiệu năng Frontend, 60fps & Dữ liệu Lớn (1,000 TH) | DOCS/ai_chat_docs/10000_scenarios/vol_06_frontend_perf.md | 1,000 kịch bản Kanban 1000+ items, Gantt math, Memory leaks | [x] |
| S2.7 | Tập 7: Toàn vẹn Dữ liệu, ERD & Ràng buộc Khóa Ngoại (1,000 TH) | DOCS/ai_chat_docs/10000_scenarios/vol_07_data_integrity.md | 1,000 kịch bản Orphan records, Cascade rules, Note backlinks | [x] |
| S2.8 | Tập 8: Trình Phân Giải Ngữ Pháp DFA & Thuật Toán Gối Đầu (1,000 TH) | DOCS/ai_chat_docs/10000_scenarios/vol_08_dfa_parser.md | 1,000 kịch bản Syntax errors, Infinite loops, Cascading date math | [x] |
| S2.9 | Tập 9: Vận hành DevOps, Sao lưu & Khôi phục Thảm họa (1,000 TH) | DOCS/ai_chat_docs/10000_scenarios/vol_09_devops_backup.md | 1,000 kịch bản Sheet deletion, Corrupt row repair, Timezones | [x] |
| S2.10 | Tập 10: Trải nghiệm Người dùng, Trạng thái Biên & A11y (1,000 TH) | DOCS/ai_chat_docs/10000_scenarios/vol_10_ux_edge_cases.md | 1,000 kịch bản Double-tap spam, Touch DnD, Unicode, Extreme zoom | [x] |

### Giai đoạn 3: Tổng Hợp Bản Đồ Rủi Ro & Lỗ Hổng Chí Mạng (Risk Matrix)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| S3.1 | Biên soạn Master Risk & Remediation Matrix | DOCS/ai_chat_docs/10000_scenarios/master_risk_and_remediation_matrix.md | Tổng hợp các điểm nghẽn và nguyên tắc khắc phục cốt lõi | [x] |

### Giai đoạn 4: Cải Tiến Mã Nguồn Thực Tế (Code Enhancements)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| S4.1 | Rate-limiting & Chống Brute-force PIN trên Backend | web_script/Code.gs | Khóa thử lại sau 5 lần nhập sai mã PIN | [x] |
| S4.2 | Cơ chế Tự Khôi Phục Schema (Self-Healing Sheets) | web_script/Code.gs | Tự động phục hồi headers nếu bị xóa hoặc thay đổi | [x] |
| S4.3 | Exponential Backoff & Jitter Retry cho Batch Sync | web_script/Index.html | Tự động dãn cách thử lại khi chạm Quota hạn ngạch Apps Script | [x] |
| S4.4 | Phòng chống Prototype Pollution & Deep Input Sanitization | web_script/Index.html | Loại bỏ __proto__, constructor và URL javascript: độc hại | [x] |
| S4.5 | Tự động Phân Mảnh Ghi Chú Lớn (Auto-Chunking > 40k chars) | web_script/Index.html | Không bao giờ bị lỗi vượt giới hạn 50,000 ký tự ô Sheets | [x] |

### Giai đoạn 5: Kiểm Thử Tự Động & Báo Cáo Nghiệm Thu
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| S5.1 | Bộ kiểm thử tự động xác minh 10,000 kịch bản & code fixes | scratch/verify_10000_and_improvements.py | Kiểm tra đủ 10,000 kịch bản và các cải tiến pass 100% | [x] |
| S5.2 | Cập nhật tài liệu dự án và Walkthrough | DOCS/, walkthrough.md | Cập nhật PROJECT_STRUCTURE_AND_MAP.md và sổ tay câu lệnh | [x] |
