# QUY TẮC BẮT BUỘC DỰ ÁN SNOTE (SYSTEM RULES)

1. **TIÊN QUYẾT:** Trước khi thực thi bất kỳ lệnh hoặc hành động nào, PHẢI ĐỌC LẠI `RULES.md`.
2. **TIẾN TRÌNH:** Dự án gồm 6 bước lớn. Bước 3 lớn gồm đúng 7 bước nhỏ (3.1 đến 3.7).
3. **TỰ CHỦ TÀI LIỆU:** Tự động tích hợp hoặc tách tài liệu và đánh số thứ tự khi có dữ liệu mới. Được quyền tự tạo mới hoặc xóa tài liệu trùng lặp mà không cần hỏi.
4. **BẢN ĐỒ MÃ NGUỒN:** Bắt buộc cập nhật ngay `DOCS/PROJECT_STRUCTURE_AND_MAP.md` mỗi khi thêm/sửa/xóa bất kỳ file, folder, chức năng hay công nghệ nào.
5. **CHECKLIST FIRST:** Mỗi khi thực thi nhiệm vụ gồm nhiều bước, BẮT BUỘC phải tạo file checklist trước, sau đó mới thực thi các bước nhỏ và đánh dấu `[x]`.
6. **KỸ THUẬT CỐT LÕI:** Modular Monolith, PostgreSQL 16, Prisma ORM + Raw SQL, React Vite SPA Feature-based, ràng buộc chống note rác (`subject_id IS NOT NULL OR project_id IS NOT NULL`), anti-IDOR, Fail-Fast Zod config.
7. **AN TOÀN GIT:** Không commit `.env`, `node_modules/`, `dist/`. Remote: `https://github.com/naverisme/snote.git`.
