# QUY TẮC & LUẬT PHÁT TRIỂN DỰ ÁN AI NOTE (PROJECT RULES)

Tài liệu này định nghĩa **toàn bộ các quy tắc, chuẩn mực và yêu cầu bắt buộc** của người dùng đối với dự án **AI Note (SNOTE)**. 

> 📌 **CHỈ THỊ DÀNH CHO AI AGENT (SYSTEM DIRECTIVE):**  
> Khi bắt đầu bất kỳ phiên làm việc mới (New Session / New Chat), AI Agent **bắt buộc phải đọc và tuân thủ 100% các quy tắc trong tài liệu này** trước khi thực hiện bất kỳ thao tác nào, đảm bảo tính liên tục, nhất quán và không làm sai lệch định hướng phát triển của người dùng.

---

## 🏛️ ĐIỀU 1: CẤU TRÚC TIẾN TRÌNH DỰ ÁN (PROJECT ROADMAP)

Dự án AI Note được triển khai nghiêm ngặt theo **Lộ trình 6 bước lớn tổng quát**:
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
- **Bước 3.5:** Thiết kế cấu trúc repo & tổ chức mã nguồn tổng thể.
- **Bước 3.6:** Chuẩn cấu hình môi trường & quản lý secrets (*Fail-fast Zod validation, .env.example*).
- **Bước 3.7:** Chuẩn logging, error handling & bảo mật cơ bản (*Pino JSON, Custom AppErrors, Dual-token JWT, anti-IDOR, Helmet, CORS*).

---

## 📚 ĐIỀU 2: NGUYÊN TẮC LƯU TRỮ & CẬP NHẬT TÀI LIỆU (DOCUMENTATION INTEGRITY)

1. **Mọi chi tiết đều phải thành văn bản:** Nội dung chi tiết của tất cả các bước nhỏ trong các bước lớn **đều phải được viết, lưu trữ và cập nhật vào thư mục `DOCS/`**, đảm bảo việc truy xuất và kiểm tra dữ liệu về sau không bị thất thoát.
2. **Không để rác và nội dung phân mảnh:** Mọi tài liệu kỹ thuật phải được sàng lọc kỹ:
   - Xóa bỏ 100% rác hội thoại, prompt phụ, link trích dẫn chatbot lộn xộn (`[^1_1]`) và hình ảnh logo thừa.
   - Hợp nhất các đoạn code starter và lý thuyết bị phân mảnh thành cấu trúc chuẩn mực, có thứ tự rõ ràng.

---

## 🗺️ ĐIỀU 3: DUY TRÌ TỪ ĐIỂN VÀ BẢN ĐỒ MÃ NGUỒN (PROJECT MAP RULE)

- Duy trì file **`DOCS/PROJECT_STRUCTURE_AND_MAP.md`** làm từ điển cấu trúc và bản đồ mã nguồn duy nhất.
- **Yêu cầu bắt buộc:** Mỗi khi thêm mới, sửa đổi hoặc xóa bất kỳ file, folder, thư viện công nghệ hay chức năng nào trong dự án, **phải cập nhật ngay lập tức** vào file `DOCS/PROJECT_STRUCTURE_AND_MAP.md`.

---

## ✅ ĐIỀU 4: QUẢN LÝ TIẾN ĐỘ QUA CHECKLIST

- Duy trì file **`DOCS/step_3_setup_checklist.md`** (và các bảng checklist tương ứng của các bước tiếp theo).
- Mỗi khi hoàn thành một tác vụ thực tế (code, config, test), phải cập nhật trạng thái từ `[ ]` thành `[x]` để theo dõi tiến độ chính xác.

---

## ⚙️ ĐIỀU 5: QUY CHUẨN KỸ THUẬT & RÀNG BUỘC CỐT LÕI

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
   - Tổ chức theo mô hình **Feature-based** (`features/notes`, `features/tasks`, `features/schedule`, `features/semesters`).
   - Sử dụng React 19 + TypeScript + React Router DOM (Client-side SPA).

---

## 🔒 ĐIỀU 6: QUẢN LÝ GIT & AN TOÀN MÃ NGUỒN

1. **Bảo mật thông tin:** Tuyệt đối không commit file `.env`, thư mục `node_modules/`, `dist/`, logs hay dữ liệu database cục bộ vào Git.
2. **Commit chuẩn mực:** Đặt commit message có cấu trúc rõ ràng theo chuẩn Conventional Commits (ví dụ: `feat: ...`, `docs: ...`, `fix: ...`, `refactor: ...`).
3. **Remote Repository:** Kho lưu trữ chính thức đặt tại: `https://github.com/naverisme/snote.git` (Branch: `main`).

---

*Tài liệu Quy tắc này có hiệu lực vĩnh viễn xuyên suốt vòng đời phát triển của dự án SNOTE.*
