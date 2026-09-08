# CHECKLIST: KHẮC PHỤC TRIỆT ĐỂ LỖ HỔNG IDOR / BOLA / BROKEN ACCESS CONTROL & TENANT ISOLATION

> **Mục tiêu:** Phát hiện, phân tích, lập kế hoạch và khắc phục tận gốc 100% các lỗ hổng thuộc nhóm IDOR (Insecure Direct Object References), BOLA (Broken Object Level Authorization), Broken Access Control, Horizontal/Vertical Privilege Escalation và Tenant Isolation Failure trong hệ thống SNOTE (giữa Quản trị viên và Thành viên, giữa các Thành viên thuộc các Đồ án khác nhau).  
> **Quy chuẩn:** Tuân thủ `RULES.md` (Checklist-first workflow, Autonomous Execution, Zero Regression, Full Parity).

---

## 📋 DANH MỤC CÔNG VIỆC VÀ TRẠNG THÁI THỰC THI CHI TIẾT

### Giai đoạn 1: Phân Tích, Nghiên Cứu & Bóc Tách Vector Lỗ Hổng
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **A1.1** | Khảo sát định danh & cơ chế bảo mật theo OWASP Top 10 | Toàn bộ dự án | Định nghĩa chính xác IDOR, BOLA (OWASP API #1), Horizontal Escalation, Tenant Isolation Failure | [x] |
| **A1.2** | Rà soát các RPC endpoints trong `Code.gs` | `web_script/Code.gs` | Bóc tách 6 vector lỗi: Thao tác taskId/noteId không kiểm tra quyền, IDOR overwrite, thiếu phân quyền Admin | [x] |
| **A1.3** | Rà soát cầu nối gọi lệnh & chuyển đổi đồ án trong `Index.html` | `web_script/Index.html` | Phát hiện `callGasBackend` truyền `null`, `switchProjectDirectly` nhảy đồ án không cần mã PIN | [x] |
| **A1.4** | Lập Master Plan & Báo cáo kỹ thuật chi tiết | `idor_security_remediation_report.md` | Báo cáo đầy đủ thực trạng, nguyên nhân gốc rễ, sơ đồ luồng và giải pháp kiến trúc | [x] |

### Giai đoạn 2: Triển Khai Động Cơ Phân Quyền Backend (`Code.gs`)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **B2.1** | Xây dựng động cơ xác thực tập trung `verifyAuthContext` | `web_script/Code.gs` | Hỗ trợ 2 vai trò: ADMIN (sessionToken) và MEMBER (projectId + pinCode), cache 3600s, chặn IDOR sai projectId | [x] |
| **B2.2** | Gia cố bảo vệ Công việc (`saveTask`, `deleteTask`, `updateTaskStatus`, `updateTaskChecklist`) | `web_script/Code.gs` | Xác thực `taskPid`, chặn xóa/cập nhật chéo đồ án, ngăn chặn IDOR ghi đè đồ án khác khi saveTask | [x] |
| **B2.3** | Gia cố bảo vệ Ghi chú (`saveNote`, `togglePinNote`, `deleteNote`, `convertNoteToTask`) | `web_script/Code.gs` | Xác thực `notePid`, chặn đọc/ghi/xóa chéo đồ án, ngăn chặn IDOR đổi chủ quyền ghi chú | [x] |
| **B2.4** | Gia cố bảo vệ Lộ trình (`saveRoadmap`, `deleteRoadmap`, `convertBatchRoadmapToTasks`) | `web_script/Code.gs` | Xác thực `roadmapPid`, chặn xóa/ghi đè lộ trình của đồ án khác | [x] |
| **B2.5** | Enforce bắt buộc quyền ADMIN cho thao tác Đồ án (`saveProject`, `deleteProject`) | `web_script/Code.gs` | Thành viên thông thường bị từ chối 100% khi cố ý tạo, sửa thông tin, hoặc xóa đồ án | [x] |
| **B2.6** | Che giấu mã PIN công khai trong `fetchAllInitialData` | `web_script/Code.gs` | Che mã PIN thành `'****'` khi trả dữ liệu về trình duyệt công khai | [x] |

### Giai đoạn 3: Gia Cố Cổng Kiểm Soát Frontend (`Index.html`)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **C3.1** | Xây dựng bộ sinh ngữ cảnh bảo mật `getAuthContext()` | `web_script/Index.html` | Tự động đóng gói token nếu là Admin, hoặc projectId + pinCode nếu là Member | [x] |
| **C3.2** | Tự động tiêm `getAuthContext()` trong `callGasBackend` | `web_script/Index.html` | Tự động thay thế `args[0]` khi là `null` hoặc `undefined`, tương thích ngược toàn bộ call sites | [x] |
| **C3.3** | Đưa `getAuthContext()` vào hàng đợi đồng bộ ngoại tuyến `executeBatchSync` | `web_script/Index.html` | Mọi tác vụ offline sync khi kết nối lại đều mang theo ngữ cảnh phân quyền hợp lệ | [x] |
| **C3.4** | Chặn đứng hành vi nhảy đồ án trong `switchProjectDirectly` | `web_script/Index.html` | Nếu đồ án chưa xác thực PIN trên máy, lập tức chặn chuyển đổi, mở modal nhập PIN 4 số | [x] |
| **C3.5** | Cập nhật các form quản lý đồ án sang `getAuthContext()` | `web_script/Index.html` | `submitProjectModalForm`, `toggleArchiveProject`, `cloneProjectHandler`, `executeSafeDeleteProject` dùng `getAuthContext()` | [x] |

### Giai đoạn 4: Đồng Bộ Hóa Trình Giả Lập Cục Bộ (`test_local.html`)
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **D4.1** | Xây dựng bộ thẩm định phân quyền mock `verifyMockAuth` | `web_script/test_local.html` | Tái tạo chính xác 100% logic thẩm định Admin và Member của Google Apps Script | [x] |
| **D4.2** | Gia cố toàn bộ mock RPC methods | `web_script/test_local.html` | `saveTask`, `deleteTask`, `updateTaskStatus`, `updateTaskChecklist`, `saveNote`, `deleteNote`, `saveRoadmap`, `deleteRoadmap`, `saveProject`, `deleteProject` | [x] |

### Giai đoạn 5: Tự Động Hóa Kiểm Thử & Nghiệm Thu Toàn Diện
| ID | Hạng mục công việc | File liên quan | Tiêu chí đạt | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **E5.1** | Xây dựng kịch bản kiểm thử IDOR & Isolation | `scratch/verify_idor_and_isolation.py` | Bao phủ 25 kịch bản bảo mật chuyên sâu (Node V8 simulation + Static file analysis) | [x] |
| **E5.2** | Chạy kiểm thử hồi quy bảo mật mã PIN & sinh mã | `scratch/verify_pin_and_project_code.py` | 7/7 bộ kiểm thử đạt 100% PASS | [x] |
| **E5.3** | Chạy kiểm thử hồi quy 10,000 Lỗi Vận Hành & 1,000 Cải Tiến Giao Diện | `scratch/verify_system_ops_and_ui_1000.py` | 7/7 bộ kiểm thử đạt 100% PASS | [x] |
| **E5.4** | Cập nhật sổ tay lệnh & bản đồ dự án | `DOCS/COMMANDS_PLAYBOOK.md`, `DOCS/PROJECT_STRUCTURE_AND_MAP.md` | Bổ sung câu lệnh kiểm thử và cập nhật danh mục kiến trúc bảo mật | [x] |
| **E5.5** | Đóng gói và tạo commit Git chuẩn mực | Git Repository | Commit thành công với thông điệp rõ ràng theo chuẩn Conventional Commits | [x] |
