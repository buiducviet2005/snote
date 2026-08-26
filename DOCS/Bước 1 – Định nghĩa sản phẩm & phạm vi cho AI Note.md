# Bước 1 – Định nghĩa sản phẩm & phạm vi cho AI Note

## 1. Tên sản phẩm, tagline và tầm nhìn

**Tên sản phẩm:** AI Note – Hệ thống ghi chú và quản lý công việc học tập cho sinh viên.[^1]

**Tagline:** "Second brain cho sinh viên – một nơi để ghi chú, quản lý bài tập và chuẩn bị ôn thi một cách có tổ chức."[^1]

**Tầm nhìn (Vision):**

AI Note hướng tới trở thành "second brain" đồng hành cùng sinh viên trong suốt thời gian học đại học và có thể mang theo khi đi làm. Hệ thống là không gian duy nhất để ghi chú bài giảng, tài liệu, ý tưởng đồ án, kinh nghiệm thực tập và công việc học tập, tất cả đều được tổ chức theo học kỳ, môn học và dự án. Nền tảng non‑AI ổn định là lớp lõi, đáp ứng tốt nhu cầu ghi chú, quản lý công việc, lịch và tiến độ, sau đó mới dần bổ sung lớp AI hỗ trợ tóm tắt, phân loại, liên kết ghi chú và sinh vật liệu ôn tập mà không làm phức tạp trải nghiệm.[^1]

## 2. Đối tượng mục tiêu và persona

### Nhóm người dùng chính

Đối tượng mục tiêu chính là sinh viên đại học, ưu tiên nhóm ngành IT, kỹ thuật, kinh tế – những người thường có nhiều môn học mỗi học kỳ, nhiều bài tập, đồ án và ghi chú rải rác trên nhiều nền tảng. Họ cần một hệ thống đơn giản, rõ ràng để tập trung ghi chú và công việc học tập vào một chỗ, dễ tìm lại và theo dõi tiến độ.[^1]

### Persona 1 – "Minh" sinh viên IT năm 2

- Tuổi: 19, học ngành Công nghệ thông tin tại một trường đại học ở Việt Nam.[^1]
- Bối cảnh: mỗi học kỳ có 5–7 môn (Lập trình, Cơ sở dữ liệu, Mạng máy tính...), thường ghi chú bằng nhiều ứng dụng (Google Docs, Notion, ghi tay) nên khi ôn thi khó nhớ ghi chú nằm ở đâu.[^1]
- Vấn đề: hay quên deadline bài tập, không có cái nhìn tổng quan về những việc phải làm trong tuần; ghi chú bài giảng nhiều nhưng ít dùng lại vì khó tìm và không gắn với môn học rõ ràng.[^1]
- Nhu cầu: một nơi duy nhất để ghi chú theo môn/học kỳ, tạo task từ ghi chú, xem lịch task theo tuần, lọc theo môn và ưu tiên để biết nên làm gì trước.[^1]

### Persona 2 – "Lan" sinh viên Kinh tế làm đồ án nhóm

- Tuổi: 20, học ngành Kinh tế, thường làm đồ án nhóm 3–5 người mỗi kỳ.[^1]
- Bối cảnh: cần chia sẻ tài liệu, ghi chú họp nhóm, phân chia task cho các thành viên, nhưng hiện tại dùng nhiều nền tảng khác nhau (Zalo, Google Drive, Excel) nên thiếu bức tranh thống nhất.[^1]
- Vấn đề: khó theo dõi tiến độ từng người, tài liệu và ghi chú nhóm không gắn với cấu trúc môn học/học kỳ, việc ôn lại cho thi cuối kỳ cũng tốn thời gian.[^1]
- Nhu cầu: một board cho từng đồ án, nơi lưu ghi chú, tài liệu, task theo người phụ trách, vẫn tách biệt với ghi chú cá nhân, có thể xuất dữ liệu khi kết thúc đồ án.[^1]

### Bối cảnh sử dụng chính

Sinh viên dùng AI Note chủ yếu trên web/laptop tại nhà và trong thư viện để ghi chú bài giảng, xem và cập nhật danh sách công việc. Họ đôi khi truy cập trên điện thoại để xem lịch và task trong ngày, nhất là gần deadline hoặc trong thời gian ôn thi.[^1]

## 3. Vấn đề cốt lõi và use case ưu tiên

### Vấn đề cốt lõi

- Ghi chú rải rác trên nhiều ứng dụng, không gắn rõ ràng với môn học, học kỳ hoặc dự án nên khi cần ôn lại khó tìm đúng ngữ cảnh.[^1]
- Không có cái nhìn tổng quan về công việc học tập (bài tập, đọc chương, ôn thi, việc đồ án), dễ quên deadline hoặc sắp xếp ưu tiên không hợp lý.[^1]
- Ghi chú dài, thiếu cấu trúc, ít dùng lại; sinh viên bỏ công ghi chép nhưng thông tin dễ đi vào "note rác" – nằm đó mà không được khai thác khi ôn thi.[^1]
- Các công cụ hiện có thường quá tổng quát (dành cho mọi đối tượng) hoặc quá phức tạp, không xoay quanh các khái niệm quen thuộc với sinh viên như môn học, bài tập, kỳ thi, đồ án.[^1]

### Use case ưu tiên – nhóm cá nhân

- Ghi chú bài giảng: sinh viên tạo học kỳ, thêm các môn học, mỗi buổi học tạo ghi chú gắn môn và loại nội dung (bài giảng, bài tập, ôn thi), kèm tag theo chủ đề/chương.[^1]
- Tạo công việc (task) từ ghi chú: từ một ghi chú bài giảng hoặc bài tập, sinh viên tạo task tương ứng (ví dụ "Làm bài tập chương 3"), gắn deadline, mức ưu tiên và trạng thái.[^1]
- Xem công việc theo thời gian: sinh viên xem danh sách task theo hôm nay, tuần và tháng, lọc theo môn học và trạng thái để quyết định việc cần làm.[^1]
- Ôn thi theo chủ đề: gần kỳ thi, sinh viên lọc ghi chú theo môn, tag (ví dụ `normalization`, `midterm`) và loại nội dung `ôn thi`, kết hợp danh sách task ôn tập để có plan ôn thi rõ ràng.[^1]

### Use case ưu tiên – nhóm đồ án/nhóm

- Quản lý đồ án nhóm: tạo một dự án trong học kỳ, gắn các ghi chú họp nhóm, tài liệu tham khảo và danh sách task chia cho từng thành viên.[^1]
- Chia sẻ board: chia sẻ board hoặc collection note/task cho các thành viên nhóm với quyền xem/chỉnh sửa, nhưng vẫn giữ ghi chú cá nhân của mỗi sinh viên riêng tư.[^1]

## 4. Phạm vi chức năng: non‑AI core và AI roadmap

### Trong phạm vi MVP – non‑AI core

| Hạng mục | Có trong MVP non‑AI |
|----------|----------------------|
| Học kỳ | Tạo, sửa, lưu trạng thái học kỳ; gắn môn học và dự án theo từng học kỳ.[^1] |
| Môn học | Tạo, sửa, gắn với học kỳ; dùng làm trục chính để tổ chức notes và tasks.[^1] |
| Dự án/Đồ án | Tạo dự án trong học kỳ, gắn notes và tasks liên quan, hỗ trợ đồ án nhóm đơn giản.[^1] |
| Notes | CRUD ghi chú, format cơ bản, gắn môn/học kỳ/dự án, loại nội dung và tag.[^1] |
| Tasks | CRUD công việc với deadline, mức ưu tiên, trạng thái, liên kết với môn học/dự án/ghi chú.[^1] |
| Lịch | Lịch tuần/tháng hiển thị tasks theo ngày, tuần và tháng, có lọc theo môn/học kỳ.[^1] |
| Tiến độ | Màn hình tổng quan số lượng tasks đã xong/chưa xong, quá hạn theo môn/học kỳ/dự án.[^1] |
| Search + filter | Tìm kiếm ghi chú và task theo text, môn học, tag, loại nội dung, trạng thái, ưu tiên, thời gian.[^1] |
| Backup & export | Xuất ghi chú dạng Markdown, xuất dữ liệu cấu trúc (notes, tasks, schedule, tags) dạng JSON; hỗ trợ backup theo notebook/môn học/học kỳ.[^1] |

### Ngoài phạm vi MVP

- AI nâng cao (flashcards tự động, tạo quiz, gợi ý kế hoạch học tập chi tiết) – để dành cho các giai đoạn sau.[^1]
- Tích hợp với hệ thống quản lý học tập (LMS), Google Classroom, Google Calendar hoặc các dịch vụ cloud storage bên ngoài.[^1]
- Cộng tác thời gian thực kiểu Google Docs (editing đồng thời trên cùng một ghi chú).[^1]
- Ứng dụng native phức tạp (desktop app, mobile app offline với sync hai chiều hoàn chỉnh).[^1]
- Phân quyền ở cấp tổ chức/doanh nghiệp, nhiều layer role phức tạp.[^1]

### Roadmap AI tổng quan

- **AI v1 – Tóm tắt + gợi ý tag:** tóm tắt ghi chú dài thành phiên bản ngắn, rõ ràng; gợi ý tag/chủ đề và loại nội dung cho ghi chú để giảm thao tác tổ chức thủ công.[^1]
- **AI v2 – Liên kết ghi chú + Q&A:** gợi ý ghi chú liên quan theo cùng môn/chủ đề; cho phép hỏi‑đáp ngữ nghĩa trên kho notes/tài liệu của sinh viên.[^1]
- **AI v3 – Flashcards, quiz, study guide:** sinh flashcards và quiz từ ghi chú, sinh study guide cho từng môn/chương phục vụ ôn thi.[^1]
- **AI v4 – Gợi ý kế hoạch học tập:** dựa trên danh sách task, deadline và ưu tiên, gợi ý thứ tự ưu tiên và nội dung nên ôn trong tuần hoặc trước kỳ thi.[^1]

## 5. Triết lý tổ chức dữ liệu và thông tin

### Trục tổ chức chính

Cấu trúc tổ chức dữ liệu được chốt theo mô hình:

```text
Người dùng
└── Học kỳ
    ├── Môn học
    │   ├── Ghi chú
    │   └── Công việc
    └── Dự án / Đồ án
        ├── Ghi chú
        └── Công việc
```

Mỗi note và task đều thuộc về một người dùng (ownership theo user_id) và được gắn với ít nhất một ngữ cảnh là môn học hoặc dự án trong một học kỳ. Tag là cơ chế bổ sung để gắn chủ đề, chương, dạng bài, không thay thế trục Học kỳ/Môn học/Dự án.[^1]

### Loại note và trạng thái task

- **Loại note (note_type):**
  - `lecture` – ghi chú bài giảng trên lớp.[^1]
  - `assignment` – ghi chú về bài tập, đề bài, hướng dẫn làm.[^1]
  - `exam_review` – ghi chú phục vụ ôn thi (tóm tắt, keypoint).[^1]
  - `resource` – ghi chú về tài liệu tham khảo (link, sách, bài báo).[^1]
  - `idea` – ý tưởng đồ án, project, ghi chú sáng tạo cá nhân.[^1]

- **Trạng thái task (task_status):**
  - `TODO` – chưa bắt đầu.[^1]
  - `IN_PROGRESS` – đang thực hiện.[^1]
  - `DONE` – đã hoàn thành.[^1]

- **Mức độ ưu tiên (task_priority):**
  - `LOW` – việc quan trọng thấp, có thể làm sau.[^1]
  - `MEDIUM` – mức trung bình, nên làm nhưng không quá gấp.[^1]
  - `HIGH` – việc quan trọng/gấp (deadline gần, ảnh hưởng lớn đến điểm số).[^1]

### Nguyên tắc chống "note rác"

- Mỗi ghi chú phải được gắn với ít nhất một ngữ cảnh rõ ràng: môn học hoặc dự án trong một học kỳ, kèm loại note; ghi chú "rời rạc" không gắn ngữ cảnh là ngoại lệ.[^1]
- Khuyến khích mỗi ghi chú có ít nhất một tag chủ đề/chương (ví dụ `SQL`, `normalization`, `midterm`) để hỗ trợ filter và ôn thi.[^1]
- Giao diện tìm kiếm luôn đi kèm bộ lọc theo môn học, loại note và tag để đảm bảo sinh viên quay lại đúng "place" thay vì một danh sách kết quả hỗn hợp.[^1]

## 6. Tiêu chí hoàn thành Bước 1 và ràng buộc sản phẩm

### Tiêu chí "Bước 1 done"

- Có tài liệu mô tả rõ ràng tên sản phẩm, tagline và tầm nhìn dài hạn, phù hợp với charter dự án.[^1]
- Đã chốt nhóm người dùng chính và ít nhất 1–2 persona cụ thể, kèm bối cảnh sử dụng.[^1]
- Đã liệt kê các vấn đề cốt lõi và use case ưu tiên cho MVP, phân nhóm cá nhân và nhóm.[^1]
- Đã xác định phạm vi chức năng non‑AI core cho MVP và những phần ngoài phạm vi, cùng roadmap AI tổng quan.[^1]
- Đã chốt triết lý tổ chức dữ liệu: trục Học kỳ/Môn học/Dự án + Tag, loại note, trạng thái và ưu tiên task, cùng nguyên tắc chống note rác.[^1]

Khi tất cả các mục này được viết thành tài liệu và thống nhất, Bước 1 được coi là hoàn thành và có thể chuyển sang Bước 2 – thiết kế mô hình dữ liệu & schema.[^1]

### Ràng buộc sản phẩm (Constraints)

- Giao diện và luồng sử dụng phải đơn giản, trực quan, phù hợp cả với sinh viên năm nhất, không yêu cầu hiểu các mô hình quản lý dự án phức tạp.[^1]
- Dữ liệu phải có khả năng xuất ra định dạng mở (Markdown cho ghi chú, JSON cho cấu trúc notes/tasks/schedule/tags), tránh lock‑in vào một nền tảng.[^1]
- Nền tảng non‑AI core phải được ưu tiên về độ ổn định và an toàn dữ liệu; lớp AI chỉ là tùy chọn, có thể bật/tắt, không được làm rối giao diện hay phá vỡ cấu trúc dữ liệu.[^1]

### OKR/nguyên tắc giai đoạn đầu (tùy chọn)

- Sinh viên có thể tìm lại ghi chú cần thiết trong dưới 10 giây nếu nhớ môn học hoặc tag chính.[^1]
- Trong một học kỳ, không được mất dữ liệu notes/tasks dù sinh viên đổi thiết bị hoặc đăng nhập từ nhiều nơi khác nhau.[^1]
- Tỷ lệ sinh viên sử dụng tính năng search/filter ít nhất một lần mỗi tuần, cho thấy họ thực sự quay lại và dùng ghi chú thay vì chỉ ghi rồi bỏ.[^1]

---

## References

1. [chat/tôi muốn tiến trình được chia thành các bước lớn,.md](chat/tôi muốn tiến trình được chia thành các bước lớn,.md)

