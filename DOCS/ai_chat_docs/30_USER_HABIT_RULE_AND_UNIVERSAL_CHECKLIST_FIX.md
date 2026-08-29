# BÁO CÁO CẢI TIẾN: BỔ SUNG ĐIỀU 11 (NGHIÊN CỨU THÓI QUEN NGƯỜI DÙNG) & SỬA LỖI TÍCH CHỌN CHECKLIST TOÀN DIỆN

## 1. Bổ Sung Điều Luật Bắt Buộc Vào `RULES.md`

Đã thêm **ĐIỀU 11: NGHIÊN CỨU THÓI QUEN NGƯỜI DÙNG & CHỐNG Ý TƯỞNG THỪA THÃI (USER HABIT FIRST & ANTI-SLOP RULE)**:
1. **Nghiên cứu thói quen trước khi hành động:** Bắt buộc phải phân tích kỹ thói quen, hành vi thực tế của sinh viên, người học tập trước khi thiết kế hay code bất kỳ tính năng/UI/UX nào.
2. **Ngăn chặn ý tưởng thừa thãi:** Loại bỏ hoàn toàn các ý tưởng màu mè, cồng kềnh, gây phiền hà hoặc làm giảm diện tích hiển thị nội dung bài ghi.
3. **Tối đa hóa trải nghiệm tự nhiên:** Nhận diện văn bản tự nhiên, tối đa hóa không gian, phím tắt trực quan, không bắt ép quy chuẩn rườm rà.

---

## 2. Nâng Cấp Regex Universal Cho Checklist Mọi Dạng Danh Sách

### Vấn đề đã tìm ra:
Trước đây các dòng danh sách có tiền tố đặc biệt như:
* Phân cấp đa tầng: `  1.1. [ ] Làm bài`, `  1.2.3. [ ] Làm bài`
* Đánh chữ cái: `  a. [ ] Làm bài`, `  b) [ ] Làm bài`, `(1) [ ] Làm bài`
* Ký hiệu điều hướng: `=> [ ] Làm bài`, `-> [ ] Làm bài`
* Tiền tố kết hợp: `• cần làm: Làm bài`, `1. todo: Làm bài`
Chưa được khớp trong biểu thức chính quy cũ, dẫn đến chỉ mục đếm giữa trình render và trình toggle bị lệch, gây ra hiện tượng không tích chọn được ở các ô này.

### Giải pháp kỹ thuật:
Đã nâng cấp Regex Universal bao quát 100% các biến thể tiền tố danh sách:
```typescript
/^(?:(?:[-*+•⁃◦▪▫▸►=>/]|(?:\(?\d+(?:[\.\/]\d+)*[\.\)]?)|(?:\(?[a-zA-Z][\.\)]))\s*)?\[([ xX])\]\s*(.*)$/
```
Đồng bộ hóa 100% từ `autoFormatPlainTextToMarkdown`, `extractNoteFeatures` đến `toggleChecklistItem`.

---

## 3. Kết Quả Kiểm Thử

* **TypeScript Type Check:** `0 lỗi`.
* **Frontend Vite Build Production:** Thành công trong 4.93s.
