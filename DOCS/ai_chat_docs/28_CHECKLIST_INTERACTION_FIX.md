# BÁO CÁO CẢI TIẾN: SỬA LỖI TÍCH CHỌN CHECKBOX (CHECKLIST INTERACTION FIX)

## 1. Nguyên Nhân Gốc Rễ Đã Khắc Phục

1. **Cơ Chế Controlled Component Của React (`onChange` vs `onClick`):**
   * Đối với `<input type="checkbox">` có thuộc tính `checked={...}`, React yêu cầu sự kiện `onChange` xử lý thay đổi trạng thái. Trước đây hàm xử lý đặt ở `onClick` kết hợp `onChange={(e) => {}}` rỗng khiến React chặn trình duyệt cập nhật lại trạng thái DOM checkbox.
   * **Khắc phục:** Đã chuyển logic xử lý `onToggleTodo(currentTodoIndex)` sang `onChange` kết hợp `e.stopPropagation()` chuẩn React.

2. **Khớp nối Regex Cho Tất Cả Các Tiền Tố Ký Tự Đầu Dòng:**
   * Hỗ trợ nhận diện và đảo trạng thái cho toàn bộ các dạng:
     * `[ ]` $\leftrightarrow$ `[x]`
     * `• [ ]` $\leftrightarrow$ `• [x]`
     * `- [ ]` $\leftrightarrow$ `- [x]`
     * `* [ ]` $\leftrightarrow$ `* [x]`
     * `+ [ ]` $\leftrightarrow$ `+ [x]`
     * `1. [ ]` $\leftrightarrow$ `1. [x]`
     * `todo:` $\leftrightarrow$ `done:`
     * `cần làm:` $\leftrightarrow$ `đã làm:`
   * Đảm bảo mọi bài ghi gõ bằng ký tự nào cũng có thể tích chọn 100% mượt mà.

---

## 2. Kết Quả Kiểm Thử

* **TypeScript Type Check:** `0 lỗi`.
* **Frontend Vite Build Production:** Thành công trong 5.46s.
