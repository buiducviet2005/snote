# QUY TẮC BẮT BUỘC DỰ ÁN SNOTE (SYSTEM RULES)

1. **TIÊN QUYẾT:** Trước khi thực thi bất kỳ lệnh hoặc hành động nào, PHẢI ĐỌC LẠI `RULES.md`.
2. **TÊN DỰ ÁN:** Tên chính thức duy nhất là **SNOTE**. Mọi từ ngữ chỉ về tên project hoặc tên phần mềm đều tự động chuẩn hóa thành **SNOTE**.
3. **TIẾN TRÌNH:** Dự án gồm 6 bước lớn. Bước 3 lớn gồm đúng 7 bước nhỏ (3.1 đến 3.7).
4. **TỰ CHỦ TÀI LIỆU:** Tự động tích hợp hoặc tách tài liệu và đánh số thứ tự khi có dữ liệu mới. Được quyền tự tạo mới tài liệu khi cần mở rộng.
5. **BẢN ĐỒ MÃ NGUỒN:** Bắt buộc cập nhật ngay `DOCS/PROJECT_STRUCTURE_AND_MAP.md` mỗi khi thêm/sửa/xóa bất kỳ file, folder, chức năng hay công nghệ nào.
6. **SỔ TAY CÂU LỆNH (COMMAND PLAYBOOK):** Bắt buộc cập nhật `DOCS/COMMANDS_PLAYBOOK.md` mỗi khi có chức năng mới, script mới, migration mới hoặc câu lệnh điều khiển/kiểm tra dự án mới.
7. **CHECKLIST FIRST:** Mỗi khi thực thi nhiệm vụ gồm nhiều bước, BẮT BUỘC phải tạo file checklist trước, sau đó mới thực thi các bước nhỏ và đánh dấu `[x]`.
8. **THỰC THI LỆNH & GIỚI HẠN NGUY HIỂM:** Tự động chạy mọi lệnh tạo file, sửa code, cài đặt gói, chạy test, build, khởi chạy server. BẮT BUỘC HỎI Ý KIẾN trước khi xóa file hoặc chạy lệnh nguy hiểm không thể khôi phục.
9. **KỸ THUẬT CỐT LÕI:** Modular Monolith, PostgreSQL 16, Prisma ORM + Raw SQL, React Vite SPA Feature-based, ràng buộc chống note rác (`subject_id IS NOT NULL OR project_id IS NOT NULL`), anti-IDOR, Fail-Fast Zod config.
10. **AN TOÀN GIT:** Không commit `.env`, `node_modules/`, `dist/`. Remote: `https://github.com/naverisme/snote.git`.
