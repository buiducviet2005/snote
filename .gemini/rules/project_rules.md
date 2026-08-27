# QUY TẮC & LUẬT PHÁT TRIỂN DỰ ÁN SNOTE (PROJECT RULES)

Tài liệu này định nghĩa **toàn bộ các quy tắc, chuẩn mực, quyền tự chủ, định danh và quy trình bắt buộc** của người dùng đối với dự án **SNOTE**.

> 🔴 **ĐIỀU KIỆN TIÊN QUYẾT BẮT BUỘC (PREREQUISITE MANDATE):**  
> Trước khi thực thi **BẤT KỲ LỆNH, MÃ NGUỒN HOẶC HÀNH ĐỘNG NÀO** trong bất kỳ phiên làm việc nào, AI Agent **BẮT BUỘC PHẢI ĐỌC LẠI FILE `RULES.md`** để đảm bảo nắm vững toàn bộ quy tắc dự án và tuân thủ 100% không sai lệch.

---

## 🏷️ ĐIỀU 1: QUY ƯỚC TÊN DỰ ÁN & PHẦN MỀM (PROJECT NAMING RULE)

1. **Tên chính thức duy nhất:** Tên chính thức của phần mềm và toàn bộ dự án là **SNOTE**.
2. **Quy tắc chuyển đổi tự động:** Mọi từ ngữ, thuật ngữ, tên hiển thị, package name hoặc tài liệu nhắc đến tên sản phẩm/dự án (như *AI Note, AI_NOTE, ainote, ai-note*...) **đều tự động được chuẩn hóa và đổi thành SNOTE** trong toàn bộ mã nguồn, tài liệu và giao diện.

---

## 🏛️ ĐIỀU 2: CẤU TRÚC TIẾN TRÌNH DỰ ÁN (PROJECT ROADMAP)

Dự án SNOTE được triển khai nghiêm ngặt theo **Lộ trình 6 bước lớn tổng quát**:
1. **Bước 1:** Định nghĩa sản phẩm & phạm vi (`DOCS/step_1.md`).
2. **Bước 2:** Thiết kế mô hình dữ liệu & schema PostgreSQL (`DOCS/step_2.md`).
3. **Bước 3:** Thiết kế kiến trúc hệ thống & nền tảng (`DOCS/step_3.md`).
4. **Bước 4:** Triển khai backend core (Database migrations, Auth, APIs Notes/Tasks/Schedule/Backup).
5. **Bước 5:** Triển khai frontend & UX hoàn chỉnh cho sinh viên.
6. **Bước 6:** Tính năng nâng cao non-AI (Search, Sharing, Backup, Quyền riêng tư).
*(Kèm giai đoạn tăng cường: Bước 7 Lớp AI Roadmap & Bước 8 Vận hành).*

### ⚠️ QUY ĐỊNH ĐẶC BIỆT VỀ BƯỚC 3 LỚN:
**Bước 3 Lớn (Thiết kế Kiến trúc & Nền tảng) bắt buộc phải gồm đúng 7 bước nhỏ sau:**
- **Bước 3.1:** Chọn kiến trúc tổng thể (*Modular Monolith, ranh giới 1 transaction ACID trên PostgreSQL, future-ready cho AI*).
- **Bước 3.2:** Thiết kế domain nội bộ & ranh giới module (*10 Bounded Contexts, Layered Pattern, Acyclic Graph*).
- **Bước 3.3:** Chọn stack backend, thiết lập môi trường & dựng skeleton từ số 0 (*`DOCS/step_3_setup.md`*).
- **Bước 3.4:** Chọn stack frontend, thiết lập SPA Feature-based & React Router (*`DOCS/step_3_frontend.md`*).
- **Bước 3.5:** Thiết kế cấu trúc repo & tổ chức mã nguồn tổng thể (*`DOCS/step_3_repo_structure.md`*).
- **Bước 3.6:** Chuẩn hóa hệ thống Logging, Error Handling & Bảo mật Backend (*`DOCS/step_3_observability_security.md`*).
- **Bước 3.7:** Tổng kết chuẩn bảo mật & chuyển giao sang Bước 4 (Backend Core).

---

## 📑 ĐIỀU 3: QUYỀN TỰ CHỦ QUẢN LÝ, TÍCH HỢP & TÁCH TÀI LIỆU (DOCUMENT AUTONOMY)

1. **Tự động Tích hợp, Tách & Đánh số thứ tự:** Mỗi khi người dùng cung cấp dữ liệu mới (ví dụ: các bước chi tiết thực thi, tài liệu mô tả, kỹ thuật phát sinh), AI Agent **phải tự động phân loại, tích hợp vào tài liệu chung hoặc tách thành các file chuyên sâu riêng biệt** và đánh số thứ tự khoa học (ví dụ: `step_X.Y_...`) để dễ truy xuất.
2. **Quyền Tạo Mới không cần hỏi:** AI Agent **CÓ TOÀN QUYỀN TỰ ĐỘNG TẠO MỚI** tài liệu khi thấy cần thiết để mở rộng, module hóa hoặc làm chi tiết các bước mà **không cần hỏi lại người dùng**.
3. **Chuẩn mực Chất lượng Tài liệu:** Mọi tài liệu kỹ thuật tạo ra trong thư mục `DOCS/` tuyệt đối không chứa rác hội thoại, prompt phụ, link trích dẫn chatbot lộn xộn (`[^1_1]`) hay code trùng lặp.

---

## 🗺️ ĐIỀU 4: DUY TRÌ TỪ ĐIỂN MÃ NGUỒN & MA TRẬN CÔNG NGHỆ (PROJECT MAP & TECH MATRIX RULE)

1. **Duy trì Bản đồ & Từ điển Duy nhất:** Duy trì file **`DOCS/PROJECT_STRUCTURE_AND_MAP.md`** làm từ điển cấu trúc, danh mục mã nguồn và ma trận công nghệ duy nhất của dự án.
2. **Kê khai Toàn diện Công nghệ Sử dụng:**
   - Bắt buộc phải kê khai chi tiết toàn bộ các công nghệ, thư viện, framework, driver, database, công cụ:
     - **Tên công nghệ & phiên bản cụ thể**.
     - **Chức năng & Nhiệm vụ cốt lõi** trong hệ thống.
     - **Vị trí áp dụng cụ thể** trong dự án (`backend/`, `frontend/`, `packages/shared/`, `infrastructure`, `root`...).
     - **Lý do lựa chọn & vai trò kiến trúc**.
3. **Từ điển Cấu trúc & Tệp tin Chi tiết:**
   - Ghi rõ cấu trúc cây thư mục, tên mọi file, chức năng chi tiết của từng file, công nghệ sử dụng trong file đó và vị trí của chúng.
4. **Cập nhật Bắt buộc & Tức thì:** Mỗi khi thêm mới, sửa đổi hoặc xóa bất kỳ file, folder, thư viện công nghệ hay chức năng nào trong dự án, **phải cập nhật ngay lập tức** vào file `DOCS/PROJECT_STRUCTURE_AND_MAP.md` để có thể truy xuất và tìm hiểu bất cứ lúc nào.

---

## 📖 ĐIỀU 5: DUY TRÌ SỔ TAY CÂU LỆNH ĐIỀU KHIỂN DỰ ÁN (COMMAND PLAYBOOK RULE)

- Duy trì file **`DOCS/COMMANDS_PLAYBOOK.md`** làm sổ tay tra cứu toàn bộ câu lệnh điều khiển, vận hành và kiểm tra dự án SNOTE.
- **Yêu cầu bắt buộc:** Mỗi khi có chức năng mới, script mới, migration mới, lệnh API mới hoặc bất kỳ câu lệnh nào mà lập trình viên (Dev) cần biết để điều khiển hoặc kiểm tra dự án, **phải cập nhật và bổ sung ngay lập tức vào file `DOCS/COMMANDS_PLAYBOOK.md`**.

---

## 🧠 ĐIỀU 6: QUẢN LÝ TRI THỨC VÀ TÀI LIỆU DÀNH RIÊNG CHO CHAT AI (AI CHAT DOCS RULE)

1. **Thư mục Tri thức Chuyên biệt:** Duy trì thư mục **`DOCS/ai_chat_docs/`** làm trung tâm tri thức lưu trữ: các thành tựu đã đạt được, danh mục việc cần làm, quy trình kỹ thuật, hướng phát triển và các ranh giới/luật nghiên cứu để AI không đi lệch quỹ đạo.
2. **Nguyên tắc Tạo Mới Bất biến (Create New / Append-Only):** Mỗi khi tiếp nhận kiến thức mới, kỹ thuật mới hoặc tài liệu mới, AI Agent **phải tự động cập nhật và TẠO FILE TÀI LIỆU MỚI** trong thư mục `DOCS/ai_chat_docs/` để mở rộng tri thức, **TUYỆT ĐỐI KHÔNG CHỈNH SỬA / XÓA BỎ LÀM MẤT NGỮ CẢNH LỊCH SỬ**.

---

## ✅ ĐIỀU 7: QUY TRÌNH THỰC THI QUA CHECKLIST (CHECKLIST-FIRST WORKFLOW)

Mỗi khi thực thi bất kỳ nhiệm vụ nào gồm nhiều bước (Multi-step Task):
1. **Bước 1 (Checklist First):** **BẮT BUỘC PHẢI TẠO FILE CHECKLIST TRƯỚC** (dạng bảng Markdown có các ô `[ ]`, ID, mô tả công việc, file liên quan và tiêu chí đạt).
2. **Bước 2 (Execute):** Sau khi đã có file checklist, mới tiến hành thực thi tuần tự từng bước nhỏ.
3. **Bước 3 (Track Status):** Ngay sau khi hoàn thành mỗi bước nhỏ, **phải cập nhật ngay trạng thái từ `[ ]` thành `[x]`** trong file checklist để lưu vết tiến độ chính xác.

---

## ⚡ ĐIỀU 8: THỰC THI LỆNH & GIỚI HẠN THAO TÁC NGUY HIỂM (EXECUTION PROTOCOL)

1. **Tự động thực thi:** Chấp nhận tự động chạy mọi câu lệnh tạo file, sửa code, cài đặt thư viện (`npm install`), chạy build, test, khởi chạy server và thực thi các bước trong nhiệm vụ mà **không cần hỏi lại người dùng**.
2. **Chỉ hỏi khi thao tác nguy hiểm:** AI Agent **BẮT BUỘC PHẢI HỎI Ý KIẾN NGƯỜI DÙNG TRƯỚC KHI:**
   - Xóa file hoặc xóa thư mục trong dự án.
   - Chạy các lệnh có ảnh hưởng cực kỳ lớn hoặc không thể khôi phục (như drop database, xóa dữ liệu quan trọng, reset hard git làm mất commit...).

---

## ⚙️ ĐIỀU 9: QUY CHUẨN KỸ THUẬT & RÀNG BUỘC CỐT LÕI

1. **Kiến trúc Hệ thống:**
   - Sử dụng mô hình **Modular Monolith**: 1 Backend process duy nhất, 1 Database PostgreSQL duy nhất để giữ trọn vẹn ranh giới Transaction ACID.
   - Loại bỏ Microservices ở giai đoạn MVP để tránh phân tán transaction và network overhead.
   - Thiết kế module độc lập (DDD Bounded Contexts) để sẵn sàng tách riêng `ai-service` khi triển khai AI Roadmap.
2. **Ràng buộc Chống "Note Rác":**
   - Mọi ghi chú (`notes`) và công việc (`tasks`) **bắt buộc phải gắn với ít nhất một Môn học hoặc một Đồ án** (`subject_id IS NOT NULL OR project_id IS NOT NULL`). Không cho phép tạo note/task trôi nổi.
3. **Bảo mật & Quyền sở hữu (Anti-IDOR):**
   - Mọi câu lệnh truy vấn đọc/ghi của sinh viên bắt buộc phải lọc theo `userId` lấy từ JWT payload tại tầng Service/Repository. Tuyệt đối không tin tưởng param từ URL.
   - Cơ chế xác thực: JWT Access Token (ngắn hạn) + Refresh Token lưu trong cookie `httpOnly`, `Secure`.
4. **Cấu hình Fail-Fast (Startup Validation):**
   - Sử dụng **Zod** để validate biến môi trường ngay khi khởi động server. Nếu thiếu hoặc sai cấu hình, dừng tiến trình ngay lập tức (`process.exit(1)`).
5. **Structured Logging & Error Handling:**
   - Sử dụng **Pino** log định dạng JSON có cấu trúc, gắn kèm `x-request-id` cho từng request.
   - Middleware bắt lỗi tập trung: Map lỗi sang mã HTTP chuẩn, ghi log chi tiết nội bộ nhưng **không trả stack trace ra client**.
6. **Frontend Architecture:**
   - Tổ chức theo mô hình **Feature-based** (`features/notes`, `features/tasks`, `features/schedule`, `features/semesters`, `features/status`).
   - Sử dụng React 19 + TypeScript + React Router DOM (Client-side SPA).

---

## 🔒 ĐIỀU 10: QUẢN LÝ GIT & AN TOÀN MÃ NGUỒN

1. **Bảo mật thông tin:** Tuyệt đối không commit file `.env`, thư mục `node_modules/`, `dist/`, logs hay dữ liệu database cục bộ vào Git.
2. **Commit chuẩn mực:** Đặt commit message có cấu trúc rõ ràng theo chuẩn Conventional Commits (ví dụ: `feat: ...`, `docs: ...`, `fix: ...`, `refactor: ...`).
3. **Remote Repository:** Kho lưu trữ chính thức đặt tại: `https://github.com/naverisme/snote.git` (Branch: `main`).

---

*Tài liệu Quy tắc này có hiệu lực vĩnh viễn xuyên suốt vòng đời phát triển của dự án SNOTE.*
