# Không gian học tập

Lớp học là cấp tổ chức cao nhất. Giáo viên tạo lớp; sinh viên tham gia lớp; ban cán sự quản lý việc chia nhóm. Nhóm trưởng sở hữu workspace của nhóm. Lớp học được quản lý ở tab **Lớp học**, không phải một workspace để ghi chú hoặc giao việc.

Mỗi tài khoản có một workspace **Cá nhân**. Dự án cá nhân và nhóm học là các workspace độc lập, ngang cấp trong bộ chọn ở thanh trên cùng. Tab **Không gian** liệt kê các workspace mà người dùng đã tham gia. Nút trên thanh đầu chỉ chọn workspace; tạo dự án cá nhân và xử lý lời mời nằm ở tab Không gian. Nhóm được tạo và quản lý qua lớp học; không thể tham gia nhóm trực tiếp bằng mã workspace.

Danh sách công việc, ghi chú và lịch nhận `workspaceId` để xác định phạm vi. API xác nhận membership `ACCEPTED` trước khi trả dữ liệu. Công việc trong workspace cá nhân là bản tổng hợp các công việc mà người dùng tạo hoặc được giao từ các workspace khác; bản ghi vẫn thuộc workspace nguồn. Ghi chú và sự kiện lịch không được tổng hợp theo cách đó. Nội dung nhóm lưu `workspaceId` riêng và chỉ thành viên hiện tại được đọc. Việc thêm/xóa thành viên và đổi nhóm trưởng được đồng bộ với workspace nhóm trong cùng transaction.

Ba migration mới thêm liên kết sự kiện lịch với dự án, loại workspace `GROUP`, liên kết nhóm và `workspaceId` trên nội dung. Migration tạo workspace cho các nhóm đã tồn tại và gắn nội dung cũ theo dự án, môn học hoặc workspace cá nhân khi có thể xác định. Chạy `npm run prisma:migrate:deploy` trong `backend` trước khi đưa API mới vào sử dụng. Không tự động chạy migration trên database đang dùng trong quá trình sửa mã.
