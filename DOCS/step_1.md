# Bước 1 – Định nghĩa Sản phẩm & Phạm vi (AI Note)

---

## 1. Tên Sản phẩm, Tagline & Tầm nhìn (Vision)

- **Tên sản phẩm:** AI Note – Hệ thống ghi chú và quản lý công việc học tập chuyên sâu cho sinh viên.
- **Tagline:** *"Second brain cho sinh viên – Một nơi duy nhất để ghi chú, quản lý bài tập và chuẩn bị ôn thi có cấu trúc."*
- **Tầm nhìn (Product Vision):**  
  AI Note hướng tới việc trở thành "bộ não thứ hai" (second brain) đồng hành cùng sinh viên xuyên suốt các năm đại học và tiếp tục sử dụng khi đi làm. Hệ thống cung cấp một không gian duy nhất để tổ chức ghi chú bài giảng, tài liệu ôn tập, bài tập lớn, đồ án và lịch trình học tập.  
  Triết lý cốt lõi là xây dựng **nền tảng non-AI ổn định, vững chắc** làm lớp lõi trước, giải quyết triệt để nhu cầu tổ chức dữ liệu học tập; sau đó tích hợp **lớp AI thông minh** (tóm tắt, phân loại, liên kết ghi chú, sinh đề ôn tập) như một công cụ gia tăng giá trị mà không làm xáo trộn trải nghiệm người dùng.

---

## 2. Đối tượng Mục tiêu & Chân dung Người dùng (Personas)

### 2.1. Nhóm người dùng chính
Sinh viên các trường đại học/cao đẳng (ưu tiên khối ngành Kỹ thuật, Công nghệ thông tin, Kinh tế, Y khoa...) – những người có từ 5–8 môn học mỗi kỳ, đối mặt với khối lượng lớn bài giảng, bài tập nhóm, đồ án và lịch thi dày đặc, hiện đang gặp tình trạng dữ liệu học tập bị phân mảnh trên nhiều ứng dụng.

### 2.2. Chân dung Người dùng Đại diện (Personas)

#### Persona 1: "Minh" – Sinh viên Công nghệ Thông tin (Năm 2)
- **Bối cảnh:** Mỗi kỳ học 5–7 môn (Cơ sở dữ liệu, Cấu trúc dữ liệu, Mạng máy tính...). Ghi chép rải rác trên Google Docs, Notion, sổ tay và tin nhắn.
- **Nỗi đau (Pain points):**
  - Quên deadline nộp bài tập và bài tập lớn.
  - Đến kỳ thi không tìm lại được ghi chú bài giảng nằm ở file nào, thư mục nào.
  - Ghi chép nhiều nhưng không gắn liền với môn học, tạo thành "kho note rác" không dùng lại được.
- **Nhu cầu:** Một hệ thống duy nhất tổ chức theo môn/học kỳ, cho phép tạo task trực tiếp từ note bài giảng, xem lịch task theo tuần/tháng và lọc nhanh theo môn để chuẩn bị ôn thi.

#### Persona 2: "Lan" – Sinh viên Kinh tế làm Đồ án Nhóm (Năm 3)
- **Bối cảnh:** Thường xuyên làm việc nhóm 3–5 người/môn học. Sử dụng Zalo, Google Drive và Google Sheets để giao việc và gửi tài liệu.
- **Nỗi đau (Pain points):**
  - Mất dấu tiến độ của từng thành viên trong nhóm.
  - Tài liệu tham khảo và biên bản họp nhóm bị trôi tin nhắn.
  - Dữ liệu đồ án bị lẫn lộn với tài liệu cá nhân.
- **Nhu cầu:** Một không gian (Board/Project) gắn với môn học để lưu trữ ghi chú họp, tài liệu và phân chia task cho thành viên, đồng thời vẫn bảo vệ tính riêng tư của ghi chú cá nhân.

---

## 3. Vấn đề Cốt lõi & Use Cases Ưu tiên

### 3.1. Các vấn đề cốt lõi cần giải quyết
1. **Phân mảnh dữ liệu:** Ghi chú và công việc học tập nằm rải rác, thiếu cấu trúc phân cấp (Học kỳ $\rightarrow$ Môn học/Đồ án).
2. **Quên deadline & Mất kiểm soát tiến độ:** Không có cái nhìn toàn cảnh về các việc cần làm trong tuần/tháng theo từng môn.
3. **Hiện tượng "Note rác" (Junk Notes):** Ghi chép không gắn ngữ cảnh, không tag, không format, dẫn đến việc bỏ xó và không tái sử dụng khi ôn thi.
4. **Công cụ hiện tại quá phức tạp hoặc quá chung chung:** Các công cụ như Notion hay Obsidian đòi hỏi cấu hình phức tạp, trong khi Google Keep hay Apple Notes thiếu các khái niệm học thuật (Môn học, Học kỳ, Deadline, Kỳ thi).

### 3.2. Use Cases Ưu tiên (MVP)

#### Nhóm Cá nhân:
- **Ghi chú bài giảng theo môn:** Tạo ghi chú, chọn môn học, chọn loại nội dung (`lecture`, `assignment`, `exam_review`), gắn tag chủ đề.
- **Chuyển hóa ghi chú thành công việc (Task creation):** Tạo task có deadline, mức độ ưu tiên (`HIGH`, `MEDIUM`, `LOW`) trực tiếp từ nội dung bài giảng.
- **Lập kế hoạch tuần/tháng:** Xem lịch trình học tập, lọc task theo trạng thái (`TODO`, `IN_PROGRESS`, `DONE`) và môn học.
- **Ôn tập theo chuyên đề:** Lọc toàn bộ ghi chú và task có tag liên quan (ví dụ `#normalization`, `#midterm`) để chuẩn bị thi.

#### Nhóm Đồ án / Bài tập lớn:
- **Quản lý đồ án nhóm:** Tạo project thuộc môn học, mời thành viên, gán việc và chia sẻ tài liệu chung.
- **Xuất dữ liệu an toàn:** Xuất toàn bộ ghi chú ra Markdown hoặc JSON khi kết thúc môn học.

---

## 4. Phạm vi Chức năng (Scope) & Lộ trình AI (Roadmap)

### 4.1. Trong phạm vi MVP (Non-AI Core)

| Phân hệ | Chức năng chi tiết trong MVP |
| :--- | :--- |
| **Quản lý Học kỳ** | Tạo, sửa, đóng/lưu trữ học kỳ; thiết lập học kỳ hiện tại (`is_current`). |
| **Quản lý Môn học** | Quản lý danh sách môn theo học kỳ, mã môn, số tín chỉ, giảng viên, màu sắc nhận diện. |
| **Quản lý Đồ án** | Tạo đồ án/bài tập lớn thuộc học kỳ hoặc môn học, quản lý danh sách thành viên (`project_members`). |
| **Ghi chú (Notes)** | Soạn thảo ghi chú (Markdown format), phân loại `note_type`, ghim (`is_pinned`), gắn Môn học/Đồ án và Tags. |
| **Công việc (Tasks)** | Quản lý todo-list học tập, deadline (`due_at`), độ ưu tiên (`priority`), trạng thái (`status`), liên kết với Notes. |
| **Lịch trình (Schedule)** | Lịch tuần/tháng hiển thị thời khóa biểu, lịch thi, deadline bài tập với bộ lọc theo môn học. |
| **Tiến độ (Progress)** | Thống kê số lượng task hoàn thành, task trễ hạn, tỷ lệ hoàn thành theo môn học/học kỳ. |
| **Tìm kiếm (Search)** | Tìm kiếm Full-Text Search theo tiêu đề, nội dung ghi chú kết hợp bộ lọc đa tiêu chí (môn, tag, thời gian). |
| **Sao lưu & Xuất dữ liệu** | Xuất ghi chú dạng file `.md`, xuất toàn bộ cấu trúc dữ liệu dạng `.json` theo môn học hoặc học kỳ. |

### 4.2. Ngoài phạm vi MVP (Out of Scope)
- Không làm tính năng Real-time Collaborative Editor đồng thời (như Google Docs).
- Không tích hợp đồng bộ hai chiều với LMS trường học (Canvas, Moodle) hoặc Google Classroom trong giai đoạn đầu.
- Không làm mobile native app đa nền tảng có offline-sync phức tạp (tập trung Web App responsive trước).
- Không phân quyền doanh nghiệp nhiều tầng phức tạp.

### 4.3. Lộ trình Tích hợp AI (AI Roadmap)
- **AI v1 (Tóm tắt & Gợi ý Tag):** Tự động tóm tắt bài giảng dài thành ý chính (bullet points); tự động trích xuất từ khóa và đề xuất tag môn học.
- **AI v2 (Liên kết Ngữ nghĩa & Q&A):** Gợi ý các ghi chú liên quan cùng chủ đề; hỏi-đáp trên kho dữ liệu ghi chú của sinh viên (RAG cá nhân hóa).
- **AI v3 (Sinh Đề ôn tập & Flashcards):** Tự động sinh flashcards và bộ câu hỏi trắc nghiệm/tự luận từ ghi chú bài giảng để ôn thi.
- **AI v4 (Trợ lý Lập kế hoạch Học tập):** Dựa vào deadline và độ ưu tiên để đề xuất lịch trình ôn thi tối ưu cho sinh viên.

---

## 5. Triết lý Tổ chức Thông tin & Chống "Note Rác"

### 5.1. Trục phân cấp dữ liệu chuẩn

```text
Người dùng (User)
└── Học kỳ (Semester)
    ├── Môn học (Subject)
    │   ├── Ghi chú (Notes)
    │   └── Công việc (Tasks)
    └── Đồ án (Project)
        ├── Ghi chú (Notes)
        └── Công việc (Tasks)
```

- **Quyền sở hữu (Ownership):** Mọi thực thể dữ liệu luôn thuộc về một `user_id`.
- **Cơ chế Tag bổ trợ:** Tag đóng vai trò liên kết ngang (chương, chủ đề, dạng bài tập), không thay thế trục phân cấp chính.

### 5.2. Chuẩn hóa Phân loại & Trạng thái

```text
note_type:
├── LECTURE       (Bài giảng trên lớp)
├── ASSIGNMENT    (Đề bài & hướng dẫn bài tập)
├── EXAM_REVIEW   (Tài liệu tổng hợp ôn thi)
├── RESOURCE      (Tài liệu tham khảo, liên kết)
└── IDEA          (Ý tưởng đồ án, nghiên cứu)

task_status:
├── TODO          (Chưa bắt đầu)
├── IN_PROGRESS   (Đang thực hiện)
└── DONE          (Đã hoàn thành)

task_priority:
├── LOW           (Ưu tiên thấp)
├── MEDIUM        (Ưu tiên trung bình)
└── HIGH          (Ưu tiên cao / Gấp)
```

### 5.3. Nguyên tắc Chống "Note Rác"
1. **Ràng buộc ngữ cảnh bắt buộc:** Một ghi chú/công việc **bắt buộc phải thuộc về ít nhất một Môn học hoặc một Đồ án** (`subject_id IS NOT NULL OR project_id IS NOT NULL`). Không cho phép tạo ghi chú trôi nổi không nơi lưu trữ.
2. **Khuyến khích gắn nhãn (Tags):** Giao diện luôn gợi ý gắn ít nhất một nhãn chủ đề/chương để hỗ trợ bộ lọc ôn thi.
3. **Tìm kiếm theo ngữ cảnh:** Luôn hiển thị kết quả tìm kiếm gắn kèm tên môn học và học kỳ tương ứng.

---

## 6. Tiêu chí Hoàn thành Bước 1 (Definition of Done)

- [x] Đã xác định rõ tên sản phẩm, tagline và tầm nhìn dài hạn.
- [x] Đã xây dựng 2 chân dung người dùng cụ thể đại diện cho đối tượng sinh viên.
- [x] Đã chốt danh sách use cases ưu tiên và phạm vi tính năng non-AI MVP.
- [x] Đã vạch rõ lộ trình phát triển AI (AI Roadmap từ v1 đến v4).
- [x] Đã thống nhất triết lý tổ chức dữ liệu theo trục Học kỳ $\rightarrow$ Môn học/Đồ án và nguyên tắc chống note rác.

> **Chuyển giao:** Tài liệu Bước 1 đóng vai trò đầu vào nghiệp vụ trực tiếp cho **Bước 2 – Thiết kế Mô hình Dữ liệu & Schema**.
