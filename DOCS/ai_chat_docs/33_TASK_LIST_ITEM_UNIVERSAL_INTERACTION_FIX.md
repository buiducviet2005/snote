# BÁO CÁO TÁI THIẾT KẾ TOÀN DIỆN HỆ THỐNG CHECKLIST: EXACT SOURCE LINE INDEXING (SNOTE)

## 1. Phân Tích Bản Chất & Lỗi Kiến Trúc Cũ

1. **Vấn đề Đếm Chỉ Mục Động (Mutable Counter Race Condition):**
   * Trước đây, hệ thống dùng biến đếm toàn cục `todoCounter++` trong lúc duyệt AST của `ReactMarkdown`.
   * Trong chế độ `React.StrictMode` hoặc khi React thực hiện re-render / memoization, các AST node có thể được đánh giá theo thứ tự không đồng bộ với vòng lặp regex ở backend/parser.
   * Đồng thời, việc sử dụng thẻ `<label>` bọc `<input>` kích hoạt cơ chế kích hoạt kép (double-fire event) của trình duyệt khi input ở trạng thái controlled.
2. **Vấn đề Đồng Bộ Trạng Thái `noteToEdit` trong Modal:**
   * Khi người dùng toggle checkbox trong `NoteModal` hoặc `TaskModal`, dữ liệu ghi chú thay đổi trên DB nhưng thuộc tính `noteToEdit.content` trong bộ nhớ chưa được cập nhật kịp thời, dẫn tới việc khi modal re-render lại bị ghi đè bởi nội dung cũ.

---

## 2. Kiến Trúc Mới: Exact Source Line Indexing + Pointer Event Isolation

```
[ Raw Note Text: String ] 
        │ (Bảo toàn 1-1 từng dòng)
        ▼
[ autoFormatPlainTextToMarkdown ] 
        │
        ▼
[ ReactMarkdown AST Parser ]
        │
        ├──► components.li (task-list-item):
        │    - Trích xuất CHỈ MỤC DÒNG NGUỒN CHÍNH XÁC: node.position.start.line - 1
        │    - Bắt sự kiện onClick duy nhất trên toàn dòng <li>
        │    - Chặn nổi bọt e.stopPropagation() (tránh mở Modal NoteCard)
        │    - Gọi onToggleTodo(lineIndex) chính xác O(1)
        │
        └──► components.input (checkbox):
             - readOnly, tabIndex={-1}
             - pointerEvents: 'none' (cô lập hoàn toàn, tránh double-click / browser label quirks)
```

### ✨ Ưu Điểm Đột Phá:
1. **Chỉ Mục Dòng Tuyệt Đối (Zero Race Condition):**
   * Không còn bất kỳ biến đếm phụ hay logic phỏng đoán nào. Dòng 4 trong văn bản có AST line = 4 $\rightarrow$ `lineIndex = 3`.
   * `toggleLineAtIndex(content, lineIndex)` trực tiếp thay đổi `lines[lineIndex]` với độ phức tạp $O(1)$, không phụ thuộc vào việc có bao nhiêu code blocks hay đoạn văn ở phía trên.
2. **Cô Lập Sự Kiện Bằng `pointerEvents: 'none'`:**
   * Loại bỏ hoàn toàn xung đột giữa `<label>` và `<input>`, đảm bảo mỗi cú click chỉ kích hoạt đúng 1 lần duy nhất.
3. **Bảo Toàn Trạng Thái Trong Modal:**
   * Đồng bộ ngay `noteToEdit.content` / `taskToEdit.description` khi toggle, ngăn chặn tình trạng re-render khôi phục dữ liệu cũ.

---

## 3. Kết Quả Kiểm Thử & Xác Nhận

* `npm run type-check`: 🟢 **0 lỗi (TypeScript toàn dự án pass 100%)**
* `npm run build --prefix frontend`: 🟢 **Build Vite production thành công trong 8.37s**
* Dịch vụ Backend: `http://localhost:4000` (Online)
* Dịch vụ Frontend: `http://localhost:5173` (Online)
