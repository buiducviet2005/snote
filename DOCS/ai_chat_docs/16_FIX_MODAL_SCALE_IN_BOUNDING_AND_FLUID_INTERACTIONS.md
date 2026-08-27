# BÁO CÁO CẢI TIẾN: KHẮC PHỤC GIỚI HẠN KÍCH THƯỚC TRÊN THẺ ANIMATE-SCALE-IN & MỞ RỘNG KHÔNG GIAN TƯƠNG TÁC

## 1. Phân Tích Nguyên Nhân Gốc Rễ
1. **Lỗi Stacking & Containing Context do CSS Transform (`animate-scale-in`):**
   * Thuộc tính `@keyframes scaleIn` cũ sử dụng `animation-fill-mode: forwards` với `transform: scale(1)`.
   * Theo đặc tả kỹ thuật W3C CSS, bất kỳ phần tử nào có `transform` khác `none` sẽ tự động tạo ra một **Bounding Box & Stacking Context mới**.
   * Điều này khiến tất cả các phần tử con (như Dropdown menu, Popover, Datepicker, Multi-select list, Markdown split preview) bị "nhốt" và ép kích thước theo ma trận transform, gây cắt xén (clipping), giới hạn vùng cuộn và làm giảm khả năng tương tác.
2. **Kích thước Modal cố định chật chội:**
   * Modal cũ giới hạn `maxWidth="560px"` và `maxHeight="90vh"` với `overflow: hidden`, khiến các form phức tạp (Soạn thảo Markdown, Quản lý không gian đồ án, Giao việc đa thành viên) bị co hẹp.

---

## 2. Các Giải pháp Đã Triển Khai

### 2.1. Tối Ưu Hóa Keyframe & Giải Phóng Transform Stacking Context ([`global.css`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/assets/styles/global.css))
* Thay đổi `@keyframes scaleIn`:
  ```css
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.98) translateY(6px);
    }
    to {
      opacity: 1;
      transform: none; /* Giải phóng hoàn toàn bounding context sau khi animation kết thúc */
    }
  }

  .animate-scale-in {
    animation: scaleIn var(--duration-fast) var(--ease-smooth-out);
    will-change: opacity, transform;
  }
  ```
* Sau khi hiệu ứng mở xuất hiện mượt mà trong `250ms`, thuộc tính `transform` tự động trở về `none`, cho phép tất cả class con co giãn và tương tác 100% tự nhiên.

---

### 2.2. Thiết Kế Kiến Trúc Modal Co Giãn Tự Động (Fluid Unconstrained Modal) ([`Modal.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/components/common/Modal.tsx))
* Áp dụng hệ thống class chuyên dụng:
  * `.modal-overlay`: Phủ nền mờ 10px, hỗ trợ cuộn trang an toàn với `overscroll-behavior: contain`.
  * `.modal-dialog`: Kích thước linh hoạt theo viewport `min(96vw, maxWidth)`, chiều cao tối đa `calc(100dvh - 32px)`.
  * `.modal-body`: `flex: 1`, `min-height: 0`, `overflow-y: auto`, thanh cuộn tùy biến mượt mà, padding `clamp(16px, 2.5vw, 28px)` thoáng đãng.

---

### 2.3. Mở Rộng Kích Thước Các Modal Quan Trọng
* **Trình Soạn Thảo Ghi Chú ([`NoteModal.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/notes/components/NoteModal.tsx)):**
  * Mở rộng lên **`1200px`** trong chế độ Split (Chia đôi) và **`900px`** trong chế độ Viết/Xem trước.
  * Khung nhập liệu và Preview mở rộng chiều cao lên tới `550px`, cho phép viết bài dài thoải mái mà không bị gò bó.
* **Modal Giao Việc & Phân Công ([`TaskModal.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/tasks/components/TaskModal.tsx)):**
  * Mở rộng lên **`680px`**, danh sách thành viên hiển thị dạng thẻ lưới đa cột thoáng đãng.
* **Không Gian Làm Việc Đồ Án ([`ProjectWorkspaceModal.tsx`](file:///D:/WORKSPACE/PROJECT/CLASS_PROJECT/MNM_PROJECT/SNOTE/frontend/src/features/projects/components/ProjectWorkspaceModal.tsx)):**
  * Kích thước **`960px`**, thanh thêm việc nhanh và các thẻ nhiệm vụ hiển thị rộng rãi, đầy đủ thông tin.

---

## 3. Kết Quả Kiểm Thử

* `npm run build`: Monorepo build thành công 100% với 0 lỗi.
* Các phần tử con, dropdown menu, thanh cuộn, và popup đều hiển thị trơn tru, không còn tình trạng bị cắt xén hay giới hạn kích thước.
