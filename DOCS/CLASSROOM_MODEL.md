# Mô hình lớp học và dự án môn học

Quan hệ chính: `CourseClass → StudyGroup → Project → ProgressReport`. Một lớp có tên môn học, mã lớp và học kỳ; giảng viên có thể quản lý nhiều lớp. `Subject` và `Semester` hiện là dữ liệu học tập cá nhân của từng sinh viên. Dự án không có `classId` vẫn là dự án tự do, có thể mời người dùng đã đăng ký mà không cần giảng viên.

| Vai trò | Quyền |
| --- | --- |
| Quản trị hệ thống (`ADMIN`) | Cấp vai trò `TEACHER` cho tài khoản hiện có; có thể tạo lớp do mình phụ trách. |
| Giảng viên của lớp | Sửa lớp, quản lý sinh viên và nhóm, quản lý dự án nhóm, xem và chấm báo cáo tiến độ. |
| Quản trị viên lớp | Quản lý sinh viên, nhóm và dự án nhóm; không được chấm báo cáo hoặc cấp quản trị viên lớp khác. |
| Trưởng nhóm | Quản lý thành viên và dự án của nhóm mình, gửi báo cáo. |
| Thành viên nhóm | Làm việc trong dự án nhóm và gửi báo cáo. |

Mỗi sinh viên thuộc tối đa một nhóm trong cùng lớp. Thành viên nhóm phải có tên trong lớp. Giảng viên sở hữu lớp nhưng không nằm trong danh sách sinh viên. Khi được thêm vào lớp, sinh viên tham gia ngay; lời mời vào dự án tự do vẫn cần chấp nhận.

Module `/api/classes` kiểm tra dữ liệu đầu vào và quyền tham gia lớp. Các API sửa dự án thông thường từ chối dự án lớp, để danh sách thành viên dự án luôn theo nhóm. Tạo ghi chú và công việc kiểm tra quyền với dự án và môn học liên quan. Thành viên nhóm và người quản lý lớp có thể mở workspace dự án.

`GET /api/classes/:id/overview` trả về tiến độ của các dự án nhóm. Giảng viên và quản trị viên lớp thấy toàn lớp; sinh viên chỉ thấy dự án của nhóm mình. Kết quả gồm báo cáo mới nhất, số báo cáo chờ đánh giá, hạn nộp và số công việc. Giao diện lớp có ba tab Tổng quan, Nhóm & dự án, Thành viên; `classId` và `tab` nằm trên URL để mở lại đúng ngữ cảnh.

Với **cơ sở dữ liệu PostgreSQL đã có dữ liệu**, sao lưu rồi áp dụng [SQL bổ sung cho lớp học](../backend/prisma/sql/20261013_classroom.sql) một lần; sau đó chạy `npm run prisma:generate --prefix backend`. Với **cơ sở dữ liệu mới**, dùng Prisma schema hiện tại theo hướng dẫn thiết lập. Kho mã chưa có lịch sử migration nền cho cơ sở dữ liệu cũ; cần tạo baseline trước khi dùng `prisma migrate deploy` trên môi trường vận hành lâu dài.
